from flask import Blueprint, request, jsonify
from models import EmailLog, Complaint
from services.auth_helper import admin_required

email_logs_bp = Blueprint("email_logs", __name__, url_prefix="/api/email-logs")

@email_logs_bp.route("", methods=["GET"])
@admin_required
def get_email_logs():
    """Returns list of automated email dispatch logs for admin oversight."""
    logs = EmailLog.query.order_by(EmailLog.sent_at.desc()).limit(100).all()
    
    result = []
    for log in logs:
        item = log.to_dict()
        if log.complaint:
            item["complaint_department"] = log.complaint.department
            item["complaint_priority"] = log.complaint.priority
            item["complaint_severity"] = log.complaint.severity
        result.append(item)

    return jsonify({
        "success": True,
        "count": len(result),
        "email_logs": result
    }), 200
