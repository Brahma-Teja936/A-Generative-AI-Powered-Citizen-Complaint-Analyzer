from datetime import datetime, timedelta
from bson import ObjectId
from flask import Blueprint, request, jsonify
from database.mongodb import db
from auth.jwt_utils import admin_required, check_password, generate_token
from ml.analysis_service import analysis_service
from services.email_service import (
    send_department_notification,
    send_progress_update_email,
    send_resolution_email,
    retry_email
)
from services.notification_service import create_notification
from services.audit_service import log_audit

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

@admin_bp.route("/login", methods=["POST"])
def admin_login():
    """Administrator login endpoint with audit logging"""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400

    user = db.users.find_one({"email": email})
    if not user or not check_password(password, user.get("password_hash", "")):
        return jsonify({"success": False, "message": "Invalid administrator credentials"}), 401

    if user.get("role") != "admin":
        return jsonify({"success": False, "message": "Access denied: Administrator privileges required"}), 403

    token = generate_token(user)

    log_audit(
        admin_id=str(user["_id"]),
        admin_email=user["email"],
        action="Admin Login",
        metadata={"ip": request.remote_addr}
    )

    return jsonify({
        "success": True,
        "message": "Administrator login successful",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": "admin"
        }
    }), 200

@admin_bp.route("/dashboard", methods=["GET"])
@admin_required
def get_dashboard():
    """
    Administrator Dashboard with real-time statistics from MongoDB aggregations
    """
    total = db.complaints.count_documents({})
    pending = db.complaints.count_documents({"status": "PENDING"})
    under_review = db.complaints.count_documents({"status": "UNDER_REVIEW"})
    assigned = db.complaints.count_documents({"status": "ASSIGNED"})
    in_progress = db.complaints.count_documents({"status": "IN_PROGRESS"})
    resolved = db.complaints.count_documents({"status": {"$in": ["RESOLVED", "CLOSED"]}})

    # High Priority & Critical counts
    high_priority = db.complaints.count_documents({
        "$or": [
            {"admin_decision.priority": {"$in": ["HIGH", "URGENT"]}},
            {"admin_decision.priority": None, "ai_analysis.priority": {"$in": ["HIGH", "URGENT"]}}
        ]
    })
    critical = db.complaints.count_documents({
        "$or": [
            {"admin_decision.severity": "CRITICAL"},
            {"admin_decision.severity": None, "ai_analysis.severity": "CRITICAL"},
            {"ai_analysis.safety_risk": "VERY HIGH"}
        ]
    })

    # Overdue count (pending/active complaints past their target response window)
    now = datetime.utcnow()
    pipeline_overdue = [
        {"$match": {"status": {"$in": ["PENDING", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"]}}},
        {"$project": {
            "created_at": 1,
            "urgency": {"$ifNull": ["$admin_decision.urgency", "$ai_analysis.urgency"]}
        }}
    ]
    active_comps = list(db.complaints.aggregate(pipeline_overdue))
    overdue_count = 0
    for c in active_comps:
        created = c.get("created_at", now)
        urg = c.get("urgency", "ROUTINE")
        delta = now - created
        if urg == "IMMEDIATE" and delta > timedelta(hours=4):
            overdue_count += 1
        elif urg == "WITHIN 24 HOURS" and delta > timedelta(hours=24):
            overdue_count += 1
        elif urg == "WITHIN 3 DAYS" and delta > timedelta(days=3):
            overdue_count += 1
        elif urg == "WITHIN 7 DAYS" and delta > timedelta(days=7):
            overdue_count += 1

    # 1. Distribution by Department
    dept_pipe = [
        {"$group": {
            "_id": {"$ifNull": ["$assignment.department_name", {"$ifNull": ["$admin_decision.department", "$ai_analysis.department"]}]},
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}}
    ]
    by_department = [{"name": r["_id"] or "Unassigned", "count": r["count"]} for r in db.complaints.aggregate(dept_pipe)]

    # 2. Distribution by Severity
    sev_pipe = [
        {"$group": {
            "_id": {"$ifNull": ["$admin_decision.severity", "$ai_analysis.severity"]},
            "count": {"$sum": 1}
        }}
    ]
    by_severity = [{"name": r["_id"] or "Unknown", "count": r["count"]} for r in db.complaints.aggregate(sev_pipe)]

    # 3. Distribution by Priority
    pri_pipe = [
        {"$group": {
            "_id": {"$ifNull": ["$admin_decision.priority", "$ai_analysis.priority"]},
            "count": {"$sum": 1}
        }}
    ]
    by_priority = [{"name": r["_id"] or "Unknown", "count": r["count"]} for r in db.complaints.aggregate(pri_pipe)]

    # 4. Distribution by Status
    status_pipe = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    by_status = [{"name": r["_id"], "count": r["count"]} for r in db.complaints.aggregate(status_pipe)]

    # 5. Complaints trend (last 7 days)
    by_time = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        cnt = db.complaints.count_documents({"created_at": {"$gte": day_start, "$lt": day_end}})
        by_time.append({"date": day_start.strftime("%b %d"), "count": cnt})

    # Recent complaints table
    recent = []
    for c in db.complaints.find().sort("created_at", -1).limit(10):
        c["id"] = str(c.pop("_id"))
        recent.append(c)

    return jsonify({
        "success": True,
        "metrics": {
            "total_complaints": total,
            "pending": pending,
            "under_review": under_review,
            "assigned": assigned,
            "in_progress": in_progress,
            "resolved": resolved,
            "high_priority": high_priority,
            "critical": critical,
            "overdue": overdue_count,
            "resolution_rate": round((resolved / total * 100), 1) if total > 0 else 0.0
        },
        "charts": {
            "by_department": by_department,
            "by_severity": by_severity,
            "by_priority": by_priority,
            "by_status": by_status,
            "by_time": by_time
        },
        "recent_complaints": recent
    }), 200

@admin_bp.route("/complaints", methods=["GET"])
@admin_required
def get_complaints():
    """
    Search, filter, sort, and paginate complaints for admin table
    """
    search = request.args.get("search", "").strip()
    department = request.args.get("department", "ALL")
    severity = request.args.get("severity", "ALL")
    priority = request.args.get("priority", "ALL")
    status = request.args.get("status", "ALL")
    validity = request.args.get("validity", "ALL")
    sort_by = request.args.get("sort_by", "created_at")
    sort_order = -1 if request.args.get("sort_order", "desc") == "desc" else 1
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 15))

    query = {}

    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"complaint_id": search_regex},
            {"citizen_name": search_regex},
            {"citizen_email": search_regex},
            {"title": search_regex},
            {"description": search_regex},
            {"location": search_regex}
        ]

    if department != "ALL":
        query["$or"] = [
            {"assignment.department_name": department},
            {"admin_decision.department": department},
            {"ai_analysis.department": department}
        ]

    if severity != "ALL":
        query["$or"] = [
            {"admin_decision.severity": severity},
            {"admin_decision.severity": None, "ai_analysis.severity": severity}
        ]

    if priority != "ALL":
        query["$or"] = [
            {"admin_decision.priority": priority},
            {"admin_decision.priority": None, "ai_analysis.priority": priority}
        ]

    if status != "ALL":
        query["status"] = status

    if validity != "ALL":
        query["ai_analysis.validity"] = validity

    total = db.complaints.count_documents(query)
    cursor = db.complaints.find(query).sort(sort_by, sort_order).skip((page - 1) * limit).limit(limit)

    results = []
    for c in cursor:
        c["id"] = str(c.pop("_id"))
        results.append(c)

    return jsonify({
        "success": True,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total > 0 else 1,
        "complaints": results
    }), 200

