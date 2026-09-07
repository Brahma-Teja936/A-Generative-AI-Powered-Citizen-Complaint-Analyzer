import os
import uuid
from datetime import datetime
from pathlib import Path
from bson import ObjectId
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from config import Config
from database.mongodb import db
from auth.jwt_utils import client_required, token_required
from utils.complaint_id import generate_complaint_id
from ml.analysis_service import analysis_service
from services.email_service import send_client_acknowledgement
from services.notification_service import create_notification, notify_admins_of_complaint

client_bp = Blueprint("client", __name__, url_prefix="/api/client")

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS

@client_bp.route("/dashboard", methods=["GET"])
@client_required
def get_dashboard():
    """Client Dashboard statistics and recent activity"""
    user_id = request.current_user["id"]

    total = db.complaints.count_documents({"citizen_id": user_id})
    pending = db.complaints.count_documents({"citizen_id": user_id, "status": "PENDING"})
    in_progress = db.complaints.count_documents({
        "citizen_id": user_id,
        "status": {"$in": ["UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"]}
    })
    resolved = db.complaints.count_documents({"citizen_id": user_id, "status": {"$in": ["RESOLVED", "CLOSED"]}})

    # Recent complaints
    recent_cursor = db.complaints.find(
        {"citizen_id": user_id},
        {"ai_analysis.evidence": 0, "admin_decision.override_reason": 0}
    ).sort("created_at", -1).limit(5)

    recent_complaints = []
    for c in recent_cursor:
        c["id"] = str(c.pop("_id"))
        recent_complaints.append(c)

    # Recent notifications
    notif_cursor = db.notifications.find({"user_id": user_id}).sort("created_at", -1).limit(5)
    recent_notifs = []
    for n in notif_cursor:
        n["id"] = str(n.pop("_id"))
        recent_notifs.append(n)

    unread_notifs = db.notifications.count_documents({"user_id": user_id, "read": False})

    return jsonify({
        "success": True,
        "user": request.current_user,
        "stats": {
            "total": total,
            "pending": pending,
            "in_progress": in_progress,
            "resolved": resolved
        },
        "recent_complaints": recent_complaints,
        "notifications": recent_notifs,
        "unread_notifications": unread_notifs
    }), 200

