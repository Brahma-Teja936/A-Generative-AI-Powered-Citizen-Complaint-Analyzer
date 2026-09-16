import datetime
from backend.app.extensions import Database

def log_audit(action: str, admin_id: str = None, target_id: str = None, 
              old_value: dict = None, new_value: dict = None, metadata: dict = None):
    """
    Log administrative and security actions into MongoDB audit_logs collection.
    Sensitive keys like passwords or secrets are stripped before persistence.
    """
    db = Database.get_db()
    if db is None:
        return

    # Deep copy / filter out any password fields
    def sanitize(val):
        if isinstance(val, dict):
            return {k: ("***REDACTED***" if "password" in k.lower() or "secret" in k.lower() else sanitize(v)) for k, v in val.items()}
        elif isinstance(val, list):
            return [sanitize(x) for x in val]
        return val

    entry = {
        "admin_id": str(admin_id) if admin_id else "SYSTEM",
        "target_id": str(target_id) if target_id else None,
        "action": action,
        "old_value": sanitize(old_value),
        "new_value": sanitize(new_value),
        "metadata": sanitize(metadata or {}),
        "timestamp": datetime.datetime.now(datetime.timezone.utc)
    }

    try:
        db.audit_logs.insert_one(entry)
    except Exception as e:
        print(f"[CivicAI Audit Error] Failed to record audit log: {e}")
