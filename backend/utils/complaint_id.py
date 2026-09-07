import datetime
from database.mongodb import db

def generate_complaint_id() -> str:
    """
    Generates unique public human-readable complaint ID.
    Format: CMP-YYYY-XXXXXX (e.g., CMP-2026-000001)
    """
    year = datetime.datetime.utcnow().year
    prefix = f"CMP-{year}-"
    
    # Find the most recently created complaint for this year
    last_complaint = db.complaints.find_one(
        {"complaint_id": {"$regex": f"^{prefix}"}},
        sort=[("complaint_id", -1)]
    )
    
    if last_complaint and "complaint_id" in last_complaint:
        try:
            last_num = int(last_complaint["complaint_id"].split("-")[-1])
            next_num = last_num + 1
        except Exception:
            next_num = db.complaints.count_documents({}) + 1
    else:
        next_num = 1
        
    return f"{prefix}{next_num:06d}"