@client_bp.route("/complaints", methods=["POST"])
@client_required
def submit_complaint():
    """
    Submits a new civic complaint:
    1. Validates input
    2. Generates unique human-readable ID: CMP-YYYY-XXXXXX
    3. Handles optional image attachment upload
    4. Runs TF-IDF + XGBoost AI Analysis
    5. Stores Complaint & Model Predictions in MongoDB
    6. Sets initial status to PENDING
    7. Creates initial complaint_progress history event
    8. Dispatches acknowledgement email with duplicate protection
    9. Creates citizen notification and alerts administrators
    """
    user = request.current_user
    user_id = user["id"]

    title = ""
    description = ""
    location = ""
    incident_date = ""
    category_hint = ""
    attachments = []

    # Handle multipart/form-data or application/json
    if request.content_type and "multipart/form-data" in request.content_type:
        title = request.form.get("title", "").strip()
        description = request.form.get("description", "").strip()
        location = request.form.get("location", "").strip()
        incident_date = request.form.get("incident_date", "").strip()
        category_hint = request.form.get("category", "").strip()

        # Handle attachment
        if "attachment" in request.files:
            file = request.files["attachment"]
            if file and file.filename != "":
                if not allowed_file(file.filename):
                    return jsonify({"success": False, "message": "Invalid file format. Allowed: JPG, PNG, WEBP"}), 400
                ext = file.filename.rsplit(".", 1)[1].lower()
                unique_name = f"att_{uuid.uuid4().hex[:10]}.{ext}"
                upload_dir = Path(Config.UPLOAD_FOLDER)
                upload_dir.mkdir(parents=True, exist_ok=True)
                file.save(str(upload_dir / unique_name))
                attachments.append({
                    "filename": secure_filename(file.filename),
                    "url": f"/api/uploads/{unique_name}",
                    "uploaded_at": datetime.utcnow()
                })
    else:
        data = request.get_json() or {}
        title = data.get("title", "").strip()
        description = data.get("description", "").strip()
        location = data.get("location", "").strip()
        incident_date = data.get("incident_date", "").strip()
        category_hint = data.get("category", "").strip()
        if data.get("attachment_url"):
            attachments.append({
                "filename": "attachment",
                "url": data.get("attachment_url"),
                "uploaded_at": datetime.utcnow()
            })

    if not title or not description:
        return jsonify({"success": False, "message": "Title and Complaint Description are required"}), 400

    # 1. Generate human-readable Complaint ID
    complaint_id = generate_complaint_id()

    # 2. Fetch existing complaints for duplicate detection
    existing_comps = list(db.complaints.find(
        {}, {"complaint_id": 1, "description": 1, "created_at": 1}
    ).sort("created_at", -1).limit(100))

    # 3. Run AI Analysis
    combined_text = f"{title}. {description}"
    ai_result = analysis_service.analyze(
        complaint_text=combined_text,
        user_location=location,
        existing_complaints=existing_comps
    )

    # If citizen specified an explicit category and it's valid, note it
    if category_hint:
        ai_result["user_suggested_category"] = category_hint

    # 4. Store Model Prediction in model_predictions collection
    try:
        db.model_predictions.insert_one({
            "complaint_id": complaint_id,
            "model_name": "TFIDF_XGBoost_MultiTarget",
            "model_version": "2.0.0",
            "prediction": {
                "department": ai_result["department"],
                "category": ai_result["category"],
                "subcategory": ai_result["subcategory"],
                "severity": ai_result["severity"],
                "priority": ai_result["priority"],
                "urgency": ai_result["urgency"]
            },
            "confidence": ai_result["confidence"],
            "created_at": datetime.utcnow()
        })
    except Exception as me:
        print(f"[WARN] Failed to record model prediction: {me}")

    # 5. Create Complaint Document
    now = datetime.utcnow()
    complaint_doc = {
        "complaint_id": complaint_id,
        "citizen_id": user_id,
        "citizen_name": user["name"],
        "citizen_email": user["email"],
        "citizen_phone": user.get("phone", ""),
        "title": title,
        "description": description,
        "location": ai_result["location"] if ai_result["location"] != "Location not specified" else (location or "Location not specified"),
        "incident_date": incident_date or now.strftime("%Y-%m-%d"),
        "attachments": attachments,
        "status": "PENDING",
        "ai_analysis": ai_result,
        "admin_decision": {
            "category": None,
            "subcategory": None,
            "department": None,
            "secondary_department": None,
            "severity": None,
            "priority": None,
            "urgency": None,
            "safety_risk": None,
            "public_impact": None,
            "response_time": None,
            "notes": None,
            "overridden": False,
            "override_reason": None,
            "overridden_by": None,
            "overridden_at": None
        },
        "review": {
            "reviewed": False,
            "reviewed_by": None,
            "reviewed_at": None
        },
        "assignment": {
            "department_id": None,
            "department_name": None,
            "department_email": None,
            "assigned_by": None,
            "assigned_at": None
        },
        "resolution": {
            "description": None,
            "resolved_by": None,
            "resolved_at": None
        },
        "created_at": now,
        "updated_at": now
    }

    insert_res = db.complaints.insert_one(complaint_doc)
    complaint_doc["_id"] = insert_res.inserted_id

    # 6. Record Initial Timeline History Event
    db.complaint_progress.insert_one({
        "complaint_id": complaint_id,
        "status": "PENDING",
        "description": "Complaint submitted by citizen. AI automated triage completed.",
        "department": ai_result["department"],
        "updated_by": user["name"],
        "created_at": now
    })

    # 7. Create Notification for Citizen
    create_notification(
        user_id=user_id,
        role="client",
        complaint_id=complaint_id,
        title=f"Complaint Submitted: {complaint_id}",
        message=f"Your complaint '{title}' has been successfully submitted. Reference ID: {complaint_id}",
        notif_type="COMPLAINT_SUBMITTED"
    )

    # 8. Dispatch Email Acknowledgement (idempotent duplicate protected)
    send_client_acknowledgement(
        complaint=complaint_doc,
        citizen_name=user["name"],
        citizen_email=user["email"]
    )

    # 9. Notify Administrators
    notify_admins_of_complaint(complaint_doc)

    # Format response (do not expose internal audit details to citizen)
    return jsonify({
        "success": True,
        "message": "Your complaint has been successfully submitted.",
        "complaint_id": complaint_id,
        "complaint": {
            "id": str(complaint_doc["_id"]),
            "complaint_id": complaint_id,
            "title": title,
            "description": description,
            "location": complaint_doc["location"],
            "status": "PENDING",
            "department": ai_result["department"],
            "category": ai_result["category"],
            "priority": ai_result["priority"],
            "summary": ai_result["summary"],
            "recommended_response_time": ai_result["recommended_response_time"],
            "created_at": now
        }
    }), 201

