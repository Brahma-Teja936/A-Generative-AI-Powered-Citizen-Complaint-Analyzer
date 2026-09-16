import datetime
from bson import ObjectId
from backend.app.extensions import Database, hash_password, serialize_doc
from backend.app.utils.audit import log_audit

class DepartmentService:
    @staticmethod
    def get_all_departments(only_active=False, is_super_admin=False):
        db = Database.get_db()
        if db is None:
            return []

        query = {"active": True} if only_active else {}
        departments = list(db.departments.find(query).sort("department_name", 1))

        # Calculate current live workload for each department
        for dept in departments:
            dept_id_str = str(dept["_id"])
            active_count = db.complaints.count_documents({
                "assigned_department_id": dept_id_str,
                "status": {"$in": ["ASSIGNED", "ACCEPTED", "IN_PROGRESS", "ON_HOLD"]},
                "is_training_data": False,
                "record_type": "LIVE"
            })
            resolved_count = db.complaints.count_documents({
                "assigned_department_id": dept_id_str,
                "status": "RESOLVED",
                "is_training_data": False,
                "record_type": "LIVE"
            })
            dept["active_workload"] = active_count
            dept["resolved_count"] = resolved_count

            # If not SuperAdmin, strictly hide the plain password
            if not is_super_admin:
                dept.pop("latest_password_plain", None)

        return serialize_doc(departments)

    @staticmethod
    def get_department_by_id(dept_id: str):
        db = Database.get_db()
        if db is None:
            return None
        obj_id = ObjectId(dept_id) if ObjectId.is_valid(dept_id) else dept_id
        dept = db.departments.find_one({"_id": obj_id})
        return serialize_doc(dept)

    @staticmethod
    def get_department_email(dept_id: str) -> str:
        """
        Dynamically retrieves the latest email directly from MongoDB.
        Never uses hardcoded or cached emails.
        """
        db = Database.get_db()
        if db is None:
            return None
        obj_id = ObjectId(dept_id) if ObjectId.is_valid(dept_id) else dept_id
        dept = db.departments.find_one({"_id": obj_id}, {"department_email": 1})
        if dept:
            return dept.get("department_email")
        return None

    @staticmethod
    def create_department(name: str, email: str, username: str, password: str, description: str = "", admin_id: str = None):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database unavailable")

        # Check uniqueness
        if db.departments.find_one({"$or": [{"department_name": name}, {"department_email": email}, {"username": username}]}):
            raise ValueError("Department with this name, email, or username already exists.")

        now = datetime.datetime.now(datetime.timezone.utc)
        new_dept = {
            "department_name": name.strip(),
            "department_email": email.strip().lower(),
            "username": username.strip().lower(),
            "password_hash": hash_password(password),
            "latest_password_plain": password,
            "last_password_change": now,
            "password_updated_by": f"ADMIN:{admin_id}" if admin_id else "SYSTEM",
            "role": "DEPARTMENT",
            "description": description.strip(),
            "active": True,
            "created_at": now,
            "updated_at": now
        }

        res = db.departments.insert_one(new_dept)
        new_dept["_id"] = res.inserted_id

        log_audit(
            action="DEPARTMENT_CREATED",
            admin_id=admin_id,
            target_id=str(res.inserted_id),
            new_value={"name": name, "email": email, "username": username}
        )

        return serialize_doc(new_dept)

    @staticmethod
    def update_department(dept_id: str, updates: dict, admin_id: str = None):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database unavailable")

        obj_id = ObjectId(dept_id) if ObjectId.is_valid(dept_id) else dept_id
        old_dept = db.departments.find_one({"_id": obj_id})
        if not old_dept:
            raise ValueError("Department not found")

        allowed_fields = ["department_name", "department_email", "username", "description", "active"]
        clean_updates = {k: v for k, v in updates.items() if k in allowed_fields}
        clean_updates["updated_at"] = datetime.datetime.now(datetime.timezone.utc)

        db.departments.update_one({"_id": obj_id}, {"$set": clean_updates})

        log_audit(
            action="DEPARTMENT_UPDATED",
            admin_id=admin_id,
            target_id=dept_id,
            old_value={"name": old_dept.get("department_name"), "email": old_dept.get("department_email")},
            new_value=clean_updates
        )

        updated = db.departments.find_one({"_id": obj_id})
        return serialize_doc(updated)

    @staticmethod
    def reset_password(dept_id: str, new_password: str, admin_id: str = None):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database unavailable")

        obj_id = ObjectId(dept_id) if ObjectId.is_valid(dept_id) else dept_id
        now = datetime.datetime.now(datetime.timezone.utc)
        db.departments.update_one(
            {"_id": obj_id},
            {"$set": {
                "password_hash": hash_password(new_password),
                "latest_password_plain": new_password,
                "last_password_change": now,
                "password_updated_by": f"ADMIN:{admin_id}" if admin_id else "SUPER_ADMIN",
                "updated_at": now
            }}
        )

        log_audit(
            action="DEPARTMENT_PASSWORD_RESET",
            admin_id=admin_id,
            target_id=dept_id
        )
        return True
