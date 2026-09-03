import os
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Ensure backend root in path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from app import create_app
from extensions import db
from models import User, Department, Complaint, EmailLog

def seed_database():
    app = create_app()
    with app.app_context():
        print("=" * 60)
        print("CivicAI Database Seeder")
        print("=" * 60)

        # 1. Create or verify Departments
        departments_data = [
            ("Roads & Infrastructure", "roads@city.gov", "Responsible for municipal roads, pavements, bridges, potholes, and highway infrastructure."),
            ("Water Supply", "water@city.gov", "Manages potable drinking water supply, pipeline networks, pressure distribution, and water contamination concerns."),
            ("Electricity", "electricity@city.gov", "Oversees power distribution lines, electrical substations, public transformers, and outage resolution."),
            ("Sanitation", "sanitation@city.gov", "Handles public hygiene, municipal restrooms, sewage cleanliness, and open sanitation issues."),
            ("Waste Management", "waste@city.gov", "Manages domestic garbage collection, municipal disposal bins, hazardous waste, and recycling operations."),
            ("Drainage", "drainage@city.gov", "Maintains underground sewers, stormwater drains, culverts, and flood prevention systems."),
            ("Public Safety", "publicsafety@city.gov", "Addresses structural hazards, feral animal threats, civic emergency conditions, and pedestrian safety."),
            ("Street Lighting", "streetlights@city.gov", "Maintains public illumination, streetlight fixtures, dark stretch remediation, and high-mast towers."),
            ("Traffic", "traffic@city.gov", "Oversees traffic flow controls, signaling systems, road signage, and junction congestion issues."),
            ("Public Health", "health@city.gov", "Controls vector-borne disease outbreaks, pest eradication, public clinic hygiene, and epidemiological hazards."),
            ("Parks & Environment", "parks@city.gov", "Maintains public gardens, community parks, lake bodies, urban tree covers, and environmental conservation."),
            ("Other", "general@city.gov", "General civic grievances, administrative requests, public information kiosks, and municipal services.")
        ]

        print("\n[1/4] Seeding Departments...")
        for name, email, desc in departments_data:
            existing = Department.query.filter_by(name=name).first()
            if not existing:
                dept = Department(name=name, email=email, description=desc)
                db.session.add(dept)
                print(f"  + Added Department: {name} ({email})")
            else:
                existing.email = email
                existing.description = desc
        db.session.commit()

        # 2. Create Users (Admin and Citizen)
        print("\n[2/4] Seeding Users...")
        # Admin User
        admin = User.query.filter_by(email="admin@civicai.gov").first()
        if not admin:
            admin = User(
                name="Civic Administrator",
                email="admin@civicai.gov",
                phone="555-0100",
                role="admin",
                location="City Hall, Municipal Center"
            )
            admin.set_password("admin123")
            db.session.add(admin)
            print("  + Added Admin User: admin@civicai.gov (Password: admin123) [DEVELOPMENT ONLY]")
        else:
            admin.role = "admin"
            admin.set_password("admin123")

        # Citizen User
        citizen = User.query.filter_by(email="citizen@civicai.gov").first()
        if not citizen:
            citizen = User(
                name="Jane Citizen",
                email="citizen@civicai.gov",
                phone="555-0144",
                role="citizen",
                location="Sector 4, Central Ward, Metropolis"
            )
            citizen.set_password("citizen123")
            db.session.add(citizen)
            print("  + Added Citizen User: citizen@civicai.gov (Password: citizen123) [DEVELOPMENT ONLY]")
        else:
            citizen.set_password("citizen123")

        db.session.commit()

        # 3. Seed Sample Complaints with various statuses & dates
        print("\n[3/4] Seeding Sample Complaints...")
        now = datetime.utcnow()

        sample_complaints = [
            {
                "desc": "There is a huge pothole near the college entrance and vehicles are almost falling.",
                "dept": "Roads & Infrastructure",
                "sev": "HIGH",
                "pri": "HIGH",
                "summary": "Large pothole reported near college entrance creating potential vehicular hazard.",
                "status": "In Progress",
                "days_ago": 3,
                "conf": (0.96, 0.88, 0.85)
            },
            {
                "desc": "Open drainage creating danger for pedestrians and children walking home from school.",
                "dept": "Drainage",
                "sev": "CRITICAL",
                "pri": "URGENT",
                "summary": "Hazardous open drain slab missing near school crossing requiring immediate barrier and repair.",
                "status": "Assigned",
                "days_ago": 1,
                "conf": (0.95, 0.94, 0.93)
            },
            {
                "desc": "Garbage has not been collected for several days and is spilling onto the roadway.",
                "dept": "Waste Management",
                "sev": "HIGH",
                "pri": "HIGH",
                "summary": "Municipal waste accumulation on residential roadway overflowing for past four days.",
                "status": "Pending",
                "days_ago": 0,
                "conf": (0.92, 0.85, 0.87)
            },
            {
                "desc": "High voltage transformer sparking and emitting dense smoke near children playground.",
                "dept": "Electricity",
                "sev": "CRITICAL",
                "pri": "URGENT",
                "summary": "Emergency electrical sparking on public transformer adjacent to children recreational area.",
                "status": "Pending",
                "days_ago": 0,
                "conf": (0.97, 0.96, 0.95)
            },
            {
                "desc": "Entire sector 14 main street is pitch dark because all streetlights are burned out.",
                "dept": "Street Lighting",
                "sev": "HIGH",
                "pri": "HIGH",
                "summary": "Complete street illumination blackout across sector 14 arterial roadway.",
                "status": "Resolved",
                "days_ago": 5,
                "conf": (0.94, 0.89, 0.88)
            },
            {
                "desc": "Main drinking water pipeline burst flooding colony avenue with clean water.",
                "dept": "Water Supply",
                "sev": "HIGH",
                "pri": "HIGH",
                "summary": "Ruptured municipal potable pipeline discharging high volume water onto public lane.",
                "status": "Resolved",
                "days_ago": 6,
                "conf": (0.93, 0.87, 0.89)
            },
            {
                "desc": "Traffic signal at 4-way market crossroad is dark causing gridlock and accidents.",
                "dept": "Traffic",
                "sev": "HIGH",
                "pri": "HIGH",
                "summary": "Non-operational junction traffic signal leading to severe vehicular conflict.",
                "status": "In Progress",
                "days_ago": 2,
                "conf": (0.91, 0.86, 0.84)
            },
            {
                "desc": "Huge fallen tree trunk blocking public jogging trail in Central Botanical Garden.",
                "dept": "Parks & Environment",
                "sev": "MEDIUM",
                "pri": "MEDIUM",
                "summary": "Fallen tree obstructing municipal garden walking trail requiring chainsaw removal.",
                "status": "Resolved",
                "days_ago": 4,
                "conf": (0.90, 0.82, 0.80)
            }
        ]

        complaint_count = Complaint.query.count()
        if complaint_count == 0:
            for item in sample_complaints:
                created_date = now - timedelta(days=item["days_ago"], hours=2)
                comp = Complaint(
                    user_id=citizen.id,
                    description=item["desc"],
                    department=item["dept"],
                    severity=item["sev"],
                    priority=item["pri"],
                    summary=item["summary"],
                    status=item["status"],
                    confidence_department=item["conf"][0],
                    confidence_severity=item["conf"][1],
                    confidence_priority=item["conf"][2],
                    created_at=created_date,
                    updated_at=created_date + timedelta(hours=4)
                )
                db.session.add(comp)
                db.session.flush()

                # Add sample email log for this complaint
                dept_email = f"{item['dept'].lower().replace(' ', '')}@city.gov"
                email_log = EmailLog(
                    complaint_id=comp.id,
                    recipient=dept_email,
                    subject=f"[CivicAI] {item['pri']} Priority Complaint #{comp.id} - {item['dept']}",
                    status="SENT" if item["days_ago"] > 1 else "FAILED",
                    sent_at=created_date,
                    error_message=None if item["days_ago"] > 1 else "Simulated SMTP timeout (demonstration log)"
                )
                db.session.add(email_log)
                print(f"  + Seeded Complaint #{comp.id} [{item['dept']} | {item['status']}]")

            db.session.commit()
        else:
            print(f"  Database already contains {complaint_count} complaints, skipping demo complaints insert.")

        print("\n[4/4] Seed complete!")
        print("=" * 60)
        print("DEMO CREDENTIALS (DEVELOPMENT ONLY):")
        print("  Admin   : admin@civicai.gov   / admin123")
        print("  Citizen : citizen@civicai.gov / citizen123")
        print("=" * 60)

if __name__ == "__main__":
    seed_database()