@admin_bp.route("/complaints/critical", methods=["GET"])
@admin_required
def get_critical_complaints():
    """Complaints with CRITICAL severity or VERY HIGH safety risk"""
    query = {
        "$or": [
            {"admin_decision.severity": "CRITICAL"},
            {"admin_decision.severity": None, "ai_analysis.severity": "CRITICAL"},
            {"ai_analysis.safety_risk": "VERY HIGH"}
        ],
        "status": {"$nin": ["RESOLVED", "CLOSED"]}
    }
    cursor = db.complaints.find(query).sort("created_at", -1).limit(50)
    results = []
    for c in cursor:
        c["id"] = str(c.pop("_id"))
        results.append(c)
    return jsonify({"success": True, "total": len(results), "complaints": results}), 200

@admin_bp.route("/complaints/urgent", methods=["GET"])
@admin_required
def get_urgent_complaints():
    """Complaints with URGENT priority or IMMEDIATE urgency"""
    query = {
        "$or": [
            {"admin_decision.priority": "URGENT"},
            {"admin_decision.priority": None, "ai_analysis.priority": "URGENT"},
            {"ai_analysis.urgency": {"$in": ["IMMEDIATE", "WITHIN 24 HOURS"]}}
        ],
        "status": {"$nin": ["RESOLVED", "CLOSED"]}
    }
    cursor = db.complaints.find(query).sort("created_at", -1).limit(50)
    results = []
    for c in cursor:
        c["id"] = str(c.pop("_id"))
        results.append(c)
    return jsonify({"success": True, "total": len(results), "complaints": results}), 200

