import datetime
from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from backend.app.extensions import Database, serialize_doc
from backend.app.middleware.auth import roles_required
from backend.app.services.complaint_service import ComplaintService
from backend.app.services.notification_service import NotificationService
from backend.app.utils.helpers import save_uploaded_file

client_bp = Blueprint("client", __name__)

@client_bp.route("/dashboard", methods=["GET"])
@roles_required("CLIENT")
def get_dashboard():
    """
    Citizen dashboard cards:
    Total, Pending, In Progress, Resolved.
    Strictly isolated to current user's submitted complaints.
    """
    user = getattr(g, "current_user", {})
    user_id = str(user.get("id"))
    db = Database.get_db()

    base = {
        "submitted_by": user_id,
        "is_training_data": False,
        "record_type": "LIVE"
    }

    total = db.complaints.count_documents(base)
    pending = db.complaints.count_documents({**base, "status": {"$in": ["SUBMITTED", "UNDER_REVIEW"]}})
    in_progress = db.complaints.count_documents({**base, "status": {"$in": ["ASSIGNED", "ACCEPTED", "IN_PROGRESS", "ON_HOLD"]}})
    resolved = db.complaints.count_documents({**base, "status": {"$in": ["RESOLVED", "CLOSED"]}})

    recent = list(db.complaints.find(base).sort("created_at", -1).limit(5))

    return jsonify({
        "stats": {
            "total": total,
            "pending": pending,
            "in_progress": in_progress,
            "resolved": resolved
        },
        "recent_complaints": serialize_doc(recent)
    }), 200

@client_bp.route("/complaints", methods=["POST"])
@roles_required("CLIENT")
def submit_complaint():
    """
    Citizen complaint submission with multilingual voice/text support,
    location intelligence, and attachment upload.
    """
    user = getattr(g, "current_user", {})
    user_id = str(user.get("id"))

    # Support either JSON or multipart form-data
    if request.is_json:
        data = request.get_json() or {}
        attachment_paths = data.get("attachments", [])
    else:
        data = request.form.to_dict()
        attachment_paths = []
        if "attachments" in request.files:
            files = request.files.getlist("attachments")
            for f in files:
                if f and f.filename:
                    path = save_uploaded_file(f, subfolder="complaints")
                    if path:
                        attachment_paths.append(path)

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    if not description:
        return jsonify({"error": "Complaint description is required"}), 400

    try:
        new_complaint = ComplaintService.create_complaint(
            user_id=user_id,
            data=data,
            attachments=attachment_paths
        )
        return jsonify(new_complaint), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@client_bp.route("/complaints", methods=["GET"])
@roles_required("CLIENT")
def list_my_complaints():
    user = getattr(g, "current_user", {})
    user_id = str(user.get("id"))

    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 20))
    status = request.args.get("status")

    # STRICT ISOLATION: submitted_by MUST equal user_id
    query = {"submitted_by": user_id}
    if status and status != "ALL":
        if status == "PENDING":
            query["status"] = {"$in": ["SUBMITTED", "UNDER_REVIEW"]}
        elif status == "IN_PROGRESS":
            query["status"] = {"$in": ["ASSIGNED", "ACCEPTED", "IN_PROGRESS", "ON_HOLD"]}
        elif status == "RESOLVED":
            query["status"] = {"$in": ["RESOLVED", "CLOSED"]}
        else:
            query["status"] = status

    result = ComplaintService.get_complaints(query, page, page_size)
    return jsonify(result), 200

@client_bp.route("/complaints/<complaint_id>", methods=["GET"])
@roles_required("CLIENT")
def get_my_complaint(complaint_id):
    user = getattr(g, "current_user", {})
    user_id = str(user.get("id"))

    complaint = ComplaintService.get_complaint_by_id(
        complaint_id=complaint_id,
        viewer_role="CLIENT",
        viewer_user_id=user_id
    )

    if not complaint:
        return jsonify({"error": "Complaint not found or unauthorized access"}), 404

    # Fetch feedback if already provided
    db = Database.get_db()
    feedback = db.feedback.find_one({"complaint_id": complaint_id})

    return jsonify({
        "complaint": complaint,
        "feedback": serialize_doc(feedback)
    }), 200

@client_bp.route("/complaints/<complaint_id>/feedback", methods=["POST"])
@roles_required("CLIENT")
def submit_complaint_feedback(complaint_id):
    user = getattr(g, "current_user", {})
    user_id = str(user.get("id"))
    data = request.get_json() or {}

    rating = data.get("rating", 5)
    comment = data.get("comment", "")

    try:
        feedback = ComplaintService.submit_feedback(
            complaint_id=complaint_id,
            user_id=user_id,
            rating=rating,
            comment=comment
        )
        return jsonify(feedback), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@client_bp.route("/complaints/<complaint_id>", methods=["DELETE"])
@roles_required("CLIENT")
def delete_my_complaint(complaint_id):
    """
    Allows a citizen to delete a complaint they submitted.
    """
    user = getattr(g, "current_user", {})
    user_id = str(user.get("id"))
    try:
        success = ComplaintService.delete_complaint(
            complaint_id=complaint_id,
            user_id=user_id,
            user_role="CLIENT"
        )
        if not success:
            return jsonify({"error": "Complaint not found"}), 404
        return jsonify({"message": f"Complaint {complaint_id} deleted successfully."}), 200
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 403
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@client_bp.route("/notifications", methods=["GET"])
@roles_required("CLIENT")
def get_notifications():
    user = getattr(g, "current_user", {})
    user_id = str(user.get("id"))
    notifs = NotificationService.get_user_notifications(user_id=user_id, role="CLIENT")
    return jsonify({"notifications": notifs}), 200

@client_bp.route("/notifications/<notif_id>/read", methods=["PUT"])
@roles_required("CLIENT")
def mark_notification_read(notif_id):
    user = getattr(g, "current_user", {})
    NotificationService.mark_as_read(notif_id, str(user.get("id")))
    return jsonify({"message": "Marked as read"}), 200

@client_bp.route("/notifications/<notif_id>", methods=["DELETE"])
@roles_required("CLIENT")
def delete_notification_endpoint(notif_id):
    user = getattr(g, "current_user", {})
    success = NotificationService.delete_notification(
        notification_id=notif_id,
        user_id=str(user.get("id")),
        role="CLIENT"
    )
    if not success:
        return jsonify({"error": "Notification not found"}), 404
    return jsonify({"message": "Notification deleted"}), 200

@client_bp.route("/notifications", methods=["DELETE"])
@roles_required("CLIENT")
def clear_all_notifications_endpoint():
    user = getattr(g, "current_user", {})
    count = NotificationService.clear_all_notifications(
        user_id=str(user.get("id")),
        role="CLIENT"
    )
    return jsonify({"message": f"Cleared {count} notifications.", "deleted_count": count}), 200

@client_bp.route("/profile", methods=["GET"])
@roles_required("CLIENT")
def get_profile():
    user = getattr(g, "current_user", {})
    safe = serialize_doc(user)
    safe.pop("password_hash", None)
    return jsonify({"profile": safe}), 200
