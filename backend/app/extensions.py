import datetime
import bcrypt
import jwt
from pymongo import MongoClient
from bson import ObjectId
from backend.config import Config

class Database:
    client: MongoClient = None
    db = None

    @classmethod
    def initialize(cls, app=None):
        uri = Config.MONGO_URI
        db_name = Config.MONGO_DB_NAME
        try:
            client_kwargs = {"serverSelectionTimeoutMS": 5000}
            try:
                import certifi
                client_kwargs["tlsCAFile"] = certifi.where()
            except ImportError:
                pass

            client = MongoClient(uri, **client_kwargs)
            # Ping database to verify connection
            client.admin.command('ping')
            cls.client = client
            cls.db = client[db_name]
            print(f"[CivicAI DB] Successfully connected to MongoDB database: {db_name}")
        except Exception as e:
            cls.client = None
            cls.db = None
            print(f"[CivicAI DB WARNING] Could not connect to MongoDB: {e}")
            print("[CivicAI DB NOTE] If using MongoDB Atlas, verify that your current public IP is added to the Atlas Network Access list (0.0.0.0/0 or current IP).")

    @classmethod
    def get_db(cls):
        return cls.db

db = Database()

def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt with salt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def generate_jwt_token(payload: dict, expires_in_hours: int = 24) -> str:
    """Generate a signed JWT token with standard claims."""
    now = datetime.datetime.now(datetime.timezone.utc)
    token_payload = {
        **payload,
        "iat": now,
        "exp": now + datetime.timedelta(hours=expires_in_hours)
    }
    return jwt.encode(token_payload, Config.JWT_SECRET, algorithm="HS256")

def decode_jwt_token(token: str) -> dict:
    """Decode and verify a signed JWT token."""
    try:
        return jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return {"error": "Token has expired"}
    except jwt.InvalidTokenError:
        return {"error": "Invalid token"}

def serialize_doc(doc):
    """Recursively convert ObjectId and datetime objects to JSON-serializable types."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                result[k] = str(v)
            elif isinstance(v, (datetime.datetime, datetime.date)):
                result[k] = v.isoformat()
            elif isinstance(v, (dict, list)):
                result[k] = serialize_doc(v)
            else:
                result[k] = v
        # Ensure 'id' field is present if '_id' was converted
        if '_id' in result and 'id' not in result:
            result['id'] = result['_id']
        return result
    return doc
