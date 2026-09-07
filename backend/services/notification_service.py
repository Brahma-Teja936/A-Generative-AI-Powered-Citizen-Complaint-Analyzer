from datetime import datetime
from bson import ObjectId
from database.mongodb import db

def create_notification(user_id: str, role: str, complaint_id: str, title: str, message: str, notif_type: str = "STATUS_UPDATE") -> str:
    """
    Creates notification in MongoDB notifications collection
    """
    doc = {
        "user_id": user_id,
        "role": role,  # 'client' or 'admin'
        "complaint_id": complaint_id,
        "title": title,
        "message": message,
        "type": notif_type,
        "read": False,
        "created_at": datetime.utcnow()
    }
    res = db.notifications.insert_one(doc)
    return str(res.inserted_id)

def notify_admins_of_complaint(complaint: dict):
    """
    Creates notifications for all administrators based on complaint AI characteristics:
    Critical, Urgent, Low confidence, Possible duplicate, Multiple issues.
    """
    cid = complaint.get("complaint_id")
    ai = complaint.get("ai_analysis", {})

    # General new complaint notification
    create_notification(
        user_id="admin",
        role="admin",
        complaint_id=cid,
        title=f"New Complaint Submitted: {cid}",
        message=f"New complaint '{complaint.get('title')}' submitted by {complaint.get('citizen_name')}.",
        notif_type="NEW_COMPLAINT"
    )

    # Critical alert
    if ai.get("severity") == "CRITICAL" or ai.get("safety_risk") == "VERY HIGH":
        create_notification(
            user_id="admin",
            role="admin",
            complaint_id=cid,
            title=f"CRITICAL HAZARD ALERT: {cid}",
            message=f"Complaint #{cid} classified as CRITICAL severity with {ai.get('safety_risk')} safety risk. Immediate dispatch required.",
            notif_type="CRITICAL_COMPLAINT"
        )

    # Urgent alert
    if ai.get("priority") == "URGENT" or ai.get("urgency") == "IMMEDIATE":
        create_notification(
            user_id="admin",
            role="admin",
            complaint_id=cid,
            title=f"URGENT Action Required: {cid}",
            message=f"Complaint #{cid} marked URGENT priority. Target response time: {ai.get('recommended_response_time')}.",
            notif_type="URGENT_COMPLAINT"
        )

    # Low AI Confidence alert (< 0.70 on any main field)
    confs = ai.get("confidence", {})
    low_conf_fields = [k for k, v in confs.items() if isinstance(v, (int, float)) and v < 0.70]
    if low_conf_fields:
        create_notification(
            user_id="admin",
            role="admin",
            complaint_id=cid,
            title=f"Low AI Confidence: {cid}",
            message=f"Low prediction confidence on {', '.join(low_conf_fields)}. Manual administrative review recommended.",
            notif_type="LOW_AI_CONFIDENCE"
        )

    # Possible duplicate alert
    if ai.get("similar_complaint_id"):
        create_notification(
            user_id="admin",
            role="admin",
            complaint_id=cid,
            title=f"Possible Duplicate Detected: {cid}",
            message=f"Similar to {ai.get('similar_complaint_id')} (similarity score: {ai.get('duplicate_score')}). Review duplicate comparison.",
            notif_type="POSSIBLE_DUPLICATE"
        )

    # Multiple issues alert
    if ai.get("has_multi_issue"):
        create_notification(
            user_id="admin",
            role="admin",
            complaint_id=cid,
            title=f"Multiple Issues Detected: {cid}",
            message=f"Complaint spans multiple areas ({ai.get('department')} & {ai.get('secondary_department')}). Manual coordination recommended.",
            notif_type="MULTIPLE_ISSUES"
        )
