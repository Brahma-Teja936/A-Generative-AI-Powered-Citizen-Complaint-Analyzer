import os
import sys
import datetime

# Ensure project root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from backend.app.extensions import Database, hash_password

def purge_test_data():
    Database.initialize()
    db = Database.get_db()
    if db is None:
        print("[Error] Could not connect to MongoDB.")
        return False

    print("Purging test data from MongoDB Atlas...")

    # 1. Purge test citizens and test sub-admins (preserve superadmin@civicai.gov)
    r1 = db.users.delete_many({"email": {"$ne": "superadmin@civicai.gov"}})
    print(f"Purged {r1.deleted_count} test users from 'users' collection.")

    # 2. Update SuperAdmin record with baseline password tracking
    now = datetime.datetime.now(datetime.timezone.utc)
    db.users.update_one(
        {"email": "superadmin@civicai.gov"},
        {"$set": {
            "latest_password_plain": "SuperAdminCivicAI@2026!",
            "last_password_change": now,
            "password_updated_by": "SYSTEM_SEED"
        }}
    )

    # 3. Purge test departments (preserve only the 7 official municipal departments)
    official_depts = [
        "Fire & Emergency Services", "Electricity & Power", "Public Safety & Police",
        "Roads & Infrastructure", "Water Supply & Sewerage", "Public Health & Sanitation",
        "Town Planning & Parks"
    ]
    r2 = db.departments.delete_many({"department_name": {"$nin": official_depts}})
    print(f"Purged {r2.deleted_count} test departments from 'departments' collection.")

    # Ensure all 7 official departments have baseline password tracking
    db.departments.update_many(
        {"department_name": {"$in": official_depts}},
        {"$set": {
            "latest_password_plain": "DeptCivicAI@2026!",
            "last_password_change": now,
            "password_updated_by": "SYSTEM_SEED"
        }}
    )
    print("Updated 7 official departments with initial password tracking metadata.")

    # 4. Clear all live test complaints
    r3 = db.complaints.delete_many({"record_type": "LIVE"})
    print(f"Purged {r3.deleted_count} test live complaints from 'complaints' collection.")

    # 5. Clear all test complaint progress entries
    r4 = db.complaint_progress.delete_many({})
    print(f"Purged {r4.deleted_count} entries from 'complaint_progress' collection.")

    # 6. Clear all notifications
    r5 = db.notifications.delete_many({})
    print(f"Purged {r5.deleted_count} entries from 'notifications' collection.")

    # 7. Clear all email logs & emergency alerts
    r6 = db.email_logs.delete_many({})
    r7 = db.emergency_alerts.delete_many({})
    print(f"Purged {r6.deleted_count} email logs and {r7.deleted_count} emergency alerts.")

    print("\n>>> MONGODB ATLAS PURGE COMPLETE: 100% CLEAN PRODUCTION STATE <<<")
    return True

if __name__ == "__main__":
    purge_test_data()
