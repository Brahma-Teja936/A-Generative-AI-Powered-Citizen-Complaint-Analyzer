from functools import wraps
from flask import request, jsonify, g
from bson import ObjectId
from backend.app.extensions import Database, decode_jwt_token

ALL_ADMIN_PERMISSIONS = [
    "VIEW_COMPLAINTS",
    "REVIEW_AI",
    "OVERRIDE_AI",
    "ASSIGN_DEPARTMENT",
    "REASSIGN_DEPARTMENT",
    "MANAGE_PROGRESS",
    "RESOLVE_COMPLAINT",
    "VIEW_ANALYTICS",
    "VIEW_MAP",
    "VIEW_CRITICAL",
    "VIEW_URGENT",
    "EMERGENCY_RESPONSE",
    "MANAGE_DEPARTMENTS",
    "MANAGE_EMERGENCY_SERVICES",
    "VIEW_AUDIT_LOGS",
    "MANAGE_USERS",
    "MANAGE_ADMINS"
]

def jwt_required(f):
    """
    Validates JWT Bearer token and attaches current user object from DB to flask.g.current_user.
    Verifies user is active (soft deactivation check).
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization header missing or invalid format (Bearer token required)"}), 401

        token = auth_header.split(" ")[1].strip()
        decoded = decode_jwt_token(token)
        if "error" in decoded:
            return jsonify({"error": decoded["error"]}), 401

        user_id = decoded.get("sub")
        role = decoded.get("role")
        if not user_id:
            return jsonify({"error": "Malformed token claims"}), 401

        db = Database.get_db()
        if db is None:
            # Emergency offline/test fallback
            g.current_user = {"id": user_id, "role": role, "active": True}
            return f(*args, **kwargs)

        # Check in users or departments collection based on role claim
        if role == "DEPARTMENT":
            dept = db.departments.find_one({"_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id})
            if not dept or not dept.get("active", True):
                return jsonify({"error": "Department account inactive or not found"}), 403
            dept["id"] = str(dept["_id"])
            dept["role"] = "DEPARTMENT"
            g.current_user = dept
        else:
            user = db.users.find_one({"_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id})
            if not user or not user.get("active", True):
                return jsonify({"error": "User account is deactivated or not found"}), 403
            user["id"] = str(user["_id"])
            # Never trust token's role; take role directly from verified DB record!
            g.current_user = user

        return f(*args, **kwargs)
    return decorated

def roles_required(*allowed_roles):
    """
    Decorator requiring the authenticated user to hold one of the specified roles.
    """
    def decorator(f):
        @wraps(f)
        @jwt_required
        def decorated_function(*args, **kwargs):
            user = getattr(g, "current_user", None)
            if not user or user.get("role") not in allowed_roles:
                return jsonify({
                    "error": "Forbidden", 
                    "message": f"Access denied. Requires one of roles: {', '.join(allowed_roles)}"
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def permissions_required(*required_permissions):
    """
    Decorator requiring the user (ADMIN or SUPER_ADMIN) to have specific permissions.
    SUPER_ADMIN bypasses all permission checks.
    """
    def decorator(f):
        @wraps(f)
        @jwt_required
        def decorated_function(*args, **kwargs):
            user = getattr(g, "current_user", None)
            if not user:
                return jsonify({"error": "Unauthorized"}), 401

            role = user.get("role")
            if role == "SUPER_ADMIN":
                return f(*args, **kwargs) # Super admin has all permissions

            if role != "ADMIN":
                return jsonify({"error": "Forbidden", "message": "Admin privileges required"}), 403

            user_permissions = set(user.get("permissions", []))
            for perm in required_permissions:
                if perm not in user_permissions:
                    return jsonify({
                        "error": "Forbidden",
                        "message": f"Missing required permission: {perm}"
                    }), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator
