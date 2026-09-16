import datetime
from bson import ObjectId
from backend.app.extensions import Database, serialize_doc
from backend.app.utils.helpers import calculate_haversine_distance_km
from backend.app.utils.audit import log_audit
from backend.app.services.email_service import EmailService

EMERGENCY_STATUSES = [
    "DETECTED",
    "ADMIN_REVIEW",
    "EMERGENCY_DECLARED",
    "SERVICE_CONTACTED",
    "SERVICE_ACKNOWLEDGED",
    "RESPONDING",
    "ON_SCENE",
    "EMERGENCY_RESOLVED"
]

class EmergencyService:
    @staticmethod
    def get_services(service_type=None, active_only=True):
        db = Database.get_db()
        if db is None:
            return []
        query = {}
        if active_only:
            query["active"] = True
        if service_type and service_type != "ALL":
            query["service_type"] = service_type
        services = list(db.emergency_services.find(query))
        return serialize_doc(services)

    @staticmethod
    def create_service(data: dict, admin_id: str = None):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database unavailable")

        lat = float(data.get("latitude", 17.3850))
        lng = float(data.get("longitude", 78.4867))

        doc = {
            "service_id": f"EMS-{int(datetime.datetime.now().timestamp()) % 100000}",
            "service_type": data.get("service_type", "AMBULANCE"),
            "organization_name": data.get("organization_name", "").strip(),
            "phone": data.get("phone", "").strip(),
            "email": data.get("email", "").strip().lower(),
            "address": data.get("address", "").strip(),
            "location": {
                "type": "Point",
                "coordinates": [lng, lat]
            },
            "service_area": data.get("service_area", "Citywide"),
            "active": True,
            "created_at": datetime.datetime.now(datetime.timezone.utc)
        }

        res = db.emergency_services.insert_one(doc)
        doc["_id"] = res.inserted_id

        log_audit(
            action="EMERGENCY_SERVICE_CREATED",
            admin_id=admin_id,
            target_id=str(res.inserted_id),
            new_value={"name": doc["organization_name"], "type": doc["service_type"]}
        )

        return serialize_doc(doc)

    @staticmethod
    def find_nearest_services(lat: float, lng: float, limit: int = 10):
        """
        Finds nearest emergency responders using geospatial query or Haversine fallback.
        """
        db = Database.get_db()
        if db is None:
            return []

        services = list(db.emergency_services.find({"active": True}))
        results = []

        for s in services:
            coords = s.get("location", {}).get("coordinates", [lng, lat])
            s_lng, s_lat = coords[0], coords[1]
            dist_km = calculate_haversine_distance_km(lat, lng, s_lat, s_lng)
            s_dict = serialize_doc(s)
            s_dict["distance_km"] = dist_km
            results.append(s_dict)

        results.sort(key=lambda x: x.get("distance_km", 9999))
        return results[:limit]

    @staticmethod
    def declare_emergency(complaint_id: str, admin_id: str, declaration_notes: str = ""):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database unavailable")

        now = datetime.datetime.now(datetime.timezone.utc)
        update_doc = {
            "emergency_status": "EMERGENCY_DECLARED",
            "emergency_declared_at": now,
            "emergency_declared_by": admin_id,
            "emergency_declaration_notes": declaration_notes
        }

        db.complaints.update_one(
            {"complaint_id": complaint_id},
            {
                "$set": update_doc,
                "$push": {
                    "emergency_timeline": {
                        "event": "EMERGENCY_DECLARED",
                        "timestamp": now,
                        "actor": admin_id,
                        "notes": declaration_notes
                    }
                }
            }
        )

        log_audit(
            action="EMERGENCY_DECLARED",
            admin_id=admin_id,
            target_id=complaint_id,
            new_value={"status": "EMERGENCY_DECLARED", "notes": declaration_notes}
        )

        # Retrieve complaint to send emergency alert email
        complaint = db.complaints.find_one({"complaint_id": complaint_id})
        if complaint:
            admin_user = db.users.find_one({"_id": ObjectId(admin_id) if ObjectId.is_valid(admin_id) else admin_id})
            admin_email = admin_user.get("email") if admin_user else None
            if admin_email:
                EmailService.send_emergency_alert(complaint, admin_email)

        return serialize_doc(complaint)

    @staticmethod
    def contact_service(complaint_id: str, service_id: str, service_type: str, admin_id: str, notes: str = ""):
        """
        Logs authorized emergency dispatch action and advances status to SERVICE_CONTACTED.
        Complies with Section 81: Real logging without fictitious autonomous calls.
        """
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database unavailable")

        now = datetime.datetime.now(datetime.timezone.utc)
        action_doc = {
            "complaint_id": complaint_id,
            "service_type": service_type,
            "service_id": service_id,
            "action": f"DISPATCH_REQUEST_{service_type}",
            "initiated_by": admin_id,
            "initiated_at": now,
            "acknowledged_at": None,
            "status": "SERVICE_CONTACTED",
            "notes": notes,
            "created_at": now
        }

        res = db.emergency_actions.insert_one(action_doc)
        action_doc["_id"] = res.inserted_id

        db.complaints.update_one(
            {"complaint_id": complaint_id},
            {
                "$set": {
                    "emergency_status": "SERVICE_CONTACTED",
                    "last_emergency_action_at": now
                },
                "$push": {
                    "emergency_timeline": {
                        "event": f"SERVICE_CONTACTED ({service_type})",
                        "service_id": service_id,
                        "timestamp": now,
                        "actor": admin_id,
                        "notes": notes
                    }
                }
            }
        )

        log_audit(
            action="EMERGENCY_SERVICE_CONTACTED",
            admin_id=admin_id,
            target_id=complaint_id,
            new_value={"service_type": service_type, "service_id": service_id}
        )

        return serialize_doc(action_doc)

    @staticmethod
    def acknowledge_service(action_id: str, admin_id: str, notes: str = ""):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database unavailable")

        now = datetime.datetime.now(datetime.timezone.utc)
        obj_id = ObjectId(action_id) if ObjectId.is_valid(action_id) else action_id

        action = db.emergency_actions.find_one({"_id": obj_id})
        if not action:
            raise ValueError("Emergency action record not found")

        cid = action.get("complaint_id")
        db.emergency_actions.update_one(
            {"_id": obj_id},
            {"$set": {
                "status": "SERVICE_ACKNOWLEDGED",
                "acknowledged_at": now,
                "acknowledgement_notes": notes
            }}
        )

        db.complaints.update_one(
            {"complaint_id": cid},
            {
                "$set": {"emergency_status": "SERVICE_ACKNOWLEDGED"},
                "$push": {
                    "emergency_timeline": {
                        "event": "SERVICE_ACKNOWLEDGED",
                        "service_id": action.get("service_id"),
                        "timestamp": now,
                        "actor": admin_id,
                        "notes": notes
                    }
                }
            }
        )

        log_audit(
            action="EMERGENCY_SERVICE_ACKNOWLEDGED",
            admin_id=admin_id,
            target_id=cid,
            new_value={"action_id": str(action_id)}
        )

        return True

    @staticmethod
    def resolve_emergency(complaint_id: str, admin_id: str, resolution_notes: str = ""):
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database unavailable")

        now = datetime.datetime.now(datetime.timezone.utc)
        db.complaints.update_one(
            {"complaint_id": complaint_id},
            {
                "$set": {
                    "emergency_status": "EMERGENCY_RESOLVED",
                    "emergency_resolved_at": now,
                    "emergency_resolved_by": admin_id,
                    "emergency_resolution_notes": resolution_notes
                },
                "$push": {
                    "emergency_timeline": {
                        "event": "EMERGENCY_RESOLVED",
                        "timestamp": now,
                        "actor": admin_id,
                        "notes": resolution_notes
                    }
                }
            }
        )

        db.emergency_actions.update_many(
            {"complaint_id": complaint_id},
            {"$set": {"status": "EMERGENCY_RESOLVED", "resolved_at": now}}
        )

        log_audit(
            action="EMERGENCY_RESOLVED",
            admin_id=admin_id,
            target_id=complaint_id,
            new_value={"notes": resolution_notes}
        )

        return True
