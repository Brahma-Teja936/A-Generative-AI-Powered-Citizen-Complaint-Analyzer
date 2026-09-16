import os
import json
import datetime
from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from backend.app.extensions import Database, serialize_doc, hash_password
from backend.app.middleware.auth import roles_required, permissions_required
from backend.app.services.complaint_service import ComplaintService
from backend.app.services.department_service import DepartmentService
from backend.app.services.analytics_service import AnalyticsService
from backend.app.utils.audit import log_audit
from backend.config import Config

admin_bp = Blueprint("admin", __name__)

# --- DASHBOARD & ANALYTICS ---

@admin_bp.route("/dashboard", methods=["GET"])
@roles_required("ADMIN", "SUPER_ADMIN")
def get_dashboard():
    summary = AnalyticsService.get_dashboard_summary()
    breakdowns = AnalyticsService.get_breakdowns()
    return jsonify({
        "summary": summary,
        "breakdowns": breakdowns
    }), 200

@admin_bp.route("/analytics", methods=["GET"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("VIEW_ANALYTICS")
def get_analytics():
    summary = AnalyticsService.get_dashboard_summary()
    breakdowns = AnalyticsService.get_breakdowns()
    return jsonify({
        "summary": summary,
        "breakdowns": breakdowns
    }), 200

# --- COMPLAINTS MANAGEMENT ---

@admin_bp.route("/complaints", methods=["GET"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("VIEW_COMPLAINTS")
def list_complaints():
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 20))
    status = request.args.get("status")
    severity = request.args.get("severity")
    priority = request.args.get("priority")
    urgency = request.args.get("urgency")
    department = request.args.get("department")
    search = request.args.get("search")

    query = {}
    if status and status != "ALL":
        query["status"] = status
    if severity and severity != "ALL":
        query["severity"] = severity
    if priority and priority != "ALL":
        query["priority"] = priority
    if urgency and urgency != "ALL":
        query["urgency"] = urgency
    if department and department != "ALL":
        query["department"] = department
    if search:
        query["$or"] = [
            {"complaint_id": {"$regex": search, "$options": "i"}},
            {"title": {"$regex": search, "$options": "i"}},
            {"original_text": {"$regex": search, "$options": "i"}},
            {"location.address": {"$regex": search, "$options": "i"}}
        ]

    result = ComplaintService.get_complaints(query, page, page_size)
    return jsonify(result), 200

@admin_bp.route("/complaints/<complaint_id>", methods=["GET"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("VIEW_COMPLAINTS")
def get_complaint(complaint_id):
    complaint = ComplaintService.get_complaint_by_id(complaint_id, viewer_role="ADMIN")
    if not complaint:
        return jsonify({"error": "Complaint not found"}), 404
    return jsonify(complaint), 200

@admin_bp.route("/complaints/<complaint_id>/decision", methods=["PUT"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("REVIEW_AI")
def review_decision(complaint_id):
    admin = getattr(g, "current_user", {})
    data = request.get_json() or {}
    try:
        updated = ComplaintService.admin_review_decision(
            complaint_id=complaint_id,
            decision_data=data,
            admin_id=str(admin.get("id"))
        )
        return jsonify(updated), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route("/complaints/<complaint_id>/assign", methods=["PUT"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("ASSIGN_DEPARTMENT")
def assign_department(complaint_id):
    admin = getattr(g, "current_user", {})
    data = request.get_json() or {}
    dept_id = data.get("department_id")
    if not dept_id:
        return jsonify({"error": "department_id is required"}), 400

    try:
        updated = ComplaintService.assign_department(
            complaint_id=complaint_id,
            department_id=dept_id,
            admin_id=str(admin.get("id"))
        )
        return jsonify(updated), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route("/complaints/<complaint_id>/progress", methods=["POST"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("MANAGE_PROGRESS")
def add_complaint_progress(complaint_id):
    admin = getattr(g, "current_user", {})
    data = request.get_json() or {}
    desc = data.get("description", "").strip()
    status = data.get("status", "IN_PROGRESS")

    try:
        entry = ComplaintService.add_progress(
            complaint_id=complaint_id,
            dept_id=str(admin.get("id")),
            description=desc,
            new_status=status
        )
        return jsonify(entry), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route("/complaints/<complaint_id>/resolve", methods=["POST"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("RESOLVE_COMPLAINT")
def resolve_complaint_endpoint(complaint_id):
    admin = getattr(g, "current_user", {})
    data = request.get_json() or {}
    resolution_desc = data.get("resolution_description", "").strip()

    try:
        resolved = ComplaintService.resolve_complaint(
            complaint_id=complaint_id,
            resolver_id=str(admin.get("id")),
            resolution_desc=resolution_desc,
            evidence=data.get("evidence", [])
        )
        return jsonify(resolved), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route("/complaints/critical", methods=["GET"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("VIEW_CRITICAL")
def get_critical_complaints():
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 50))
    query = {
        "$or": [
            {"severity": "CRITICAL"},
            {"ai_prediction.safety_risk": "CRITICAL"},
            {"emergency_status": {"$ne": None}}
        ]
    }
    result = ComplaintService.get_complaints(query, page, page_size, sort_by="created_at")
    return jsonify(result), 200

@admin_bp.route("/complaints/urgent", methods=["GET"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("VIEW_URGENT")
def get_urgent_complaints():
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 50))
    query = {
        "urgency": {"$in": ["IMMEDIATE", "WITHIN 24 HOURS"]}
    }
    result = ComplaintService.get_complaints(query, page, page_size, sort_by="created_at")
    return jsonify(result), 200

# --- DEPARTMENT MANAGEMENT ---

@admin_bp.route("/departments", methods=["GET"])
@roles_required("ADMIN", "SUPER_ADMIN")
def list_departments():
    admin = getattr(g, "current_user", {})
    is_super = admin.get("role") == "SUPER_ADMIN"
    depts = DepartmentService.get_all_departments(is_super_admin=is_super)
    return jsonify(depts), 200

@admin_bp.route("/departments", methods=["POST"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("MANAGE_DEPARTMENTS")
def create_department_endpoint():
    admin = getattr(g, "current_user", {})
    data = request.get_json() or {}
    try:
        new_dept = DepartmentService.create_department(
            name=data.get("department_name", ""),
            email=data.get("department_email", ""),
            username=data.get("username", ""),
            password=data.get("password", ""),
            description=data.get("description", ""),
            admin_id=str(admin.get("id"))
        )
        return jsonify(new_dept), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route("/departments/<dept_id>", methods=["PUT"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("MANAGE_DEPARTMENTS")
def update_department_endpoint(dept_id):
    admin = getattr(g, "current_user", {})
    data = request.get_json() or {}
    try:
        updated = DepartmentService.update_department(dept_id, data, admin_id=str(admin.get("id")))
        return jsonify(updated), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@admin_bp.route("/departments/<dept_id>/activate", methods=["PUT"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("MANAGE_DEPARTMENTS")
def activate_department(dept_id):
    admin = getattr(g, "current_user", {})
    updated = DepartmentService.update_department(dept_id, {"active": True}, admin_id=str(admin.get("id")))
    return jsonify(updated), 200

@admin_bp.route("/departments/<dept_id>/deactivate", methods=["PUT"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("MANAGE_DEPARTMENTS")
def deactivate_department(dept_id):
    admin = getattr(g, "current_user", {})
    updated = DepartmentService.update_department(dept_id, {"active": False}, admin_id=str(admin.get("id")))
    return jsonify(updated), 200

@admin_bp.route("/departments/<dept_id>/reset-password", methods=["POST"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("MANAGE_DEPARTMENTS")
def reset_department_password(dept_id):
    admin = getattr(g, "current_user", {})
    data = request.get_json() or {}
    new_pw = data.get("password")
    if not new_pw or len(new_pw) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    DepartmentService.reset_password(dept_id, new_pw, admin_id=str(admin.get("id")))
    return jsonify({"message": "Password reset successfully"}), 200

# --- ADMIN MANAGEMENT (SUPER_ADMIN ONLY) ---

@admin_bp.route("/admins", methods=["GET"])
@roles_required("SUPER_ADMIN")
def list_admins():
    super_admin = getattr(g, "current_user", {})
    db = Database.get_db()
    admins = list(db.users.find({"role": "ADMIN"}).sort("created_at", -1))
    safe = []
    for a in admins:
        doc = serialize_doc(a)
        doc.pop("password_hash", None)
        # Only SUPER_ADMIN can view latest_password_plain
        if super_admin.get("role") != "SUPER_ADMIN":
            doc.pop("latest_password_plain", None)
        safe.append(doc)
    return jsonify(safe), 200

@admin_bp.route("/admins", methods=["POST"])
@roles_required("SUPER_ADMIN")
def create_admin():
    """
    SUPER_ADMIN creates a new ADMIN account.
    Normal admins are prevented by role decorator.
    """
    super_admin = getattr(g, "current_user", {})
    data = request.get_json() or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    username = data.get("username", "").strip().lower()
    phone = data.get("phone", "").strip()
    password = data.get("password", "")
    permissions = data.get("permissions", [])

    if not name or not email or not username or not password:
        return jsonify({"error": "Name, email, username, and password are required"}), 400

    db = Database.get_db()
    if db.users.find_one({"$or": [{"email": email}, {"username": username}]}):
        return jsonify({"error": "Administrator with this email or username already exists"}), 409

    now = datetime.datetime.now(datetime.timezone.utc)
    new_admin = {
        "name": name,
        "email": email,
        "username": username,
        "phone": phone,
        "password_hash": hash_password(password),
        "latest_password_plain": password,
        "last_password_change": now,
        "password_updated_by": f"SUPER_ADMIN:{super_admin.get('email')}",
        "role": "ADMIN", # Strictly ADMIN (cannot create SUPER_ADMIN)
        "permissions": permissions,
        "active": True,
        "created_by": str(super_admin.get("id")),
        "created_at": now,
        "updated_at": now,
        "last_login": None
    }

    res = db.users.insert_one(new_admin)
    new_admin["_id"] = res.inserted_id

    log_audit(
        action="ADMIN_CREATED",
        admin_id=str(super_admin.get("id")),
        target_id=str(res.inserted_id),
        new_value={"name": name, "email": email, "username": username, "permissions": permissions}
    )

    safe = serialize_doc(new_admin)
    safe.pop("password_hash", None)
    return jsonify(safe), 201

@admin_bp.route("/admins/<admin_id>/reset-password", methods=["POST"])
@roles_required("SUPER_ADMIN")
def reset_admin_password(admin_id):
    """
    SUPER_ADMIN resets a sub-administrator's password directly.
    """
    super_admin = getattr(g, "current_user", {})
    data = request.get_json() or {}
    new_pw = data.get("password")
    if not new_pw or len(new_pw) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400

    db = Database.get_db()
    obj_id = ObjectId(admin_id) if ObjectId.is_valid(admin_id) else admin_id
    now = datetime.datetime.now(datetime.timezone.utc)

    res = db.users.update_one(
        {"_id": obj_id, "role": "ADMIN"},
        {"$set": {
            "password_hash": hash_password(new_pw),
            "latest_password_plain": new_pw,
            "last_password_change": now,
            "password_updated_by": f"SUPER_ADMIN:{super_admin.get('email')}",
            "updated_at": now
        }}
    )
    if res.matched_count == 0:
        return jsonify({"error": "Administrator not found"}), 404

    log_audit(
        action="ADMIN_PASSWORD_RESET",
        admin_id=str(super_admin.get("id")),
        target_id=admin_id
    )

    return jsonify({"message": "Administrator password reset successfully."}), 200

@admin_bp.route("/complaints/<complaint_id>", methods=["DELETE"])
@roles_required("ADMIN", "SUPER_ADMIN")
def delete_admin_complaint(complaint_id):
    """
    ADMIN or SUPER_ADMIN deletes any complaint and cascades associated records.
    """
    admin = getattr(g, "current_user", {})
    success = ComplaintService.delete_complaint(
        complaint_id=complaint_id,
        user_id=str(admin.get("id")),
        user_role=admin.get("role")
    )
    if not success:
        return jsonify({"error": "Complaint not found or could not be deleted"}), 404
    return jsonify({"message": f"Complaint {complaint_id} deleted successfully."}), 200

@admin_bp.route("/admins/<admin_id>/activate", methods=["PUT"])
@roles_required("SUPER_ADMIN")
def activate_admin(admin_id):
    super_admin = getattr(g, "current_user", {})
    db = Database.get_db()
    obj_id = ObjectId(admin_id) if ObjectId.is_valid(admin_id) else admin_id
    db.users.update_one({"_id": obj_id, "role": "ADMIN"}, {"$set": {"active": True, "updated_at": datetime.datetime.now(datetime.timezone.utc)}})
    log_audit(action="ADMIN_ACTIVATED", admin_id=str(super_admin.get("id")), target_id=admin_id)
    return jsonify({"message": "Administrator activated"}), 200

@admin_bp.route("/admins/<admin_id>/deactivate", methods=["PUT"])
@roles_required("SUPER_ADMIN")
def deactivate_admin(admin_id):
    super_admin = getattr(g, "current_user", {})
    db = Database.get_db()
    obj_id = ObjectId(admin_id) if ObjectId.is_valid(admin_id) else admin_id
    db.users.update_one({"_id": obj_id, "role": "ADMIN"}, {"$set": {"active": False, "updated_at": datetime.datetime.now(datetime.timezone.utc)}})
    log_audit(action="ADMIN_DEACTIVATED", admin_id=str(super_admin.get("id")), target_id=admin_id)
    return jsonify({"message": "Administrator deactivated"}), 200

@admin_bp.route("/admins/<admin_id>/permissions", methods=["PUT"])
@roles_required("SUPER_ADMIN")
def update_admin_permissions(admin_id):
    super_admin = getattr(g, "current_user", {})
    data = request.get_json() or {}
    permissions = data.get("permissions", [])
    db = Database.get_db()
    obj_id = ObjectId(admin_id) if ObjectId.is_valid(admin_id) else admin_id
    db.users.update_one(
        {"_id": obj_id, "role": "ADMIN"},
        {"$set": {"permissions": permissions, "updated_at": datetime.datetime.now(datetime.timezone.utc)}}
    )
    log_audit(
        action="ADMIN_PERMISSION_CHANGED",
        admin_id=str(super_admin.get("id")),
        target_id=admin_id,
        new_value={"permissions": permissions}
    )
    return jsonify({"message": "Permissions updated"}), 200

# --- AUDIT LOGS & ML MONITORING ---

@admin_bp.route("/audit-logs", methods=["GET"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("VIEW_AUDIT_LOGS")
def get_audit_logs():
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 50))
    db = Database.get_db()
    skip = (page - 1) * page_size
    total = db.audit_logs.count_documents({})
    logs = list(db.audit_logs.find({}).sort("timestamp", -1).skip(skip).limit(page_size))
    return jsonify({
        "items": serialize_doc(logs),
        "total": total,
        "page": page,
        "pages": (total + page_size - 1) // page_size
    }), 200

@admin_bp.route("/ml-metrics", methods=["GET"])
@roles_required("ADMIN", "SUPER_ADMIN")
def get_ml_metrics():
    metrics_path = os.path.join(Config.MODELS_DIR, "model_metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path, "r", encoding="utf-8") as f:
            metrics = json.load(f)
            return jsonify({"metrics": metrics, "loaded": True}), 200
    return jsonify({"metrics": {}, "loaded": False, "message": "Models not yet generated"}), 200

# --- USER MANAGEMENT ---

@admin_bp.route("/users", methods=["GET"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("MANAGE_USERS")
def list_users():
    db = Database.get_db()
    users = list(db.users.find({"role": "CLIENT"}).sort("created_at", -1))
    safe = []
    for u in users:
        doc = serialize_doc(u)
        doc.pop("password_hash", None)
        safe.append(doc)
    return jsonify(safe), 200