@admin_bp.route("/complaints/<id>", methods=["GET"])
@admin_required
def get_complaint_detail(id: str):
    """
    Get full complaint details including comprehensive AI analysis report,
    timeline, and email dispatch history.
    """
    query = {"$or": [{"complaint_id": id}, {"_id": ObjectId(id)}]} if ObjectId.is_valid(id) else {"complaint_id": id}
    complaint = db.complaints.find_one(query)

    if not complaint:
        return jsonify({"success": False, "message": "Complaint not found"}), 404

    complaint["id"] = str(complaint.pop("_id"))
    cid = complaint["complaint_id"]

    # Fetch progress timeline
    timeline = []
    for t in db.complaint_progress.find({"complaint_id": cid}).sort("created_at", 1):
        t["id"] = str(t.pop("_id"))
        timeline.append(t)

    # Fetch email logs
    emails = []
    for em in db.email_logs.find({"complaint_id": cid}).sort("created_at", -1):
        em["id"] = str(em.pop("_id"))
        emails.append(em)

    # If duplicate complaint was detected, fetch summary of similar complaint
    similar_comp = None
    sim_id = complaint.get("ai_analysis", {}).get("similar_complaint_id")
    if sim_id:
        s_doc = db.complaints.find_one({"complaint_id": sim_id}, {"title": 1, "description": 1, "status": 1, "created_at": 1})
        if s_doc:
            similar_comp = {
                "complaint_id": sim_id,
                "title": s_doc.get("title"),
                "description": s_doc.get("description"),
                "status": s_doc.get("status"),
                "created_at": s_doc.get("created_at")
            }

    # Log audit event
    log_audit(
        admin_id=request.current_user["id"],
        admin_email=request.current_user["email"],
        action="Complaint Viewed",
        complaint_id=cid
    )

    return jsonify({
        "success": True,
        "complaint": complaint,
        "timeline": timeline,
        "email_logs": emails,
        "similar_complaint": similar_comp
    }), 200

@admin_bp.route("/complaints/<id>/analyze", methods=["POST"])
@admin_required
def reanalyze_complaint(id: str):
    """Re-run AI analysis on complaint"""
    query = {"$or": [{"complaint_id": id}, {"_id": ObjectId(id)}]} if ObjectId.is_valid(id) else {"complaint_id": id}
    comp = db.complaints.find_one(query)
    if not comp:
        return jsonify({"success": False, "message": "Complaint not found"}), 404

    existing_comps = list(db.complaints.find(
        {"complaint_id": {"$ne": comp["complaint_id"]}},
        {"complaint_id": 1, "description": 1, "created_at": 1}
    ).sort("created_at", -1).limit(100))

    combined = f"{comp.get('title')}. {comp.get('description')}"
    new_analysis = analysis_service.analyze(
        complaint_text=combined,
        user_location=comp.get("location"),
        existing_complaints=existing_comps
    )

    db.complaints.update_one(
        {"_id": comp["_id"]},
        {"$set": {"ai_analysis": new_analysis, "updated_at": datetime.utcnow()}}
    )

    return jsonify({"success": True, "ai_analysis": new_analysis}), 200

