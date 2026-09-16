import os
import sys
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from database.mongodb import db
from auth.jwt_utils import hash_password

DEPARTMENTS = [
    {
        "department_name": "Roads & Infrastructure",
        "department_email": "roads@city.gov",
        "description": "Responsible for road repairs, potholes, sidewalks, dividers, and bridge maintenance.",
        "active": True
    },
    {
        "department_name": "Water Supply",
        "department_email": "water@city.gov",
        "description": "Manages drinking water distribution, pipeline leak repairs, and water quality testing.",
        "active": True
    },
    {
        "department_name": "Electricity",
        "department_email": "electricity@city.gov",
        "description": "Handles power distribution lines, transformer faults, fallen poles, and electrical hazards.",
        "active": True
    },
    {
        "department_name": "Waste Management",
        "department_email": "waste@city.gov",
        "description": "Municipal waste collection, overflowing garbage bins, illegal dumping, and recycling.",
        "active": True
    },
    {
        "department_name": "Sanitation",
        "department_email": "sanitation@city.gov",
        "description": "Public toilet maintenance, pest control, stray animal carcass removal, and street sweeping.",
        "active": True
    },
    {
        "department_name": "Drainage",
        "department_email": "drainage@city.gov",
        "description": "Stormwater drains, sewer pipeline overflows, flood mitigation, and drainage desilting.",
        "active": True
    },
    {
        "department_name": "Street Lighting",
        "department_email": "lighting@city.gov",
        "description": "Public streetlights, high-mast LED floodlights, underpass illumination, and timer control.",
        "active": True
    },
    {
        "department_name": "Traffic",
        "department_email": "traffic@city.gov",
        "description": "Traffic signals, road signs, illegal parking congestion, and junction speed controls.",
        "active": True
    },
    {
        "department_name": "Public Safety",
        "department_email": "safety@city.gov",
        "description": "Hazardous structures, open manholes, stray dog packs, and emergency site fencing.",
        "active": True
    },
    {
        "department_name": "Public Health",
        "department_email": "health@city.gov",
        "description": "Vector-borne disease prevention, anti-larval fogging, and food safety inspections.",
        "active": True
    },
    {
        "department_name": "Parks & Environment",
        "department_email": "parks@city.gov",
        "description": "Public gardens, fallen trees, overgrown branches, park playground equipment, and noise control.",
        "active": True
    },
    {
        "department_name": "Other",
        "department_email": "civic@city.gov",
        "description": "General municipal complaints, public helpline queries, and multi-department coordination.",
        "active": True
    }
]

def seed_database():
    print("=" * 60)
    print("Seeding CivicAI MongoDB Collections...")
    print("=" * 60)

    # 1. Seed Departments
    dept_count = 0
    for d in DEPARTMENTS:
        existing = db.departments.find_one({"department_name": d["department_name"]})
        if not existing:
            doc = dict(d)
            doc["created_at"] = datetime.utcnow()
            db.departments.insert_one(doc)
            dept_count += 1
    print(f"[OK] Seeded {dept_count} new departments ({db.departments.count_documents({})} total in DB).")

    # 2. Seed Admin User
    admin_email = "admin@civicai.gov"
    existing_admin = db.users.find_one({"email": admin_email})
    if not existing_admin:
        admin_doc = {
            "name": "Civic Administration Lead",
            "email": admin_email,
            "phone": "+1-800-555-0199",
            "password_hash": hash_password("adminPassword123!"),
            "role": "admin",
            "location": "Municipal Headquarters",
            "created_at": datetime.utcnow()
        }
        db.users.insert_one(admin_doc)
        print(f"[OK] Created Administrator account: {admin_email} (password: adminPassword123!)")
    else:
        print(f"[OK] Administrator already exists: {admin_email}")

    # 3. Seed Sample Client User
    client_email = "citizen@example.com"
    existing_client = db.users.find_one({"email": client_email})
    if not existing_client:
        client_doc = {
            "name": "Jane Citizen",
            "email": client_email,
            "phone": "+1-555-0123",
            "password_hash": hash_password("citizenPassword123!"),
            "role": "client",
            "location": "Sector 4, Main Road",
            "created_at": datetime.utcnow()
        }
        db.users.insert_one(client_doc)
        print(f"[OK] Created Citizen account: {client_email} (password: citizenPassword123!)")
    else:
        print(f"[OK] Citizen already exists: {client_email}")

    print("=" * 60)
    print("Database seeding completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    seed_database()
