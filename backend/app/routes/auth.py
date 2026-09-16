import datetime
from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from backend.app.extensions import Database, hash_password, verify_password, generate_jwt_token, serialize_doc
from backend.app.utils.audit import log_audit
from backend.app.middleware.auth import jwt_required

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Registers a new CLIENT citizen account.
    """
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    username = data.get("username", "").strip().lower()
    phone = data.get("phone", "").strip()
    password = data.get("password", "")

    if not name or not email or not username or not password:
        return jsonify({"error": "Name, email, username, and password are required."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    db = Database.get_db()
    if db is None:
        return jsonify({"error": "Database unavailable"}), 500

    # Check for existing email or username
    if db.users.find_one({"$or": [{"email": email}, {"username": username}]}):
        return jsonify({"error": "An account with this email or username already exists."}), 409

    now = datetime.datetime.now(datetime.timezone.utc)
    user_doc = {
        "name": name,
        "email": email,
        "username": username,
        "phone": phone,
        "password_hash": hash_password(password),
        "role": "CLIENT",
        "permissions": [],
        "active": True,
        "created_by": "SELF_REGISTRATION",
        "created_at": now,
        "updated_at": now,
        "last_login": None
    }

    res = db.users.insert_one(user_doc)
    user_doc["_id"] = res.inserted_id

    # Issue JWT token
    token = generate_jwt_token({
        "sub": str(res.inserted_id),
        "role": "CLIENT",
        "name": name,
        "email": email
    })

    safe_user = serialize_doc(user_doc)
    safe_user.pop("password_hash", None)

    return jsonify({
        "message": "Citizen registered successfully",
        "token": token,
        "user": safe_user
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Universal login for CLIENTs and ADMINs.
    """
    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip().lower() # email or username
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "Username/Email and password required."}), 400

    db = Database.get_db()
    if db is None:
        return jsonify({"error": "Database unavailable"}), 500

    user = db.users.find_one({
        "$or": [{"email": identifier}, {"username": identifier}]
    })

    if not user or not verify_password(password, user.get("password_hash", "")):
        log_audit(
            action="LOGIN_FAILED",
            metadata={"identifier": identifier, "ip": request.remote_addr}
        )
        return jsonify({"error": "Invalid username/email or password."}), 401

    if not user.get("active", True):
        return jsonify({"error": "Account has been deactivated. Please contact support."}), 403

    now = datetime.datetime.now(datetime.timezone.utc)
    db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login": now}})

    token = generate_jwt_token({
        "sub": str(user["_id"]),
        "role": user.get("role"),
        "name": user.get("name"),
        "email": user.get("email")
    })

    log_audit(
        action=f"{user.get('role')}_LOGIN",
        admin_id=str(user["_id"]) if user.get("role") in ["ADMIN", "SUPER_ADMIN"] else None,
        target_id=str(user["_id"]),
        metadata={"ip": request.remote_addr}
    )

    safe_user = serialize_doc(user)
    safe_user.pop("password_hash", None)

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": safe_user
    }), 200

@auth_bp.route("/admin/login", methods=["POST"])
def admin_login():
    """
    Dedicated endpoint for ADMIN and SUPER_ADMIN authentication.
    """
    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip().lower()
    password = data.get("password", "")

    db = Database.get_db()
    if db is None:
        return jsonify({"error": "Database unavailable"}), 500

    user = db.users.find_one({
        "$or": [{"email": identifier}, {"username": identifier}],
        "role": {"$in": ["ADMIN", "SUPER_ADMIN"]}
    })

    if not user or not verify_password(password, user.get("password_hash", "")):
        log_audit(
            action="ADMIN_FAILED_LOGIN",
            metadata={"identifier": identifier, "ip": request.remote_addr}
        )
        return jsonify({"error": "Invalid administrator credentials."}), 401

    if not user.get("active", True):
        return jsonify({"error": "Administrator account deactivated."}), 403

    now = datetime.datetime.now(datetime.timezone.utc)
    db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login": now}})

    token = generate_jwt_token({
        "sub": str(user["_id"]),
        "role": user.get("role"),
        "name": user.get("name"),
        "email": user.get("email")
    })

    log_audit(
        action="ADMIN_LOGIN",
        admin_id=str(user["_id"]),
        target_id=str(user["_id"])
    )

    safe_user = serialize_doc(user)
    safe_user.pop("password_hash", None)

    return jsonify({
        "message": "Admin login successful",
        "token": token,
        "user": safe_user
    }), 200

