import datetime
from functools import wraps
from bson import ObjectId
import jwt
import bcrypt
from flask import request, jsonify
from config import Config
from database.mongodb import db

def hash_password(password: str) -> str:
    """Hash plain text password with bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def check_password(password: str, hashed: str) -> bool:
    """Verify plain text password against stored bcrypt hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def generate_token(user: dict) -> str:
    """Generate signed JWT token containing user identity and role"""
    payload = {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", "User"),
        "role": user.get("role", "client"),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=Config.JWT_EXPIRATION_DAYS),
        "iat": datetime.datetime.utcnow()
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")

def decode_token(token: str) -> dict:
    """Decode and verify signed JWT token"""
    return jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])

def get_token_from_request():
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        if not token:
            return jsonify({"success": False, "message": "Authentication token is missing"}), 401
        
        try:
            payload = decode_token(token)
            user_id = payload.get("user_id")
            user = db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                return jsonify({"success": False, "message": "User account no longer exists"}), 401
            
            # Attach current user to request
            request.current_user = {
                "id": str(user["_id"]),
                "name": user.get("name"),
                "email": user.get("email"),
                "phone": user.get("phone"),
                "role": user.get("role", "client")
            }
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Session expired. Please log in again"}), 401
        except Exception as e:
            return jsonify({"success": False, "message": f"Invalid token: {str(e)}"}), 401
            
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        if not token:
            return jsonify({"success": False, "message": "Admin authorization token required"}), 401
        
        try:
            payload = decode_token(token)
            user_id = payload.get("user_id")
            user = db.users.find_one({"_id": ObjectId(user_id)})
            if not user or user.get("role") != "admin":
                return jsonify({"success": False, "message": "Access denied: Administrator privileges required"}), 403
            
            request.current_user = {
                "id": str(user["_id"]),
                "name": user.get("name"),
                "email": user.get("email"),
                "role": "admin"
            }
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Admin session expired"}), 401
        except Exception:
            return jsonify({"success": False, "message": "Invalid administrator token"}), 401
            
        return f(*args, **kwargs)
    return decorated

def client_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        if not token:
            return jsonify({"success": False, "message": "Authentication token required"}), 401
        
        try:
            payload = decode_token(token)
            user_id = payload.get("user_id")
            user = db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                return jsonify({"success": False, "message": "User not found"}), 401
            
            request.current_user = {
                "id": str(user["_id"]),
                "name": user.get("name"),
                "email": user.get("email"),
                "phone": user.get("phone"),
                "role": user.get("role", "client")
            }
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Session expired"}), 401
        except Exception:
            return jsonify({"success": False, "message": "Invalid token"}), 401
            
        return f(*args, **kwargs)
    return decorated
