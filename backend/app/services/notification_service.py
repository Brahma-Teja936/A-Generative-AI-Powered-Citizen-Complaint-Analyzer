import datetime
from bson import ObjectId
from backend.app.extensions import Database, serialize_doc

class NotificationService:
    @staticmethod
    def create_notification(user_id=None, role: str = None, title: str = "", 
                            message: str = "", notification_type: str = "INFO", 
                            link: str = None, complaint_id: str = None):
        """
        Creates an in-app notification.
        Can target a specific user_id or broadcast to an entire role (e.g. 'ADMIN', 'DEPARTMENT').
        """
        db = Database.get_db()
        if db is None:
            return None

        notif = {
            "user_id": str(user_id) if user_id else None,
            "role": role,
            "title": title,
            "message": message,
            "type": notification_type,
            "link": link,
            "complaint_id": complaint_id,
            "is_read": False,
            "created_at": datetime.datetime.now(datetime.timezone.utc)
        }

        try:
            res = db.notifications.insert_one(notif)
            notif["_id"] = res.inserted_id
            return serialize_doc(notif)
        except Exception as e:
            print(f"[CivicAI Notification Error] {e}")
            return None

    @staticmethod
    def get_user_notifications(user_id: str, role: str, limit: int = 50):
        db = Database.get_db()
        if db is None:
            return []

        query = {
            "$or": [
                {"user_id": str(user_id)},
                {"role": role}
            ]
        }
        notifs = list(db.notifications.find(query).sort("created_at", -1).limit(limit))
        return serialize_doc(notifs)

    @staticmethod
    def mark_as_read(notification_id: str, user_id: str):
        db = Database.get_db()
        if db is None:
            return False

        try:
            obj_id = ObjectId(notification_id) if ObjectId.is_valid(notification_id) else notification_id
            db.notifications.update_one(
                {"_id": obj_id},
                {"$set": {"is_read": True, "read_at": datetime.datetime.now(datetime.timezone.utc)}}
            )
            return True
        except Exception as e:
            print(f"[CivicAI Notification Update Error] {e}")
            return False

    @staticmethod
    def delete_notification(notification_id: str, user_id: str = None, role: str = None) -> bool:
        db = Database.get_db()
        if db is None:
            return False

        try:
            obj_id = ObjectId(notification_id) if ObjectId.is_valid(notification_id) else notification_id
            query = {"_id": obj_id}
            if user_id and role:
                query["$or"] = [{"user_id": str(user_id)}, {"role": role}]
            res = db.notifications.delete_one(query)
            return res.deleted_count > 0
        except Exception as e:
            print(f"[CivicAI Notification Delete Error] {e}")
            return False

    @staticmethod
    def clear_all_notifications(user_id: str, role: str) -> int:
        db = Database.get_db()
        if db is None:
            return 0

        try:
            query = {
                "$or": [
                    {"user_id": str(user_id)},
                    {"role": role}
                ]
            }
            res = db.notifications.delete_many(query)
            return res.deleted_count
        except Exception as e:
            print(f"[CivicAI Notification Clear Error] {e}")
            return 0
