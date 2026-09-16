import datetime
from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from backend.app.extensions import Database, serialize_doc
from backend.app.middleware.auth import roles_required
from backend.app.services.complaint_service import ComplaintService
from backend.app.services.notification_service import NotificationService
from backend.app.utils.helpers import save_uploaded_file

department_bp = Blueprint("department", __name__)

@department_bp.route("/dashboard", methods=["GET"])
@roles_required("DEPARTMENT")
def get_dashboard():
    """
    Department dashboard cards:
    Assigned, Accepted, In Progress, On Hold, Resolved, Overdue, Critical.
    Strictly isolated to this department's complaints.
    """
    dept = getattr(g, "current_user", {})
    dept_id = str(dept.get("id"))
    db = Database.get_db()

    base = {
        "assigned_department_id": dept_id,
        "is_training_data": False,
        "record_type": "LIVE"
    }

    assigned = db.complaints.count_documents({**base, "status": "ASSIGNED"})
    accepted = db.complaints.count_documents({**base, "status": "ACCEPTED"})
    in_progress = db.complaints.count_documents({**base, "status": "IN_PROGRESS"})
    on_hold = db.complaints.count_documents({**base, "status": "ON_HOLD"})
    resolved = db.complaints.count_documents({**base, "status": {"$in": ["RESOLVED", "CLOSED"]}})
    critical = db.complaints.count_documents({**base, "severity": "CRITICAL", "status": {"$nin": ["RESOLVED", "CLOSED"]}})

    # Recent complaints
    recent = list(db.complaints.find(base).sort("created_at", -1).limit(5))

    return jsonify({
        "stats": {
            "assigned": assigned,
            "accepted": accepted,
            "in_progress": in_progress,
            "on_hold": on_hold,
            "resolved": resolved,
            "critical": critical,
            "total_workload": assigned + accepted + in_progress + on_hold
        },
        "recent_complaints": serialize_doc(recent)
    }), 200

@department_bp.route("/complaints", methods=["GET"])
@roles_required("DEPARTMENT")
def list_assigned_complaints():
    dept = getattr(g, "current_user", {})
    dept_id = str(dept.get("id"))

    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 20))
    status = request.args.get("status")
    severity = request.args.get("severity")
    priority = request.args.get("priority")
    urgency = request.args.get("urgency")

    # STRICT ISOLATION: assigned_department_id MUST equal dept_id
    query = {"assigned_department_id": dept_id}
    if status and status != "ALL":
        query["status"] = status
    if severity and severity != "ALL":
        query["severity"] = severity
    if priority and priority != "ALL":
        query["priority"] = priority
    if urgency and urgency != "ALL":
        query["urgency"] = urgency

    result = ComplaintService.get_complaints(query, page, page_size)
    return jsonify(result), 200

@department_bp.route("/complaints/<complaint_id>", methods=["GET"])
@roles_required("DEPARTMENT")
def get_complaint_detail(complaint_id):
    dept = getattr(g, "current_user", {})
    dept_id = str(dept.get("id"))

    complaint = ComplaintService.get_complaint_by_id(
        complaint_id, viewer_role="DEPARTMENT", viewer_user_id=dept_id
    )
    if not complaint:
        return jsonify({"error": "Complaint not found or not assigned to your department"}), 404

    # Get work progress history
    db = Database.get_db()
    progress_history = list(db.complaint_progress.find({"complaint_id": complaint_id}).sort("created_at", -1))

    return jsonify({
        "complaint": complaint,
        "progress_history": serialize_doc(progress_history)
    }), 200

@department_bp.route("/complaints/<complaint_id>/accept", methods=["POST"])
@roles_required("DEPARTMENT")
def accept_complaint(complaint_id):
    dept = getattr(g, "current_user", {})
    dept_id = str(dept.get("id"))
    db = Database.get_db()

    complaint = db.complaints.find_one({
        "complaint_id": complaint_id,
        "assigned_department_id": dept_id,
        "is_training_data": False
    })
    if not complaint:
        return jsonify({"error": "Complaint not assigned to your department"}), 403

    now = datetime.datetime.now(datetime.timezone.utc)
    db.complaints.update_one(
        {"complaint_id": complaint_id},
        {
            "$set": {"status": "ACCEPTED", "updated_at": now},
            "$push": {
                "timeline": {
                    "event": "ACCEPTED_BY_DEPARTMENT",
                    "timestamp": now,
                    "actor": dept.get("department_name"),
                    "notes": "Department accepted work order"
                }
            }
        }
    )

    NotificationService.create_notification(
        user_id=complaint.get("submitted_by"),
        role="CLIENT",
        title=f"Work Accepted: {complaint_id}",
        message=f"{dept.get('department_name')} accepted your complaint and scheduled inspection.",
        link=f"/client/complaints/{complaint_id}",
        complaint_id=complaint_id
    )

    return jsonify({"message": "Complaint status updated to ACCEPTED"}), 200