@admin_bp.route("/complaints/<id>/review", methods=["POST"])
@admin_required
def review_complaint(id: str):
    """
    Admin marks complaint as reviewed.
    Sets reviewed = true, reviewed_by, reviewed_at, creates audit log, updates status.
    """
    query = {"$or": [{"complaint_id": id}, {"_id": ObjectId(id)}]} if ObjectId.is_valid(id) else {"complaint_id": id}
    comp = db.complaints.find_one(query)
    if not comp:
        return jsonify({"success": False, "message": "Complaint not found"}), 404

    now = datetime.utcnow()
    admin_name = request.current_user["name"]

    update_fields = {
        "review.reviewed": True,
        "review.reviewed_by": admin_name,
        "review.reviewed_at": now,
        "updated_at": now
    }

    if comp.get("status") == "PENDING":
        update_fields["status"] = "UNDER_REVIEW"
        # Add timeline event
        db.complaint_progress.insert_one({
            "complaint_id": comp["complaint_id"],
            "status": "UNDER_REVIEW",
            "description": f"Complaint reviewed by administrator {admin_name}.",
            "department": comp.get("ai_analysis", {}).get("department"),
            "updated_by": admin_name,
            "created_at": now
        })

    db.complaints.update_one({"_id": comp["_id"]}, {"$set": update_fields})

    log_audit(
        admin_id=request.current_user["id"],
        admin_email=request.current_user["email"],
        action="Complaint Reviewed",
        complaint_id=comp["complaint_id"],
        new_value={"reviewed": True, "reviewed_by": admin_name}
    )

    return jsonify({"success": True, "message": "Complaint marked as reviewed"}), 200

@admin_bp.route("/complaints/<id>/decision", methods=["PUT"])
@admin_required
def save_admin_decision(id: str):
    """
    Saves final administrative decision / override.
    NEVER overwrites ai_analysis values; stores in admin_decision.
    """
    query = {"$or": [{"complaint_id": id}, {"_id": ObjectId(id)}]} if ObjectId.is_valid(id) else {"complaint_id": id}
    comp = db.complaints.find_one(query)
    if not comp:
        return jsonify({"success": False, "message": "Complaint not found"}), 404

    data = request.get_json() or {}
    now = datetime.utcnow()
    admin_name = request.current_user["name"]

    ai = comp.get("ai_analysis", {})
    decision = comp.get("admin_decision") or {}

    new_dept = data.get("department", decision.get("department") or ai.get("department"))
    new_cat = data.get("category", decision.get("category") or ai.get("category"))
    new_subcat = data.get("subcategory", decision.get("subcategory") or ai.get("subcategory"))
    new_sev = data.get("severity", decision.get("severity") or ai.get("severity"))
    new_pri = data.get("priority", decision.get("priority") or ai.get("priority"))
    new_urg = data.get("urgency", decision.get("urgency") or ai.get("urgency"))
    new_risk = data.get("safety_risk", decision.get("safety_risk") or ai.get("safety_risk"))
    new_impact = data.get("public_impact", decision.get("public_impact") or ai.get("public_impact"))
    notes = data.get("notes", "")
    override_reason = data.get("override_reason", "")

    is_overridden = bool(
        new_dept != ai.get("department") or
        new_sev != ai.get("severity") or
        new_pri != ai.get("priority") or
        new_urg != ai.get("urgency") or
        new_risk != ai.get("safety_risk")
    )

    admin_decision_doc = {
        "category": new_cat,
        "subcategory": new_subcat,
        "department": new_dept,
        "secondary_department": data.get("secondary_department"),
        "severity": new_sev,
        "priority": new_pri,
        "urgency": new_urg,
        "safety_risk": new_risk,
        "public_impact": new_impact,
        "response_time": data.get("response_time"),
        "notes": notes,
        "overridden": is_overridden,
        "override_reason": override_reason if is_overridden else None,
        "overridden_by": admin_name if is_overridden else None,
        "overridden_at": now if is_overridden else None
    }

    db.complaints.update_one(
        {"_id": comp["_id"]},
        {"$set": {"admin_decision": admin_decision_doc, "updated_at": now}}
    )

    log_audit(
        admin_id=request.current_user["id"],
        admin_email=request.current_user["email"],
        action="AI Override" if is_overridden else "Administrative Decision Saved",
        complaint_id=comp["complaint_id"],
        old_value=ai,
        new_value=admin_decision_doc
    )

    return jsonify({
        "success": True,
        "message": "Administrative decision saved successfully",
        "admin_decision": admin_decision_doc
    }), 200

