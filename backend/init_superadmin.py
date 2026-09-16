import os
import sys
import datetime
from backend.config import Config
from backend.app.extensions import Database, hash_password

def initialize_superadmin():
    """
    Checks if a SUPER_ADMIN account exists in MongoDB.
    If not, seeds the initial SUPER_ADMIN using environment variables with bcrypt hashing.
    """
    db = Database.get_db()
    if db is None:
        print("[CivicAI SuperAdmin Init Warning] MongoDB not connected.")
        return False

    try:
        existing_super = db.users.find_one({"role": "SUPER_ADMIN"})
        if existing_super:
            print(f"[CivicAI SuperAdmin Init] SUPER_ADMIN account already exists: {existing_super.get('email')}")
            return True
    except Exception as e:
        print(f"[CivicAI SuperAdmin Init Error] Database query failed: {e}")
        return False

    email = Config.INITIAL_SUPER_ADMIN_EMAIL
    username = Config.INITIAL_SUPER_ADMIN_USERNAME
    password = Config.INITIAL_SUPER_ADMIN_PASSWORD

    if not email or not password:
        print("[CivicAI SuperAdmin Init Error] INITIAL_SUPER_ADMIN_EMAIL or PASSWORD not configured.")
        return False

    now = datetime.datetime.now(datetime.timezone.utc)
    super_admin_doc = {
        "name": Config.INITIAL_SUPER_ADMIN_NAME,
        "email": email.strip().lower(),
        "username": username.strip().lower(),
        "phone": Config.INITIAL_SUPER_ADMIN_PHONE,
        "password_hash": hash_password(password),
        "role": "SUPER_ADMIN",
        "permissions": [
            "VIEW_COMPLAINTS", "REVIEW_AI", "OVERRIDE_AI", "ASSIGN_DEPARTMENT",
            "REASSIGN_DEPARTMENT", "MANAGE_PROGRESS", "RESOLVE_COMPLAINT",
            "VIEW_ANALYTICS", "VIEW_MAP", "VIEW_CRITICAL", "VIEW_URGENT",
            "EMERGENCY_RESPONSE", "MANAGE_DEPARTMENTS", "MANAGE_EMERGENCY_SERVICES",
            "VIEW_AUDIT_LOGS", "MANAGE_USERS", "MANAGE_ADMINS"
        ],
        "active": True,
        "created_by": "SYSTEM_INITIALIZER",
        "created_at": now,
        "updated_at": now,
        "last_login": None
    }

    try:
        db.users.insert_one(super_admin_doc)
        print(f"[CivicAI SuperAdmin Init SUCCESS] Seeded initial SUPER_ADMIN: {email} ({username})")
        return True
    except Exception as e:
        print(f"[CivicAI SuperAdmin Init Error] Failed to create initial super admin: {e}")
        return False

DEFAULT_DEPARTMENTS = [
    {
        "department_name": "Fire & Emergency Services",
        "username": "dept_fire",
        "department_email": "fire.emergency@civicai.gov",
        "description": "Handles structural fires, rescue operations, and rapid disaster emergency response."
    },
    {
        "department_name": "Electricity & Power",
        "username": "dept_electricity",
        "department_email": "electricity.power@civicai.gov",
        "description": "Maintains municipal power grid, streetlights, transformer repairs, and hazard clearances."
    },
    {
        "department_name": "Public Safety & Police",
        "username": "dept_police",
        "department_email": "public.safety@civicai.gov",
        "description": "Oversees public order, traffic law enforcement, surveillance, and citizen protection."
    },
    {
        "department_name": "Roads & Infrastructure",
        "username": "dept_roads",
        "department_email": "roads.infra@civicai.gov",
        "description": "Repairs potholes, road paving, bridges, footpaths, and storm drainage infrastructure."
    },
    {
        "department_name": "Water Supply & Sewerage",
        "username": "dept_water",
        "department_email": "water.supply@civicai.gov",
        "description": "Manages potable drinking water pipeline networks, sewage lines, and leak restoration."
    },
    {
        "department_name": "Public Health & Sanitation",
        "username": "dept_health",
        "department_email": "health.sanitation@civicai.gov",
        "description": "Oversees garbage collection, vector control, street sanitation, and epidemic prevention."
    },
    {
        "department_name": "Town Planning & Parks",
        "username": "dept_planning",
        "department_email": "town.planning@civicai.gov",
        "description": "Manages zoning, public parks, urban tree cover, building permits, and encroachment."
    }
]

def initialize_departments():
    """
    Seeds the standard civic departments into MongoDB if none exist.
    """
    db = Database.get_db()
    if db is None:
        return False

    now = datetime.datetime.now(datetime.timezone.utc)
    seeded_count = 0
    default_password_hash = hash_password("DeptCivicAI@2026!")

    try:
        for dept in DEFAULT_DEPARTMENTS:
            existing = db.departments.find_one({
                "$or": [
                    {"department_name": dept["department_name"]},
                    {"department_email": dept["department_email"]},
                    {"username": dept["username"]}
                ]
            })
            if not existing:
                doc = {
                    "department_name": dept["department_name"],
                    "department_email": dept["department_email"],
                    "username": dept["username"],
                    "password_hash": default_password_hash,
                    "role": "DEPARTMENT",
                    "description": dept["description"],
                    "active": True,
                    "created_at": now,
                    "updated_at": now
                }
                try:
                    db.departments.insert_one(doc)
                    seeded_count += 1
                except Exception as e:
                    print(f"[CivicAI Dept Init Warning] Could not seed {dept['department_name']}: {e}")

        if seeded_count > 0:
            print(f"[CivicAI Dept Init SUCCESS] Seeded {seeded_count} standard civic departments.")
        return True
    except Exception as e:
        print(f"[CivicAI Department Init Error] Database query failed: {e}")
        return False

if __name__ == "__main__":
    s1 = initialize_superadmin()
    s2 = initialize_departments()
    sys.exit(0 if (s1 and s2) else 1)