@client_bp.route("/complaints", methods=["GET"])
@client_required
def get_complaints():
    """List complaints belonging to the logged-in citizen with filters and pagination"""
    user_id = request.current_user["id"]
    status_filter = request.args.get("status", "ALL").upper()
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))

    query = {"citizen_id": user_id}
    if status_filter != "ALL":
        if status_filter == "IN_PROGRESS":
            query["status"] = {"$in": ["UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"]}
        elif status_filter == "RESOLVED":
            query["status"] = {"$in": ["RESOLVED", "CLOSED"]}
        else:
            query["status"] = status_filter

    total = db.complaints.count_documents(query)
    cursor = db.complaints.find(query).sort("created_at", -1).skip((page - 1) * limit).limit(limit)

    results = []
    for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        # Expose only safe citizen fields
        safe_ai = {
            "department": doc.get("ai_analysis", {}).get("department"),
            "category": doc.get("ai_analysis", {}).get("category"),
            "priority": doc.get("ai_analysis", {}).get("priority"),
            "summary": doc.get("ai_analysis", {}).get("summary"),
            "recommended_response_time": doc.get("ai_analysis", {}).get("recommended_response_time")
        }
        # If admin made a final decision, show active department/priority
        admin_dec = doc.get("admin_decision") or {}
        assigned = doc.get("assignment") or {}
        display_dept = assigned.get("department_name") or admin_dec.get("department") or safe_ai["department"]
        display_pri = admin_dec.get("priority") or safe_ai["priority"]

        results.append({
            "id": doc["id"],
            "complaint_id": doc["complaint_id"],
            "title": doc["title"],
            "category": admin_dec.get("category") or safe_ai["category"],
            "department": display_dept,
            "priority": display_pri,
            "status": doc["status"],
            "created_at": doc["created_at"],
            "updated_at": doc.get("updated_at")
        })

    return jsonify({
        "success": True,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if total > 0 else 1,
        "complaints": results
    }), 200

