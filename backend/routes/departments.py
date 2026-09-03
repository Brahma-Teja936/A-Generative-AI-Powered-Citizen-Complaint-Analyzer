from flask import Blueprint, request, jsonify
from extensions import db
from models import Department
from services.auth_helper import admin_required

departments_bp = Blueprint("departments", __name__, url_prefix="/api/departments")

@departments_bp.route("", methods=["GET"])
def get_departments():
    """Publicly accessible list of official departments and descriptions."""
    depts = Department.query.order_by(Department.name.asc()).all()
    return jsonify({
        "success": True,
        "count": len(depts),
        "departments": [d.to_dict() for d in depts]
    }), 200

@departments_bp.route("", methods=["POST"])
@admin_required
def create_department():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    description = data.get("description", "").strip()

    if not name or not email:
        return jsonify({
            "success": False,
            "message": "Department name and email are required"
        }), 400

    existing = Department.query.filter_by(name=name).first()
    if existing:
        return jsonify({
            "success": False,
            "message": "Department with this name already exists"
        }), 409

    dept = Department(name=name, email=email, description=description)
    try:
        db.session.add(dept)
        db.session.commit()
        return jsonify({
            "success": True,
            "message": "Department created successfully",
            "department": dept.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Failed to create department: {str(e)}"
        }), 500

@departments_bp.route("/<int:dept_id>", methods=["PUT"])
@admin_required
def update_department(dept_id):
    dept = Department.query.get(dept_id)
    if not dept:
        return jsonify({
            "success": False,
            "message": "Department not found"
        }), 404

    data = request.get_json() or {}
    if "name" in data and data["name"]:
        dept.name = data["name"].strip()
    if "email" in data and data["email"]:
        dept.email = data["email"].strip()
    if "description" in data:
        dept.description = data["description"].strip()

    try:
        db.session.commit()
        return jsonify({
            "success": True,
            "message": "Department updated successfully",
            "department": dept.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Failed to update department: {str(e)}"
        }), 500

@departments_bp.route("/<int:dept_id>", methods=["DELETE"])
@admin_required
def delete_department(dept_id):
    dept = Department.query.get(dept_id)
    if not dept:
        return jsonify({
            "success": False,
            "message": "Department not found"
        }), 404

    try:
        db.session.delete(dept)
        db.session.commit()
        return jsonify({
            "success": True,
            "message": "Department deleted successfully"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Failed to delete department: {str(e)}"
        }), 500