@admin_bp.route("/complaints/<id>/assign", methods=["PUT"])
@admin_required
def assign_department(id: str):
    """
    Assign complaint to department from MongoDB departments collection.
    Sends department notification email with complete AI report.
    Creates citizen notification.
    """
    query = {"$or": [{"complaint_id": id}, {"_id": ObjectId(id)}]} if ObjectId.is_valid(id) else {"complaint_id": id}
    comp = db.complaints.find_one(query)
    if not comp:
        return jsonify({"success": False, "message": "Complaint not found"}), 404

    data = request.get_json() or {}
    dept_id = data.get("department_id")
    dept_name = data.get("department_name", "").strip()

    # Look up department in MongoDB
    dept_doc = None
    if dept_id and ObjectId.is_valid(dept_id):
        dept_doc = db.departments.find_one({"_id": ObjectId(dept_id)})
    elif dept_name:
        dept_doc = db.departments.find_one({"department_name": dept_name})

    if not dept_doc:
        return jsonify({"success": False, "message": "Selected department was not found in database"}), 400

    now = datetime.utcnow()
    admin_name = request.current_user["name"]

    assignment_doc = {
        "department_id": str(dept_doc["_id"]),
        "department_name": dept_doc["department_name"],
        "department_email": dept_doc.get("department_email"),
        "assigned_by": admin_name,
        "assigned_at": now
    }

    # Update complaint
    db.complaints.update_one(
        {"_id": comp["_id"]},
        {
            "$set": {
                "assignment": assignment_doc,
                "status": "ASSIGNED",
                "updated_at": now
            }
        }
    )

    # Timeline event
    db.complaint_progress.insert_one({
        "complaint_id": comp["complaint_id"],
        "status": "ASSIGNED",
        "description": f"Assigned to {dept_doc['department_name']} by {admin_name}.",
        "department": dept_doc["department_name"],
        "updated_by": admin_name,
        "created_at": now
    })

    # Citizen Notification
    create_notification(
        user_id=comp["citizen_id"],
        role="client",
        complaint_id=comp["complaint_id"],
        title=f"Complaint Assigned: {comp['complaint_id']}",
        message=f"Your complaint #{comp['complaint_id']} has been assigned to the {dept_doc['department_name']} department.",
        notif_type="DEPARTMENT_ASSIGNED"
    )

    # Department Notification Email
    email_res = send_department_notification(
        complaint=comp,
        dept_name=dept_doc["department_name"],
        dept_email=dept_doc.get("department_email", "dept@city.gov")
    )

    log_audit(
        admin_id=request.current_user["id"],
        admin_email=request.current_user["email"],
        action="Department Assignment",
        complaint_id=comp["complaint_id"],
        new_value=assignment_doc
    )

    return jsonify({
        "success": True,
        "message": f"Assigned to {dept_doc['department_name']}. Department notified.",
        "assignment": assignment_doc,
        "email_status": email_res.get("status")
    }), 200

