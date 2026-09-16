"""
CivicAI MongoDB Indexes and Schema Initialization
Ensures proper index creation for performance, uniqueness, 2dsphere geospatial search,
email idempotency, and strict training data isolation.
"""

from pymongo import ASCENDING, DESCENDING, GEOSPHERE
from backend.app.extensions import Database

def create_indexes():
    mongo_db = Database.get_db()
    if mongo_db is None:
        print("[CivicAI DB Warning] MongoDB not connected; skipping index creation.")
        return

    try:
        print("[CivicAI DB] Ensuring all collection indexes...")

        # 1. users
        mongo_db.users.create_index([("email", ASCENDING)], unique=True)
        mongo_db.users.create_index([("username", ASCENDING)], unique=True)
        mongo_db.users.create_index([("role", ASCENDING)])
        mongo_db.users.create_index([("active", ASCENDING)])

        # 2. departments
        mongo_db.departments.create_index([("department_name", ASCENDING)], unique=True)
        mongo_db.departments.create_index([("username", ASCENDING)], unique=True)
        mongo_db.departments.create_index([("department_email", ASCENDING)], unique=True)
        mongo_db.departments.create_index([("active", ASCENDING)])

        # 3. complaints (LIVE ONLY)
        mongo_db.complaints.create_index([("complaint_id", ASCENDING)], unique=True)
        mongo_db.complaints.create_index([("is_training_data", ASCENDING)])
        mongo_db.complaints.create_index([("record_type", ASCENDING)])
        mongo_db.complaints.create_index([("submitted_by", ASCENDING)])
        mongo_db.complaints.create_index([("status", ASCENDING)])
        mongo_db.complaints.create_index([("assigned_department_id", ASCENDING)])
        mongo_db.complaints.create_index([("severity", ASCENDING)])
        mongo_db.complaints.create_index([("priority", ASCENDING)])
        mongo_db.complaints.create_index([("urgency", ASCENDING)])
        mongo_db.complaints.create_index([("emergency_status", ASCENDING)])
        mongo_db.complaints.create_index([("created_at", DESCENDING)])
        mongo_db.complaints.create_index([("location.coordinates", GEOSPHERE)])

        # 4. training_complaints (ISOLATED)
        mongo_db.training_complaints.create_index([("is_training_data", ASCENDING)])
        mongo_db.training_complaints.create_index([("department", ASCENDING)])

        # 5. complaint_progress
        mongo_db.complaint_progress.create_index([("complaint_id", ASCENDING)])
        mongo_db.complaint_progress.create_index([("department_id", ASCENDING)])
        mongo_db.complaint_progress.create_index([("created_at", DESCENDING)])

        # 6. notifications
        mongo_db.notifications.create_index([("user_id", ASCENDING)])
        mongo_db.notifications.create_index([("role", ASCENDING)])
        mongo_db.notifications.create_index([("is_read", ASCENDING)])
        mongo_db.notifications.create_index([("created_at", DESCENDING)])

        # 7. email_logs (IDEMPOTENCY: Unique compound index on complaint_id + email_type + event_id)
        mongo_db.email_logs.create_index(
            [("complaint_id", ASCENDING), ("email_type", ASCENDING), ("event_id", ASCENDING)],
            unique=True
        )
        mongo_db.email_logs.create_index([("sent_at", DESCENDING)])

        # 8. audit_logs
        mongo_db.audit_logs.create_index([("admin_id", ASCENDING)])
        mongo_db.audit_logs.create_index([("action", ASCENDING)])
        mongo_db.audit_logs.create_index([("timestamp", DESCENDING)])

        # 9. model_predictions
        mongo_db.model_predictions.create_index([("complaint_id", ASCENDING)])
        mongo_db.model_predictions.create_index([("created_at", DESCENDING)])

        # 10. model_corrections
        mongo_db.model_corrections.create_index([("complaint_id", ASCENDING)])
        mongo_db.model_corrections.create_index([("overridden_by", ASCENDING)])

        # 11. emergency_services (2dsphere for proximity search)
        mongo_db.emergency_services.create_index([("location.coordinates", GEOSPHERE)])
        mongo_db.emergency_services.create_index([("service_type", ASCENDING)])
        mongo_db.emergency_services.create_index([("active", ASCENDING)])

        # 12. emergency_actions
        mongo_db.emergency_actions.create_index([("complaint_id", ASCENDING)])
        mongo_db.emergency_actions.create_index([("status", ASCENDING)])
        mongo_db.emergency_actions.create_index([("initiated_at", DESCENDING)])

        # 13. feedback
        mongo_db.feedback.create_index([("complaint_id", ASCENDING)], unique=True)
        mongo_db.feedback.create_index([("submitted_by", ASCENDING)])

        print("[CivicAI DB] All indexes created successfully.")
    except Exception as e:
        print(f"[CivicAI DB Error] Index creation failed: {e}")
