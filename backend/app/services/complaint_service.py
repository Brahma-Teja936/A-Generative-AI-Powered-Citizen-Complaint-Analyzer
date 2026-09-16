import datetime
from bson import ObjectId
from backend.app.extensions import Database, serialize_doc
from backend.app.utils.helpers import generate_complaint_id
from backend.app.utils.audit import log_audit
from backend.app.ai.pipeline import run_ai_complaint_pipeline
from backend.app.services.email_service import EmailService
from backend.app.services.notification_service import NotificationService
from backend.app.services.department_service import DepartmentService

class ComplaintService:
    @staticmethod
    def create_complaint(user_id: str, data: dict, attachments: list = None) -> dict:
        """
        Creates a new LIVE citizen complaint.
        Executes language detection, AI classification (TF-IDF + XGBoost), Groq LLM enrichment,
        and duplicate detection.
        CRITICAL: Strictly sets record_type='LIVE' and is_training_data=False.
        """
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database connection unavailable")

        complaint_id = generate_complaint_id()
        raw_text = data.get("description", "").strip()
        title = data.get("title", "").strip()
        combined_text = f"{title}. {raw_text}" if title else raw_text

        # Location formatting
        lat = float(data.get("latitude", 17.3850))
        lng = float(data.get("longitude", 78.4867))
        location_obj = {
            "type": "Point",
            "coordinates": [lng, lat],
            "address": data.get("address", "").strip(),
            "area": data.get("area", "").strip(),
            "city": data.get("city", "Hyderabad").strip(),
            "state": data.get("state", "Telangana").strip(),
            "postal_code": data.get("postal_code", "").strip(),
            "landmark": data.get("landmark", "").strip(),
            "country": data.get("country", "India").strip()
        }

        # Run AI Pipeline
        ai_output = run_ai_complaint_pipeline(
            raw_text=combined_text,
            complaint_id=complaint_id,
            location=location_obj
        )

        trans = ai_output["translation"]
        ai_report = ai_output["ai_report"]

        now = datetime.datetime.now(datetime.timezone.utc)
        is_emergency = ai_report.get("is_critical_emergency", False)

        doc = {
            "complaint_id": complaint_id,
            "record_type": "LIVE",
            "is_training_data": False,
            "submitted_by": str(user_id),
            "title": title,
            "original_text": trans.get("original_text"),
            "original_language": trans.get("original_language", "en"),
            "translated_text_en": trans.get("translated_text_en"),
            "translation_status": trans.get("translation_status"),
            "translation_source": trans.get("translation_source"),
            "input_method": data.get("input_method", "TEXT"),
            "incident_date": data.get("incident_date", now.strftime("%Y-%m-%d")),
            "incident_time": data.get("incident_time", now.strftime("%H:%M")),
            "attachments": attachments or [],
            "location": location_obj,
            "status": "SUBMITTED",
            "department": ai_report.get("primary_department"),
            "category": ai_report.get("complaint_category"),
            "subcategory": ai_report.get("subcategory"),
            "severity": ai_report.get("severity"),
            "priority": ai_report.get("priority"),
            "urgency": ai_report.get("urgency"),
            "ai_prediction": ai_report,
            "final_admin_decision": None,
            "assigned_department_id": None,
            "assigned_by": None,
            "assigned_at": None,
            "emergency_status": "DETECTED" if is_emergency else None,
            "emergency_detected_at": now if is_emergency else None,
            "emergency_timeline": [
                {"event": "EMERGENCY_DETECTED_BY_AI", "timestamp": now, "actor": "AI_SYSTEM"}
            ] if is_emergency else [],
            "timeline": [
                {"event": "SUBMITTED", "timestamp": now, "actor": "CITIZEN", "notes": "Complaint filed"}
            ],
            "created_at": now,
            "updated_at": now
        }

        res = db.complaints.insert_one(doc)
        doc["_id"] = res.inserted_id

        # Notifications & Emails
        user = db.users.find_one({"_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id})
        user_email = user.get("email") if user else None
        if user_email:
            EmailService.send_client_acknowledgement(doc, user_email)

        NotificationService.create_notification(
            user_id=user_id,
            role="CLIENT",
            title="Complaint Filed Successfully",
            message=f"Complaint {complaint_id} has been logged and is under AI analysis.",
            link=f"/client/complaints/{complaint_id}",
            complaint_id=complaint_id
        )

        NotificationService.create_notification(
            role="ADMIN",
            title=f"New Complaint: {complaint_id}",
            message=f"{'🚨 EMERGENCY: ' if is_emergency else ''}{title} ({ai_report.get('primary_department')})",
            notification_type="CRITICAL" if is_emergency else "INFO",
            link=f"/admin/complaints/{complaint_id}",
            complaint_id=complaint_id
        )

        return serialize_doc(doc)

    @staticmethod
    def get_complaints(filter_query: dict = None, page: int = 1, page_size: int = 20, sort_by: str = "created_at"):
        """
        Retrieves live complaints with strict training data exclusion.
        """
        db = Database.get_db()
        if db is None:
            return {"items": [], "total": 0, "page": page, "pages": 0}

        # ALWAYS enforce live and non-training constraints
        q = {"is_training_data": False, "record_type": "LIVE"}
        if filter_query:
            q.update(filter_query)

        skip = (page - 1) * page_size
        total = db.complaints.count_documents(q)
        cursor = db.complaints.find(q).sort(sort_by, -1).skip(skip).limit(page_size)
        items = [serialize_doc(c) for c in cursor]

        pages = (total + page_size - 1) // page_size
        return {
            "items": items,
            "total": total,
            "page": page,
            "pages": pages,
            "page_size": page_size
        }

    @staticmethod
    def get_complaint_by_id(complaint_id: str, viewer_role: str = "ADMIN", viewer_user_id: str = None):
        """
        Retrieves a single complaint with strict training data exclusion and role authorization.
        """
        db = Database.get_db()
        if db is None:
            return None

        query = {
            "complaint_id": complaint_id,
            "is_training_data": False,
            "record_type": "LIVE"
        }

        # CLIENT isolation: Only access own complaint
        if viewer_role == "CLIENT" and viewer_user_id:
            query["submitted_by"] = str(viewer_user_id)

        # DEPARTMENT isolation: Only access assigned complaint
        elif viewer_role == "DEPARTMENT" and viewer_user_id:
            query["assigned_department_id"] = str(viewer_user_id)

        complaint = db.complaints.find_one(query)
        if not complaint:
            return None

        result = serialize_doc(complaint)

        # Sanitize internal AI reasoning / admin notes if citizen is viewing
        if viewer_role == "CLIENT":
            if "ai_prediction" in result and isinstance(result["ai_prediction"], dict):
                # Only expose user-friendly public fields
                result["ai_prediction"] = {
                    "category": result["ai_prediction"].get("complaint_category"),
                    "primary_department": result["ai_prediction"].get("primary_department"),
                    "summary": result["ai_prediction"].get("ai_summary"),
                    "response_time": result["ai_prediction"].get("recommended_response_time")
                }

        return result

    @staticmethod
    def admin_review_decision(complaint_id: str, decision_data: dict, admin_id: str):
        """
        Admin reviews complaint: accepts AI recommendations or overrides.
        Stores ai_prediction and final_admin_decision separately without overwriting.
        Logs corrections into model_corrections collection if modified.
        """
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database unavailable")

        complaint = db.complaints.find_one({"complaint_id": complaint_id, "is_training_data": False})
        if not complaint:
            raise ValueError("Live complaint not found")

        now = datetime.datetime.now(datetime.timezone.utc)
        is_override = not decision_data.get("accepted_ai", True)

        final_decision = {
            "accepted_ai": not is_override,
            "category": decision_data.get("category", complaint.get("category")),
            "subcategory": decision_data.get("subcategory", complaint.get("subcategory")),
            "department": decision_data.get("department", complaint.get("department")),
            "secondary_department": decision_data.get("secondary_department"),
            "severity": decision_data.get("severity", complaint.get("severity")),
            "priority": decision_data.get("priority", complaint.get("priority")),
            "urgency": decision_data.get("urgency", complaint.get("urgency")),
            "safety_risk": decision_data.get("safety_risk"),
            "public_impact": decision_data.get("public_impact"),
            "response_time": decision_data.get("response_time"),
            "admin_notes": decision_data.get("admin_notes", ""),
            "override_reason": decision_data.get("override_reason") if is_override else None,
            "overridden_by": admin_id if is_override else None,
            "overridden_at": now if is_override else None
        }

        update_fields = {
            "final_admin_decision": final_decision,
            "status": "UNDER_REVIEW",
            "category": final_decision["category"],
            "subcategory": final_decision["subcategory"],
            "department": final_decision["department"],
            "severity": final_decision["severity"],
            "priority": final_decision["priority"],
            "urgency": final_decision["urgency"],
            "updated_at": now
        }

        # Check if severity or urgency was overridden to/from CRITICAL
        if final_decision["severity"] == "CRITICAL" or final_decision["urgency"] == "IMMEDIATE":
            if not complaint.get("emergency_status"):
                update_fields["emergency_status"] = "ADMIN_REVIEW"

        db.complaints.update_one(
            {"complaint_id": complaint_id},
            {
                "$set": update_fields,
                "$push": {
                    "timeline": {
                        "event": "ADMIN_REVIEWED",
                        "timestamp": now,
                        "actor": admin_id,
                        "notes": "Accepted AI recommendations" if not is_override else f"Overrode AI: {final_decision.get('override_reason')}"
                    }
                }
            }
        )

        # If overridden, log to model_corrections collection for ML drift audit
        if is_override:
            db.model_corrections.insert_one({
                "complaint_id": complaint_id,
                "ai_prediction": complaint.get("ai_prediction"),
                "admin_correction": final_decision,
                "override_reason": final_decision.get("override_reason"),
                "overridden_by": admin_id,
                "created_at": now
            })

        log_audit(
            action="COMPLAINT_REVIEWED",
            admin_id=admin_id,
            target_id=complaint_id,
            old_value={"severity": complaint.get("severity"), "department": complaint.get("department")},
            new_value=final_decision
        )

        updated = db.complaints.find_one({"complaint_id": complaint_id})
        return serialize_doc(updated)

    @staticmethod
    def assign_department(complaint_id: str, department_id: str, admin_id: str):
        """
        Assigns complaint to a verified department. Dispatches notification and dynamic email.
        """
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database unavailable")

        dept = DepartmentService.get_department_by_id(department_id)
        if not dept:
            raise ValueError("Invalid department ID")

        now = datetime.datetime.now(datetime.timezone.utc)
        db.complaints.update_one(
            {"complaint_id": complaint_id, "is_training_data": False},
            {
                "$set": {
                    "assigned_department_id": str(department_id),
                    "department": dept.get("department_name"),
                    "assigned_by": admin_id,
                    "assigned_at": now,
                    "status": "ASSIGNED",
                    "updated_at": now
                },
                "$push": {
                    "timeline": {
                        "event": "ASSIGNED_TO_DEPARTMENT",
                        "timestamp": now,
                        "actor": admin_id,
                        "notes": f"Assigned to {dept.get('department_name')}"
                    }
                }
            }
        )

        complaint = db.complaints.find_one({"complaint_id": complaint_id})

        # Dynamic email retrieval directly from MongoDB
        dept_email = DepartmentService.get_department_email(department_id)
        if dept_email:
            EmailService.send_department_notification(complaint, dept_email)

        # In-app notification to department
        NotificationService.create_notification(
            user_id=department_id,
            role="DEPARTMENT",
            title=f"New Task Assigned: {complaint_id}",
            message=f"Complaint '{complaint.get('title')}' has been assigned to your department.",
            link=f"/department/complaints/{complaint_id}",
            complaint_id=complaint_id
        )

        # Notify Citizen
        NotificationService.create_notification(
            user_id=complaint.get("submitted_by"),
            role="CLIENT",
            title=f"Complaint Assigned to {dept.get('department_name')}",
            message=f"Your complaint {complaint_id} is now assigned and queued for work.",
            link=f"/client/complaints/{complaint_id}",
            complaint_id=complaint_id
        )

        log_audit(
            action="DEPARTMENT_ASSIGNED",
            admin_id=admin_id,
            target_id=complaint_id,
            new_value={"department_id": str(department_id), "department_name": dept.get("department_name")}
        )

        return serialize_doc(complaint)

    @staticmethod
    def add_progress(complaint_id: str, dept_id: str, description: str, 
                     new_status: str = "IN_PROGRESS", evidence: list = None, estimated_completion = None):
        """
        Department user logs work progress and optional photo/document evidence.
        """
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database unavailable")

        now = datetime.datetime.now(datetime.timezone.utc)
        progress_entry = {
            "complaint_id": complaint_id,
            "department_id": str(dept_id),
            "description": description,
            "status": new_status,
            "evidence": evidence or [],
            "estimated_completion": estimated_completion,
            "created_at": now
        }

        db.complaint_progress.insert_one(progress_entry)

        db.complaints.update_one(
            {"complaint_id": complaint_id, "is_training_data": False},
            {
                "$set": {
                    "status": new_status,
                    "estimated_completion": estimated_completion,
                    "updated_at": now
                },
                "$push": {
                    "timeline": {
                        "event": f"PROGRESS_{new_status}",
                        "timestamp": now,
                        "actor": str(dept_id),
                        "notes": description
                    }
                }
            }
        )

        complaint = db.complaints.find_one({"complaint_id": complaint_id})

        # In-app notification to Citizen
        NotificationService.create_notification(
            user_id=complaint.get("submitted_by"),
            role="CLIENT",
            title=f"Update on Complaint {complaint_id}",
            message=f"Status: {new_status} - {description[:100]}",
            link=f"/client/complaints/{complaint_id}",
            complaint_id=complaint_id
        )

        return serialize_doc(progress_entry)

    @staticmethod
    def resolve_complaint(complaint_id: str, resolver_id: str, resolution_desc: str, evidence: list = None):
        """
        Marks complaint as RESOLVED.
        Triggers citizen resolution email exactly once with idempotency lock.
        """
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database unavailable")

        if not resolution_desc or len(resolution_desc.strip()) < 5:
            raise ValueError("Detailed resolution description is required.")

        now = datetime.datetime.now(datetime.timezone.utc)
        db.complaints.update_one(
            {"complaint_id": complaint_id, "is_training_data": False},
            {
                "$set": {
                    "status": "RESOLVED",
                    "resolution_description": resolution_desc.strip(),
                    "resolution_evidence": evidence or [],
                    "resolved_by": str(resolver_id),
                    "resolved_at": now,
                    "updated_at": now
                },
                "$push": {
                    "timeline": {
                        "event": "RESOLVED",
                        "timestamp": now,
                        "actor": str(resolver_id),
                        "notes": resolution_desc
                    }
                }
            }
        )

        complaint = db.complaints.find_one({"complaint_id": complaint_id})

        # Citizen email (strictly once via idempotency)
        citizen = db.users.find_one({"_id": ObjectId(complaint.get("submitted_by")) if ObjectId.is_valid(complaint.get("submitted_by")) else complaint.get("submitted_by")})
        if citizen and citizen.get("email"):
            EmailService.send_resolution_email(complaint, citizen.get("email"), resolution_desc)

        # Citizen in-app notification
        NotificationService.create_notification(
            user_id=complaint.get("submitted_by"),
            role="CLIENT",
            title=f"Complaint Resolved: {complaint_id}",
            message=f"Your complaint has been resolved. You can now leave feedback.",
            link=f"/client/complaints/{complaint_id}",
            complaint_id=complaint_id
        )

        log_audit(
            action="COMPLAINT_RESOLVED",
            admin_id=resolver_id,
            target_id=complaint_id,
            new_value={"resolution": resolution_desc}
        )

        return serialize_doc(complaint)

    @staticmethod
    def submit_feedback(complaint_id: str, user_id: str, rating: int, comment: str = ""):
        """
        Submits citizen feedback after resolution. Only complaint owner can submit.
        """
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database unavailable")

        complaint = db.complaints.find_one({"complaint_id": complaint_id, "is_training_data": False})
        if not complaint:
            raise ValueError("Complaint not found")

        if str(complaint.get("submitted_by")) != str(user_id):
            raise PermissionError("Only the complaint submitter can provide feedback.")

        if complaint.get("status") not in ["RESOLVED", "CLOSED"]:
            raise ValueError("Feedback can only be provided for resolved complaints.")

        feedback_doc = {
            "complaint_id": complaint_id,
            "submitted_by": str(user_id),
            "rating": max(1, min(5, int(rating))),
            "comment": comment.strip(),
            "created_at": datetime.datetime.now(datetime.timezone.utc)
        }

        db.feedback.update_one(
            {"complaint_id": complaint_id},
            {"$set": feedback_doc},
            upsert=True
        )

        return serialize_doc(feedback_doc)

    @staticmethod
    def delete_complaint(complaint_id: str, user_id: str, user_role: str) -> bool:
        """
        Deletes a complaint and cascades deletion of all progress records,
        associated notifications, feedback, and emergency alerts.
        Enforces RBAC: Admins/SuperAdmins can delete any complaint.
        Citizens can only delete their own complaints.
        Departments can delete complaints assigned to them.
        """
        db = Database.get_db()
        if db is None:
            raise RuntimeError("Database unavailable")

        complaint = db.complaints.find_one({"complaint_id": complaint_id})
        if not complaint:
            return False

        # Access check
        if user_role not in ["ADMIN", "SUPER_ADMIN"]:
            if user_role == "CLIENT":
                if str(complaint.get("submitted_by")) != str(user_id):
                    raise PermissionError("You can only delete complaints that you submitted.")
            elif user_role == "DEPARTMENT":
                if str(complaint.get("assigned_department_id")) != str(user_id):
                    raise PermissionError("You can only delete complaints assigned to your department.")

        # Cascade deletes
        db.complaints.delete_one({"complaint_id": complaint_id})
        db.complaint_progress.delete_many({"complaint_id": complaint_id})
        db.notifications.delete_many({"complaint_id": complaint_id})
        db.emergency_alerts.delete_many({"complaint_id": complaint_id})
        db.feedback.delete_many({"complaint_id": complaint_id})

        log_audit(
            action="COMPLAINT_DELETED",
            admin_id=user_id if user_role in ["ADMIN", "SUPER_ADMIN"] else None,
            target_id=complaint_id,
            metadata={"deleted_by_role": user_role, "deleted_by_user": user_id}
        )

        return True