@admin_bp.route("/complaints/<id>/progress", methods=["POST"])
@admin_required
def add_progress(id: str):
    """
    Updates progress status: PENDING, UNDER_REVIEW, ASSIGNED, IN_PROGRESS, ON_HOLD, RESOLVED, CLOSED, REJECTED.
    Requires status description. Never overwrites historical events.
    """
    query = {"$or": [{"complaint_id": id}, {"_id": ObjectId(id)}]} if ObjectId.is_valid(id) else {"complaint_id": id}
    comp = db.complaints.find_one(query)
    if not comp:
        return jsonify({"success": False, "message": "Complaint not found"}), 404

    data = request.get_json() or {}
    new_status = data.get("status", "").strip().upper()
    description = data.get("description", "").strip()

    valid_statuses = {"PENDING", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED", "REJECTED"}
    if new_status not in valid_statuses:
        return jsonify({"success": False, "message": f"Invalid status. Allowed: {', '.join(valid_statuses)}"}), 400

    if not description:
        return jsonify({"success": False, "message": "Progress description is required"}), 400

    now = datetime.utcnow()
    admin_name = request.current_user["name"]
    dept = comp.get("assignment", {}).get("department_name") or comp.get("ai_analysis", {}).get("department", "Civic Services")

    # Record progress event in complaint_progress collection
    db.complaint_progress.insert_one({
        "complaint_id": comp["complaint_id"],
        "status": new_status,
        "description": description,
        "department": dept,
        "updated_by": admin_name,
        "created_at": now
    })

    # Update complaint status
    db.complaints.update_one(
        {"_id": comp["_id"]},
        {"$set": {"status": new_status, "updated_at": now}}
    )

    # Citizen notification
    create_notification(
        user_id=comp["citizen_id"],
        role="client",
        complaint_id=comp["complaint_id"],
        title=f"Status Update: {comp['complaint_id']} - {new_status}",
        message=description,
        notif_type="PROGRESS_UPDATE"
    )

    # Send progress update email
    send_progress_update_email(
        complaint=comp,
        status=new_status,
        description=description,
        citizen_email=comp["citizen_email"],
        citizen_name=comp["citizen_name"]
    )

    log_audit(
        admin_id=request.current_user["id"],
        admin_email=request.current_user["email"],
        action="Status Change",
        complaint_id=comp["complaint_id"],
        old_value=comp.get("status"),
        new_value=new_status,
        metadata={"description": description}
    )

    return jsonify({
        "success": True,
        "message": f"Status updated to {new_status}",
        "status": new_status,
        "description": description
    }), 200

@admin_bp.route("/complaints/<id>/resolve", methods=["POST"])
@admin_required
def resolve_complaint(id: str):
    """
    Resolves complaint. Requires resolution description.
    Sets status = RESOLVED, resolution_description, resolved_by, resolved_at.
    Dispatches final resolution email.
    """
    query = {"$or": [{"complaint_id": id}, {"_id": ObjectId(id)}]} if ObjectId.is_valid(id) else {"complaint_id": id}
    comp = db.complaints.find_one(query)
    if not comp:
        return jsonify({"success": False, "message": "Complaint not found"}), 404

    data = request.get_json() or {}
    resolution_desc = (
        data.get("resolution_description")
        or data.get("resolution_notes")
        or data.get("description")
        or ""
    ).strip()

    if not resolution_desc:
        return jsonify({"success": False, "message": "Resolution description is required before resolving"}), 400

    now = datetime.utcnow()
    admin_name = request.current_user["name"]
    dept = comp.get("assignment", {}).get("department_name") or comp.get("ai_analysis", {}).get("department", "Civic Services")

    resolution_doc = {
        "description": resolution_desc,
        "resolved_by": admin_name,
        "resolved_at": now
    }

    # Update complaint
    db.complaints.update_one(
        {"_id": comp["_id"]},
        {
            "$set": {
                "status": "RESOLVED",
                "resolution": resolution_doc,
                "updated_at": now
            }
        }
    )

    # Timeline event
    db.complaint_progress.insert_one({
        "complaint_id": comp["complaint_id"],
        "status": "RESOLVED",
        "description": resolution_desc,
        "department": dept,
        "updated_by": admin_name,
        "created_at": now
    })

    # Citizen notification
    create_notification(
        user_id=comp["citizen_id"],
        role="client",
        complaint_id=comp["complaint_id"],
        title=f"Complaint Resolved: {comp['complaint_id']}",
        message=f"Your complaint has been successfully resolved: {resolution_desc}",
        notif_type="COMPLAINT_RESOLVED"
    )

    # Final resolution email (idempotent duplicate protected)
    email_res = send_resolution_email(
        complaint=comp,
        citizen_name=comp["citizen_name"],
        citizen_email=comp["citizen_email"],
        resolution_desc=resolution_desc
    )

    log_audit(
        admin_id=request.current_user["id"],
        admin_email=request.current_user["email"],
        action="Complaint Resolved",
        complaint_id=comp["complaint_id"],
        new_value=resolution_doc
    )

    return jsonify({
        "success": True,
        "message": "Complaint marked as RESOLVED and citizen notified.",
        "resolution": resolution_doc,
        "email_status": email_res.get("status")
    }), 200

@admin_bp.route("/analytics", methods=["GET"])
@admin_required
def get_analytics():
    """Detailed analytics using MongoDB aggregation pipelines"""
    total = db.complaints.count_documents({})
    resolved = db.complaints.count_documents({"status": {"$in": ["RESOLVED", "CLOSED"]}})
    pending = db.complaints.count_documents({"status": "PENDING"})
    critical = db.complaints.count_documents({
        "$or": [
            {"admin_decision.severity": "CRITICAL"},
            {"admin_decision.severity": None, "ai_analysis.severity": "CRITICAL"}
        ]
    })
    urgent = db.complaints.count_documents({
        "$or": [
            {"admin_decision.priority": "URGENT"},
            {"admin_decision.priority": None, "ai_analysis.priority": "URGENT"}
        ]
    })

    # Calculate average resolution time
    resolved_cursor = db.complaints.find(
        {"status": {"$in": ["RESOLVED", "CLOSED"]}, "resolution.resolved_at": {"$ne": None}},
        {"created_at": 1, "resolution.resolved_at": 1}
    )
    durations = []
    for r in resolved_cursor:
        c_at = r.get("created_at")
        r_at = r.get("resolution", {}).get("resolved_at")
        if c_at and r_at:
            durations.append((r_at - c_at).total_seconds() / 86400.0)
    avg_resolution_days = round(sum(durations) / len(durations), 1) if durations else 1.2

    # By Department
    dept_pipe = [
        {"$group": {
            "_id": {"$ifNull": ["$assignment.department_name", {"$ifNull": ["$admin_decision.department", "$ai_analysis.department"]}]},
            "total": {"$sum": 1},
            "resolved": {"$sum": {"$cond": [{"$in": ["$status", ["RESOLVED", "CLOSED"]]}, 1, 0]}}
        }},
        {"$sort": {"total": -1}}
    ]
    by_dept = [{"name": r["_id"] or "Unassigned", "total": r["total"], "resolved": r["resolved"]} for r in db.complaints.aggregate(dept_pipe)]

    # By Category
    cat_pipe = [
        {"$group": {
            "_id": {"$ifNull": ["$admin_decision.category", "$ai_analysis.category"]},
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}}
    ]
    by_category = [{"name": r["_id"] or "Other", "count": r["count"]} for r in db.complaints.aggregate(cat_pipe)]

    # By Severity
    sev_pipe = [
        {"$group": {
            "_id": {"$ifNull": ["$admin_decision.severity", "$ai_analysis.severity"]},
            "count": {"$sum": 1}
        }}
    ]
    by_severity = [{"name": r["_id"] or "Unknown", "count": r["count"]} for r in db.complaints.aggregate(sev_pipe)]

    # By Priority
    pri_pipe = [
        {"$group": {
            "_id": {"$ifNull": ["$admin_decision.priority", "$ai_analysis.priority"]},
            "count": {"$sum": 1}
        }}
    ]
    by_priority = [{"name": r["_id"] or "Unknown", "count": r["count"]} for r in db.complaints.aggregate(pri_pipe)]

    # By Status
    status_pipe = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    by_status = [{"name": r["_id"], "count": r["count"]} for r in db.complaints.aggregate(status_pipe)]

    return jsonify({
        "success": True,
        "summary": {
            "total_complaints": total,
            "resolved": resolved,
            "pending": pending,
            "critical": critical,
            "urgent": urgent,
            "resolution_rate": round((resolved / total * 100), 1) if total > 0 else 0.0,
            "avg_resolution_days": avg_resolution_days
        },
        "by_department": by_dept,
        "by_category": by_category,
        "by_severity": by_severity,
        "by_priority": by_priority,
        "by_status": by_status
    }), 200

@admin_bp.route("/departments", methods=["GET"])
@admin_required
def get_departments():
    """List all departments from MongoDB departments collection"""
    cursor = db.departments.find().sort("department_name", 1)
    results = []
    for d in cursor:
        d["id"] = str(d.pop("_id"))
        # Count assigned complaints
        d["complaint_count"] = db.complaints.count_documents({"assignment.department_name": d["department_name"]})
        results.append(d)
    return jsonify({"success": True, "departments": results}), 200

@admin_bp.route("/departments", methods=["POST"])
@admin_required
def create_department():
    """Create new department"""
    data = request.get_json() or {}
    name = data.get("department_name", "").strip()
    email = data.get("department_email", "").strip().lower()
    desc = data.get("description", "").strip()

    if not name or not email:
        return jsonify({"success": False, "message": "Department Name and Email are required"}), 400

    existing = db.departments.find_one({"department_name": name})
    if existing:
        return jsonify({"success": False, "message": "Department already exists"}), 409

    doc = {
        "department_name": name,
        "department_email": email,
        "description": desc,
        "active": True,
        "created_at": datetime.utcnow()
    }
    res = db.departments.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id")

    log_audit(
        admin_id=request.current_user["id"],
        admin_email=request.current_user["email"],
        action="Department Created",
        new_value=doc
    )

    return jsonify({"success": True, "department": doc}), 201

@admin_bp.route("/departments/<id>", methods=["PUT"])
@admin_required
def update_department(id: str):
    """Update department details or toggle active status"""
    if not ObjectId.is_valid(id):
        return jsonify({"success": False, "message": "Invalid department ID"}), 400

    dept = db.departments.find_one({"_id": ObjectId(id)})
    if not dept:
        return jsonify({"success": False, "message": "Department not found"}), 404

    data = request.get_json() or {}
    updates = {}
    if "department_name" in data and data["department_name"]:
        updates["department_name"] = data["department_name"].strip()
    if "department_email" in data and data["department_email"]:
        updates["department_email"] = data["department_email"].strip().lower()
    if "description" in data:
        updates["description"] = data["description"].strip()
    if "active" in data:
        updates["active"] = bool(data["active"])

    if updates:
        db.departments.update_one({"_id": ObjectId(id)}, {"$set": updates})

    return jsonify({"success": True, "message": "Department updated successfully"}), 200

@admin_bp.route("/email-history", methods=["GET"])
@admin_required
def get_email_history():
    """View email logs from email_logs collection"""
    status_filter = request.args.get("status", "ALL")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))

    query = {}
    if status_filter != "ALL":
        query["status"] = status_filter

    total = db.email_logs.count_documents(query)
    cursor = db.email_logs.find(query).sort("created_at", -1).skip((page - 1) * limit).limit(limit)

    results = []
    for em in cursor:
        em["id"] = str(em.pop("_id"))
        results.append(em)

    return jsonify({
        "success": True,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total > 0 else 1,
        "email_logs": results
    }), 200

