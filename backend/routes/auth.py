from datetime import datetime
from bson import ObjectId
from flask import Blueprint, request, jsonify
from database.mongodb import db
from auth.jwt_utils import hash_password, check_password, generate_token, token_required
from services.audit_service import log_audit

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").strip()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")
    location = data.get("location", "").strip()

    # Validations
    if not name or not email or not password:
        return jsonify({"success": False, "message": "Full Name, Email, and Password are required"}), 400

    if confirm_password and password != confirm_password:
        return jsonify({"success": False, "message": "Passwords do not match"}), 400

    if len(password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters long"}), 400

    # Email uniqueness check
    existing = db.users.find_one({"email": email})
    if existing:
        return jsonify({"success": False, "message": "This email address is already registered"}), 409

    user_doc = {
        "name": name,
        "email": email,
        "phone": phone,
        "password_hash": hash_password(password),
        "role": "client",  # Fixed role for citizen portal
        "location": location,
        "created_at": datetime.utcnow()
    }

    try:
        res = db.users.insert_one(user_doc)
        user_doc["_id"] = res.inserted_id

        # Generate JWT
        token = generate_token(user_doc)
        return jsonify({
            "success": True,
            "message": "Registration successful! Welcome to CivicAI.",
            "token": token,
            "user": {
                "id": str(user_doc["_id"]),
                "name": user_doc["name"],
                "email": user_doc["email"],
                "phone": user_doc["phone"],
                "role": user_doc["role"],
                "location": user_doc.get("location")
            }
        }), 201
    except Exception as e:
        return jsonify({"success": False, "message": f"Registration failed: {str(e)}"}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400

    user = db.users.find_one({"email": email})
    if not user or not check_password(password, user.get("password_hash", "")):
        return jsonify({"success": False, "message": "Invalid email or password"}), 401

    token = generate_token(user)

    if user.get("role") == "admin":
        log_audit(
            admin_id=str(user["_id"]),
            admin_email=user["email"],
            action="Admin Login",
            metadata={"ip": request.remote_addr}
        )

    return jsonify({
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "phone": user.get("phone"),
            "role": user.get("role", "client"),
            "location": user.get("location")
        }
    }), 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    return jsonify({"success": True, "message": "Successfully logged out"}), 200

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_me():
    user = db.users.find_one({"_id": ObjectId(request.current_user["id"])})
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    return jsonify({
        "success": True,
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "phone": user.get("phone"),
            "role": user.get("role", "client"),
            "location": user.get("location"),
            "created_at": user.get("created_at")
        }
    }), 200
