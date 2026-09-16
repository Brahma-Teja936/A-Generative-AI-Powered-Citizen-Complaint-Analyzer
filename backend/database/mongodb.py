import pymongo
from config import Config

class MongoDB:
    _instance = None

    def __init__(self):
        self.client = None
        self.db = None
        self.init_db()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = MongoDB()
        return cls._instance

    def init_db(self):
        try:
            self.client = pymongo.MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
            # Determine database name from URI or config
            db_name = Config.MONGO_DB_NAME
            if "/" in Config.MONGO_URI.split("?")[0].split("://")[-1]:
                uri_db = Config.MONGO_URI.split("?")[0].split("://")[-1].split("/")[-1]
                if uri_db:
                    db_name = uri_db
            self.db = self.client[db_name]
            print(f"[OK] Connected to MongoDB database: {self.db.name}")
            self.create_indexes()
        except Exception as e:
            print(f"[ERROR] MongoDB Connection error: {e}")

    def create_indexes(self):
        try:
            # users collection
            self.db.users.create_index("email", unique=True)
            self.db.users.create_index("role")

            # complaints collection
            self.db.complaints.create_index("complaint_id", unique=True)
            self.db.complaints.create_index("citizen_id")
            self.db.complaints.create_index("status")
            self.db.complaints.create_index("ai_analysis.department")
            self.db.complaints.create_index("ai_analysis.severity")
            self.db.complaints.create_index("ai_analysis.priority")
            self.db.complaints.create_index("created_at")

            # departments collection
            self.db.departments.create_index("department_name", unique=True)

            # complaint_progress collection
            self.db.complaint_progress.create_index("complaint_id")
            self.db.complaint_progress.create_index("created_at")

            # notifications collection
            self.db.notifications.create_index("user_id")
            self.db.notifications.create_index([("user_id", 1), ("read", 1)])
            self.db.notifications.create_index("created_at")

            # email_logs collection (Idempotency unique compound index: complaint_id + email_type + event_id)
            self.db.email_logs.create_index(
                [("complaint_id", 1), ("email_type", 1), ("event_id", 1)],
                unique=True,
                sparse=True
            )
            self.db.email_logs.create_index("created_at")

            # audit_logs collection
            self.db.audit_logs.create_index("complaint_id")
            self.db.audit_logs.create_index("action")
            self.db.audit_logs.create_index("timestamp")

            # model_predictions collection
            self.db.model_predictions.create_index("complaint_id")
            self.db.model_predictions.create_index("created_at")

            print("[OK] MongoDB indexes verified and created.")
        except Exception as e:
            print(f"[WARN] Error creating indexes: {e}")

    @property
    def users(self):
        return self.db.users

    @property
    def complaints(self):
        return self.db.complaints

    @property
    def departments(self):
        return self.db.departments

    @property
    def complaint_progress(self):
        return self.db.complaint_progress

    @property
    def notifications(self):
        return self.db.notifications

    @property
    def email_logs(self):
        return self.db.email_logs

    @property
    def audit_logs(self):
        return self.db.audit_logs

    @property
    def model_predictions(self):
        return self.db.model_predictions

# Export singleton
db = MongoDB.get_instance()