@admin_bp.route("/email-history/<id>/retry", methods=["POST"])
@admin_required
def retry_failed_email(id: str):
    """Retry sending a failed email"""
    res = retry_email(id)
    log_audit(
        admin_id=request.current_user["id"],
        admin_email=request.current_user["email"],
        action="Email Retried",
        metadata={"email_log_id": id, "result": res}
    )
    return jsonify(res), 200

@admin_bp.route("/notifications", methods=["GET"])
@admin_required
def get_notifications():
    """Admin alert notifications"""
    cursor = db.notifications.find({"role": "admin"}).sort("created_at", -1).limit(50)
    notifs = []
    for n in cursor:
        n["id"] = str(n.pop("_id"))
        notifs.append(n)
    unread = db.notifications.count_documents({"role": "admin", "read": False})
    return jsonify({"success": True, "notifications": notifs, "unread_count": unread}), 200

@admin_bp.route("/notifications/<id>/read", methods=["PUT"])
@admin_required
def mark_notification_read(id: str):
    """Mark admin notification as read"""
    if not ObjectId.is_valid(id):
        return jsonify({"success": False, "message": "Invalid notification ID"}), 400

    db.notifications.update_one({"_id": ObjectId(id)}, {"$set": {"read": True}})
    return jsonify({"success": True, "message": "Marked as read"}), 200

@admin_bp.route("/audit-logs", methods=["GET"])
@admin_required
def get_audit_logs():
    """Retrieve audit logs with pagination and filters"""
    action_filter = request.args.get("action", "ALL")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))

    query = {}
    if action_filter != "ALL":
        query["action"] = action_filter

    total = db.audit_logs.count_documents(query)
    cursor = db.audit_logs.find(query).sort("timestamp", -1).skip((page - 1) * limit).limit(limit)

    results = []
    for a in cursor:
        a["id"] = str(a.pop("_id"))
        results.append(a)

    return jsonify({
        "success": True,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total > 0 else 1,
        "audit_logs": results
    }), 200
