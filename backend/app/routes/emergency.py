import datetime
from flask import Blueprint, request, jsonify, g
from bson import ObjectId
from backend.app.extensions import Database, serialize_doc
from backend.app.middleware.auth import roles_required, permissions_required
from backend.app.services.emergency_service import EmergencyService
from backend.app.services.complaint_service import ComplaintService

emergency_bp = Blueprint("emergency", __name__)

@emergency_bp.route("", methods=["GET"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("EMERGENCY_RESPONSE")
def list_emergency_incidents():
    """
    Returns live critical incidents needing emergency monitoring and dispatch.
    """
    db = Database.get_db()
    if db is None:
        return jsonify({"incidents": []}), 200

    query = {
        "is_training_data": False,
        "record_type": "LIVE",
        "$or": [
            {"emergency_status": {"$ne": None}},
            {"severity": "CRITICAL"},
            {"urgency": "IMMEDIATE"}
        ]
    }

    incidents = list(db.complaints.find(query).sort("created_at", -1))
    return jsonify({"incidents": serialize_doc(incidents)}), 200

@emergency_bp.route("/<complaint_id>", methods=["GET"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("EMERGENCY_RESPONSE")
def get_incident_details(complaint_id):
    db = Database.get_db()
    complaint = ComplaintService.get_complaint_by_id(complaint_id, viewer_role="ADMIN")
    if not complaint:
        return jsonify({"error": "Incident complaint not found"}), 404

    # Calculate nearest emergency services
    coords = complaint.get("location", {}).get("coordinates", [78.4867, 17.3850])
    nearest = EmergencyService.find_nearest_services(lat=coords[1], lng=coords[0], limit=10)

    # Get logged actions
    actions = list(db.emergency_actions.find({"complaint_id": complaint_id}).sort("initiated_at", -1))

    return jsonify({
        "incident": complaint,
        "nearest_services": nearest,
        "actions": serialize_doc(actions)
    }), 200

@emergency_bp.route("/<complaint_id>/declare", methods=["POST"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("EMERGENCY_RESPONSE")
def declare_emergency(complaint_id):
    admin = getattr(g, "current_user", {})
    data = request.get_json() or {}
    try:
        updated = EmergencyService.declare_emergency(
            complaint_id=complaint_id,
            admin_id=str(admin.get("id")),
            declaration_notes=data.get("notes", "")
        )
        return jsonify(updated), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@emergency_bp.route("/<complaint_id>/contact-service", methods=["POST"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("EMERGENCY_RESPONSE")
def contact_service(complaint_id):
    admin = getattr(g, "current_user", {})
    data = request.get_json() or {}
    service_id = data.get("service_id")
    service_type = data.get("service_type", "AMBULANCE")
    notes = data.get("notes", "")

    if not service_id:
        return jsonify({"error": "service_id is required"}), 400

    try:
        action = EmergencyService.contact_service(
            complaint_id=complaint_id,
            service_id=service_id,
            service_type=service_type,
            admin_id=str(admin.get("id")),
            notes=notes
        )
        return jsonify(action), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@emergency_bp.route("/actions/<action_id>/acknowledge", methods=["POST"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("EMERGENCY_RESPONSE")
def acknowledge_action(action_id):
    admin = getattr(g, "current_user", {})
    data = request.get_json() or {}
    try:
        EmergencyService.acknowledge_service(
            action_id=action_id,
            admin_id=str(admin.get("id")),
            notes=data.get("notes", "")
        )
        return jsonify({"message": "Service acknowledgment recorded"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@emergency_bp.route("/<complaint_id>/resolve", methods=["POST"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("EMERGENCY_RESPONSE")
def resolve_emergency(complaint_id):
    admin = getattr(g, "current_user", {})
    data = request.get_json() or {}
    try:
        EmergencyService.resolve_emergency(
            complaint_id=complaint_id,
            admin_id=str(admin.get("id")),
            resolution_notes=data.get("notes", "Emergency incident contained and stabilized.")
        )
        return jsonify({"message": "Emergency successfully resolved"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# --- EMERGENCY SERVICES DIRECTORY ---

@emergency_bp.route("/services", methods=["GET"])
@roles_required("ADMIN", "SUPER_ADMIN")
def get_services_directory():
    service_type = request.args.get("type")
    services = EmergencyService.get_services(service_type=service_type)
    return jsonify({"services": services}), 200

@emergency_bp.route("/services", methods=["POST"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("MANAGE_EMERGENCY_SERVICES")
def create_service():
    admin = getattr(g, "current_user", {})
    data = request.get_json() or {}
    try:
        new_svc = EmergencyService.create_service(data, admin_id=str(admin.get("id")))
        return jsonify(new_svc), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@emergency_bp.route("/services/<service_id>", methods=["PUT"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("MANAGE_EMERGENCY_SERVICES")
def update_service(service_id):
    db = Database.get_db()
    data = request.get_json() or {}
    obj_id = ObjectId(service_id) if ObjectId.is_valid(service_id) else service_id
    db.emergency_services.update_one({"_id": obj_id}, {"$set": data})
    updated = db.emergency_services.find_one({"_id": obj_id})
    return jsonify(serialize_doc(updated)), 200

@emergency_bp.route("/services/<service_id>", methods=["DELETE"])
@roles_required("ADMIN", "SUPER_ADMIN")
@permissions_required("MANAGE_EMERGENCY_SERVICES")
def delete_service(service_id):
    db = Database.get_db()
    obj_id = ObjectId(service_id) if ObjectId.is_valid(service_id) else service_id
    # Soft deactivation
    db.emergency_services.update_one({"_id": obj_id}, {"$set": {"active": False}})
    return jsonify({"message": "Emergency service deactivated"}), 200
