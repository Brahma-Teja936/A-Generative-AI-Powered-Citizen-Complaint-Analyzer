from datetime import datetime
from database.mongodb import db

def log_audit(admin_id: str, admin_email: str, action: str, complaint_id: str = None, old_value=None, new_value=None, metadata: dict = None):
    """
    Logs administrative action to MongoDB audit_logs collection for compliance and accountability
    """
    doc = {
        "admin_id": str(admin_id) if admin_id else "system",
        "admin_email": admin_email or "admin@civicai.gov",
        "action": action,
        "complaint_id": complaint_id,
        "old_value": old_value,
        "new_value": new_value,
        "timestamp": datetime.utcnow(),
        "metadata": metadata or {}
    }
    try:
        db.audit_logs.insert_one(doc)
    except Exception as e:
        print(f"[AUDIT LOG ERROR] Failed to record audit log: {e}")