@auth_bp.route("/department/login", methods=["POST"])
def department_login():
    """
    Dedicated endpoint for DEPARTMENT authentication.
    """
    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip().lower()
    password = data.get("password", "")

    db = Database.get_db()
    if db is None:
        return jsonify({"error": "Database unavailable"}), 500

    dept = db.departments.find_one({
        "$or": [{"department_email": identifier}, {"username": identifier}]
    })

    if not dept or not verify_password(password, dept.get("password_hash", "")):
        return jsonify({"error": "Invalid department credentials."}), 401

    if not dept.get("active", True):
        return jsonify({"error": "Department account is deactivated."}), 403

    token = generate_jwt_token({
        "sub": str(dept["_id"]),
        "role": "DEPARTMENT",
        "name": dept.get("department_name"),
        "email": dept.get("department_email")
    })

    safe_dept = serialize_doc(dept)
    safe_dept.pop("password_hash", None)

    return jsonify({
        "message": "Department login successful",
        "token": token,
        "user": safe_dept
    }), 200

@auth_bp.route("/logout", methods=["POST"])
@jwt_required
def logout():
    """
    Logs user logout action.
    """
    user = getattr(g, "current_user", {})
    log_audit(
        action=f"{user.get('role', 'USER')}_LOGOUT",
        admin_id=str(user.get("id")) if user.get("role") in ["ADMIN", "SUPER_ADMIN"] else None,
        target_id=str(user.get("id"))
    )
    return jsonify({"message": "Successfully logged out"}), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required
def get_current_profile():
    user = getattr(g, "current_user", {})
    safe = serialize_doc(user)
    if isinstance(safe, dict):
        safe.pop("password_hash", None)
    return jsonify({"user": safe}), 200

@auth_bp.route("/change-password", methods=["POST"])
@jwt_required
def change_password():
    """
    Universal password update for authenticated users (CLIENT, ADMIN, SUPER_ADMIN, DEPARTMENT).
    Verifies current password with bcrypt, updates hash, and tracks metadata.
    """
    user = getattr(g, "current_user", {})
    user_id = str(user.get("id"))
    role = user.get("role")

    data = request.get_json() or {}
    current_pw = data.get("current_password", "")
    new_pw = data.get("new_password", "")

    if not current_pw or not new_pw:
        return jsonify({"error": "Current password and new password are required."}), 400

    if len(new_pw) < 6:
        return jsonify({"error": "New password must be at least 6 characters long."}), 400

    db = Database.get_db()
    if db is None:
        return jsonify({"error": "Database unavailable"}), 500

    now = datetime.datetime.now(datetime.timezone.utc)
    new_hash = hash_password(new_pw)

    if role == "DEPARTMENT":
        obj_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
        dept = db.departments.find_one({"_id": obj_id})
        if not dept or not verify_password(current_pw, dept.get("password_hash", "")):
            return jsonify({"error": "Current password does not match our records."}), 401

        db.departments.update_one(
            {"_id": obj_id},
            {"$set": {
                "password_hash": new_hash,
                "latest_password_plain": new_pw,
                "last_password_change": now,
                "password_updated_by": f"DEPARTMENT:{dept.get('username')}",
                "updated_at": now
            }}
        )
    else:
        obj_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
        user_doc = db.users.find_one({"_id": obj_id})
        if not user_doc or not verify_password(current_pw, user_doc.get("password_hash", "")):
            return jsonify({"error": "Current password does not match our records."}), 401

        db.users.update_one(
            {"_id": obj_id},
            {"$set": {
                "password_hash": new_hash,
                "latest_password_plain": new_pw,
                "last_password_change": now,
                "password_updated_by": f"{role}:{user_doc.get('username') or user_doc.get('email')}",
                "updated_at": now
            }}
        )

    log_audit(
        action=f"{role}_PASSWORD_CHANGED",
        admin_id=user_id if role in ["ADMIN", "SUPER_ADMIN"] else None,
        target_id=user_id
    )

    return jsonify({"message": "Password updated successfully."}), 200
