import os
import uuid
from pathlib import Path
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from extensions import db
from models import Complaint, User, EmailLog
from config import Config
from services.classification_service import classification_service
from services.summary_service import generate_summary
from services.email_service import send_department_email
from services.auth_helper import token_required, get_current_user

complaints_bp = Blueprint("complaints", __name__, url_prefix="/api/complaints")

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS

@complaints_bp.route("/analyze", methods=["POST"])
def analyze_complaint():
    """
    ML prediction endpoint.
    Runs preprocessing -> TF-IDF -> XGBoost -> summary generation.
    Does NOT save to database yet, enabling the citizen to review and verify predictions.
    """
    data = request.get_json() or {}
    complaint_text = data.get("complaint_text", "").strip()

    if not complaint_text:
        return jsonify({
            "success": False,
            "message": "Complaint text is required for analysis"
        }), 400

    # 1. Run ML classification
    ml_result = classification_service.classify_complaint(complaint_text)

    # 2. Generate summary (Groq or robust fallback)
    summary = generate_summary(
        complaint_text,
        ml_result["department"],
        ml_result["severity"],
        ml_result["priority"]
    )

    return jsonify({
        "success": True,
        "department": ml_result["department"],
        "severity": ml_result["severity"],
        "priority": ml_result["priority"],
        "confidence": ml_result["confidence"],
        "summary": summary
    }), 200

@complaints_bp.route("", methods=["POST"])
def create_complaint():
    """
    Creates and saves a complaint into PostgreSQL.
    Accepts multipart/form-data (for image upload + fields) or JSON.
    Automatically sends email notification to appropriate department.
    """
    user = get_current_user()

    # Determine if multipart or json
    if request.content_type and "multipart/form-data" in request.content_type:
        description = request.form.get("description", "").strip()
        department = request.form.get("department", "").strip()
        severity = request.form.get("severity", "").strip()
        priority = request.form.get("priority", "").strip()
        summary = request.form.get("summary", "").strip()
        conf_dept = float(request.form.get("confidence_department", 0.85))
        conf_sev = float(request.form.get("confidence_severity", 0.80))
        conf_pri = float(request.form.get("confidence_priority", 0.80))

        image_path = None
        if "image" in request.files:
            file = request.files["image"]
            if file and file.filename != "":
                if not allowed_file(file.filename):
                    return jsonify({
                        "success": False,
                        "message": "Invalid image format. Supported formats: JPG, JPEG, PNG, WEBP"
                    }), 400
                
                # Secure unique filename
                ext = file.filename.rsplit(".", 1)[1].lower()
                unique_name = f"complaint_{uuid.uuid4().hex[:10]}.{ext}"
                upload_dir = Path(Config.UPLOAD_FOLDER)
                upload_dir.mkdir(parents=True, exist_ok=True)
                saved_path = upload_dir / unique_name
                file.save(str(saved_path))
                image_path = f"/api/complaints/uploads/{unique_name}"
    else:
        data = request.get_json() or {}
        description = data.get("description", "").strip()
        department = data.get("department", "").strip()
        severity = data.get("severity", "").strip()
        priority = data.get("priority", "").strip()
        summary = data.get("summary", "").strip()
        image_path = data.get("image_path")
        conf_dept = float(data.get("confidence_department", 0.85))
        conf_sev = float(data.get("confidence_severity", 0.80))
        conf_pri = float(data.get("confidence_priority", 0.80))

    if not description:
        return jsonify({
            "success": False,
            "message": "Complaint description is required"
        }), 400

    # Auto classify if department/severity/priority are missing
    if not department or not severity or not priority:
        ml_res = classification_service.classify_complaint(description)
        department = department or ml_res["department"]
        severity = severity or ml_res["severity"]
        priority = priority or ml_res["priority"]
        conf_dept = ml_res["confidence"]["department"]
        conf_sev = ml_res["confidence"]["severity"]
        conf_pri = ml_res["confidence"]["priority"]

    if not summary:
        summary = generate_summary(description, department, severity, priority)

    try:
        user_id = user.id if user else None
        citizen_name = user.name if user else "Citizen"
        citizen_location = user.location if user and user.location else "Location not specified"

        complaint = Complaint(
            user_id=user_id,
            description=description,
            image_path=image_path,
            department=department,
            severity=severity,
            priority=priority,
            summary=summary,
            confidence_department=conf_dept,
            confidence_severity=conf_sev,
            confidence_priority=conf_pri,
            status="Pending"
        )
        db.session.add(complaint)
        db.session.commit()

        # Send automated email notification to department (resilient to failure)
        send_department_email(complaint, citizen_name, citizen_location)

        return jsonify({
            "success": True,
            "message": "Complaint submitted successfully and department notified",
            "complaint": complaint.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Failed to save complaint: {str(e)}"
        }), 500

@complaints_bp.route("", methods=["GET"])
@token_required
def get_complaints():
    user = request.current_user
    if user.role == "admin":
        complaints = Complaint.query.order_by(Complaint.created_at.desc()).all()
    else:
        complaints = Complaint.query.filter_by(user_id=user.id).order_by(Complaint.created_at.desc()).all()

    return jsonify({
        "success": True,
        "count": len(complaints),
        "complaints": [c.to_dict() for c in complaints]
    }), 200

@complaints_bp.route("/<int:complaint_id>", methods=["GET"])
def get_complaint(complaint_id):
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({
            "success": False,
            "message": "Complaint not found"
        }), 404

    # Fetch email log for this complaint if any
    email_log = EmailLog.query.filter_by(complaint_id=complaint.id).order_by(EmailLog.sent_at.desc()).first()

    data = complaint.to_dict()
    data["email_status"] = email_log.status if email_log else "NOT_SENT"
    data["email_log"] = email_log.to_dict() if email_log else None

    return jsonify({
        "success": True,
        "complaint": data
    }), 200

@complaints_bp.route("/uploads/<filename>", methods=["GET"])
def serve_upload(filename):
    return send_from_directory(str(Config.UPLOAD_FOLDER), filename)