@client_bp.route("/complaints/<id>", methods=["GET"])
@client_required
def get_complaint_detail(id: str):
    """View full details and timeline of citizen's own complaint"""
    user_id = request.current_user["id"]

    # Search by complaint_id or ObjectId
    query = {"$or": [{"complaint_id": id}, {"_id": ObjectId(id)}]} if ObjectId.is_valid(id) else {"complaint_id": id}
    complaint = db.complaints.find_one(query)

    if not complaint:
        return jsonify({"success": False, "message": "Complaint not found"}), 404

    # Strict resource ownership verification
    if complaint.get("citizen_id") != user_id:
        return jsonify({"success": False, "message": "Access denied: Not authorized to view this complaint"}), 403

    complaint["id"] = str(complaint.pop("_id"))
    cid = complaint["complaint_id"]

    # Fetch progress timeline from complaint_progress collection
    timeline_cursor = db.complaint_progress.find({"complaint_id": cid}).sort("created_at", 1)
    timeline = []
    for item in timeline_cursor:
        item["id"] = str(item.pop("_id"))
        timeline.append(item)

    # Build clean citizen-facing AI summary (no raw model parameters or internal notes)
    ai = complaint.get("ai_analysis", {})
    admin_dec = complaint.get("admin_decision") or {}
    assigned = complaint.get("assignment") or {}

    citizen_ai_info = {
        "category": admin_dec.get("category") or ai.get("category"),
        "department": assigned.get("department_name") or admin_dec.get("department") or ai.get("department"),
        "priority": admin_dec.get("priority") or ai.get("priority"),
        "severity": admin_dec.get("severity") or ai.get("severity"),
        "estimated_response_time": admin_dec.get("response_time") or ai.get("recommended_response_time"),
        "summary": ai.get("summary")
    }

    # Clean response document
    safe_data = {
        "id": complaint["id"],
        "complaint_id": cid,
        "title": complaint.get("title"),
        "description": complaint.get("description"),
        "location": complaint.get("location"),
        "incident_date": complaint.get("incident_date"),
        "attachments": complaint.get("attachments", []),
        "status": complaint.get("status"),
        "ai_classification": citizen_ai_info,
        "department": citizen_ai_info["department"],
        "resolution": complaint.get("resolution"),
        "created_at": complaint.get("created_at"),
        "updated_at": complaint.get("updated_at"),
        "timeline": timeline
    }

    return jsonify({"success": True, "complaint": safe_data}), 200

@client_bp.route("/notifications", methods=["GET"])
@client_required
def get_notifications():
    """Retrieve citizen notifications"""
    user_id = request.current_user["id"]
    cursor = db.notifications.find({"user_id": user_id}).sort("created_at", -1).limit(50)
    notifs = []
    for n in cursor:
        n["id"] = str(n.pop("_id"))
        notifs.append(n)
    return jsonify({"success": True, "notifications": notifs}), 200

@client_bp.route("/notifications/<id>/read", methods=["PUT"])
@client_required
def mark_notification_read(id: str):
    """Mark a notification as read"""
    user_id = request.current_user["id"]
    if not ObjectId.is_valid(id):
        return jsonify({"success": False, "message": "Invalid notification ID"}), 400

    res = db.notifications.update_one(
        {"_id": ObjectId(id), "user_id": user_id},
        {"$set": {"read": True}}
    )
    if res.matched_count == 0:
        return jsonify({"success": False, "message": "Notification not found"}), 404

    return jsonify({"success": True, "message": "Notification marked as read"}), 200

@client_bp.route("/profile", methods=["GET"])
@client_required
def get_profile():
    """Retrieve citizen profile"""
    user = db.users.find_one({"_id": ObjectId(request.current_user["id"])})
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    return jsonify({
        "success": True,
        "profile": {
            "name": user.get("name"),
            "email": user.get("email"),
            "phone": user.get("phone"),
            "location": user.get("location"),
            "role": user.get("role"),
            "created_at": user.get("created_at")
        }
    }), 200

@client_bp.route("/profile", methods=["PUT"])
@client_required
def update_profile():
    """Update citizen profile"""
    user_id = request.current_user["id"]
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()
    location = data.get("location", "").strip()

    updates = {}
    if name:
        updates["name"] = name
    if phone:
        updates["phone"] = phone
    if location:
        updates["location"] = location

    if updates:
        db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})

    return jsonify({"success": True, "message": "Profile updated successfully"}), 200