@department_bp.route("/complaints/<complaint_id>/progress", methods=["POST"])
@roles_required("DEPARTMENT")
def add_progress(complaint_id):
    dept = getattr(g, "current_user", {})
    dept_id = str(dept.get("id"))
    db = Database.get_db()

    complaint = db.complaints.find_one({
        "complaint_id": complaint_id,
        "assigned_department_id": dept_id,
        "is_training_data": False
    })
    if not complaint:
        return jsonify({"error": "Complaint not assigned to your department"}), 403

    description = request.form.get("description", "")
    new_status = request.form.get("status", "IN_PROGRESS")
    est_completion = request.form.get("estimated_completion")

    # Handle file uploads if any
    evidence_files = []
    if "evidence" in request.files:
        files = request.files.getlist("evidence")
        for f in files:
            if f and f.filename:
                path = save_uploaded_file(f, subfolder="department_evidence")
                if path:
                    evidence_files.append(path)

    try:
        entry = ComplaintService.add_progress(
            complaint_id=complaint_id,
            dept_id=dept_id,
            description=description,
            new_status=new_status,
            evidence=evidence_files,
            estimated_completion=est_completion
        )
        return jsonify(entry), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@department_bp.route("/complaints/<complaint_id>/resolve", methods=["POST"])
@roles_required("DEPARTMENT")
def resolve_complaint(complaint_id):
    dept = getattr(g, "current_user", {})
    dept_id = str(dept.get("id"))
    db = Database.get_db()

    complaint = db.complaints.find_one({
        "complaint_id": complaint_id,
        "assigned_department_id": dept_id,
        "is_training_data": False
    })
    if not complaint:
        return jsonify({"error": "Complaint not assigned to your department"}), 403

    desc = request.form.get("resolution_description", "")
    evidence_files = []
    if "evidence" in request.files:
        files = request.files.getlist("evidence")
        for f in files:
            if f and f.filename:
                path = save_uploaded_file(f, subfolder="resolutions")
                if path:
                    evidence_files.append(path)

    try:
        resolved = ComplaintService.resolve_complaint(
            complaint_id=complaint_id,
            resolver_id=dept_id,
            resolution_desc=desc,
            evidence=evidence_files
        )
        return jsonify(resolved), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@department_bp.route("/complaints/<complaint_id>", methods=["DELETE"])
@roles_required("DEPARTMENT")
def delete_department_complaint(complaint_id):
    """
    Allows a department to remove a complaint assigned to its queue.
    """
    dept = getattr(g, "current_user", {})
    dept_id = str(dept.get("id"))
    try:
        success = ComplaintService.delete_complaint(
            complaint_id=complaint_id,
            user_id=dept_id,
            user_role="DEPARTMENT"
        )
        if not success:
            return jsonify({"error": "Complaint not found or not assigned to your department"}), 404
        return jsonify({"message": f"Complaint {complaint_id} deleted successfully."}), 200
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 403
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@department_bp.route("/notifications", methods=["GET"])
@roles_required("DEPARTMENT")
def get_notifications():
    dept = getattr(g, "current_user", {})
    notifs = NotificationService.get_user_notifications(user_id=str(dept.get("id")), role="DEPARTMENT")
    return jsonify({"notifications": notifs}), 200

@department_bp.route("/notifications/<notif_id>/read", methods=["PUT"])
@roles_required("DEPARTMENT")
def mark_notification_read(notif_id):
    dept = getattr(g, "current_user", {})
    NotificationService.mark_as_read(notif_id, str(dept.get("id")))
    return jsonify({"message": "Marked as read"}), 200

@department_bp.route("/notifications/<notif_id>", methods=["DELETE"])
@roles_required("DEPARTMENT")
def delete_notification_endpoint(notif_id):
    dept = getattr(g, "current_user", {})
    success = NotificationService.delete_notification(
        notification_id=notif_id,
        user_id=str(dept.get("id")),
        role="DEPARTMENT"
    )
    if not success:
        return jsonify({"error": "Notification not found"}), 404
    return jsonify({"message": "Notification deleted"}), 200

@department_bp.route("/notifications", methods=["DELETE"])
@roles_required("DEPARTMENT")
def clear_all_notifications_endpoint():
    dept = getattr(g, "current_user", {})
    count = NotificationService.clear_all_notifications(
        user_id=str(dept.get("id")),
        role="DEPARTMENT"
    )
    return jsonify({"message": f"Cleared {count} notifications.", "deleted_count": count}), 200

@department_bp.route("/profile", methods=["GET"])
@roles_required("DEPARTMENT")
def get_profile():
    dept = getattr(g, "current_user", {})
    safe = serialize_doc(dept)
    safe.pop("password_hash", None)
    return jsonify({"profile": safe}), 200
