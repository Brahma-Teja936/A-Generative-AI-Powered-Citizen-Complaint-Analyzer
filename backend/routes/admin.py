from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy import func, or_
from extensions import db
from models import Complaint, User, Department, EmailLog
from services.auth_helper import admin_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

@admin_bp.route("/dashboard", methods=["GET"])
@admin_required
def get_dashboard_metrics():
    """
    Computes real-time admin analytics and Recharts-friendly data distributions
    directly from the database.
    """
    now = datetime.utcnow()
    one_week_ago = now - timedelta(days=7)
    one_month_ago = now - timedelta(days=30)

    # Core statistics
    total_complaints = Complaint.query.count()
    pending_count = Complaint.query.filter_by(status="Pending").count()
    assigned_count = Complaint.query.filter_by(status="Assigned").count()
    in_progress_count = Complaint.query.filter_by(status="In Progress").count()
    resolved_count = Complaint.query.filter_by(status="Resolved").count()
    rejected_count = Complaint.query.filter_by(status="Rejected").count()

    high_priority_count = Complaint.query.filter(Complaint.priority.in_(["HIGH", "URGENT"])).count()
    critical_severity_count = Complaint.query.filter_by(severity="CRITICAL").count()

    # Time-based metrics
    complaints_this_week = Complaint.query.filter(Complaint.created_at >= one_week_ago).count()
    complaints_this_month = Complaint.query.filter(Complaint.created_at >= one_month_ago).count()

    resolution_rate = round((resolved_count / total_complaints * 100), 1) if total_complaints > 0 else 0.0

    # Average resolution time for resolved complaints
    resolved_items = Complaint.query.filter_by(status="Resolved").all()
    if resolved_items:
        durations = [(c.updated_at - c.created_at).total_seconds() / 86400.0 for c in resolved_items if c.updated_at]
        avg_res_days = round(sum(durations) / len(durations), 1) if durations else 1.5
    else:
        avg_res_days = 0.0

    # 1. Distribution by Department
    dept_counts = db.session.query(
        Complaint.department, func.count(Complaint.id)
    ).group_by(Complaint.department).all()
    by_department = [{"name": d or "Unknown", "count": c} for d, c in dept_counts]

    # 2. Distribution by Severity
    sev_counts = db.session.query(
        Complaint.severity, func.count(Complaint.id)
    ).group_by(Complaint.severity).all()
    by_severity = [{"name": s or "Unknown", "count": c} for s, c in sev_counts]

    # 3. Distribution by Priority
    pri_counts = db.session.query(
        Complaint.priority, func.count(Complaint.id)
    ).group_by(Complaint.priority).all()
    by_priority = [{"name": p or "Unknown", "count": c} for p, c in pri_counts]

    # 4. Distribution by Status
    status_counts = db.session.query(
        Complaint.status, func.count(Complaint.id)
    ).group_by(Complaint.status).all()
    by_status = [{"name": st or "Unknown", "count": c} for st, c in status_counts]

    # 5. Complaints over Time (past 7 days)
    by_time = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_label = day_start.strftime("%b %d")
        day_count = Complaint.query.filter(Complaint.created_at >= day_start, Complaint.created_at < day_end).count()
        by_time.append({"date": day_label, "count": day_count})

    # Department Workload (total and pending per dept)
    workload = []
    all_depts = Department.query.all()
    for d in all_depts:
        tot = Complaint.query.filter_by(department=d.name).count()
        pend = Complaint.query.filter(Complaint.department == d.name, Complaint.status.in_(["Pending", "Assigned", "In Progress"])).count()
        workload.append({
            "department": d.name,
            "email": d.email,
            "total": tot,
            "active": pend
        })

    return jsonify({
        "success": True,
        "metrics": {
            "total_complaints": total_complaints,
            "pending": pending_count,
            "assigned": assigned_count,
            "in_progress": in_progress_count,
            "resolved": resolved_count,
            "rejected": rejected_count,
            "high_priority": high_priority_count,
            "critical": critical_severity_count,
            "complaints_this_week": complaints_this_week,
            "complaints_this_month": complaints_this_month,
            "resolution_rate": resolution_rate,
            "avg_resolution_days": avg_res_days
        },
        "charts": {
            "by_department": by_department,
            "by_severity": by_severity,
            "by_priority": by_priority,
            "by_status": by_status,
            "by_time": by_time
        },
        "workload": workload
    }), 200

@admin_bp.route("/complaints", methods=["GET"])
@admin_required
def get_admin_complaints():
    """
    Search, filter, sort, and paginate complaints for admin table.
    """
    query = Complaint.query

    # Filters
    department = request.args.get("department")
    severity = request.args.get("severity")
    priority = request.args.get("priority")
    status = request.args.get("status")
    search = request.args.get("search", "").strip()
    sort_by = request.args.get("sort_by", "created_at")
    sort_order = request.args.get("sort_order", "desc")

    if department and department != "ALL":
        query = query.filter_by(department=department)
    if severity and severity != "ALL":
        query = query.filter_by(severity=severity)
    if priority and priority != "ALL":
        query = query.filter_by(priority=priority)
    if status and status != "ALL":
        query = query.filter_by(status=status)

    if search:
        search_pattern = f"%{search}%"
        query = query.outerjoin(User).filter(
            or_(
                Complaint.description.ilike(search_pattern),
                Complaint.summary.ilike(search_pattern),
                Complaint.department.ilike(search_pattern),
                User.name.ilike(search_pattern),
                User.email.ilike(search_pattern)
            )
        )

    # Sorting
    sort_column = getattr(Complaint, sort_by, Complaint.created_at)
    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    # Pagination
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    # Enrich with email log status
    result = []
    for comp in items:
        c_dict = comp.to_dict()
        latest_email = EmailLog.query.filter_by(complaint_id=comp.id).order_by(EmailLog.sent_at.desc()).first()
        c_dict["email_status"] = latest_email.status if latest_email else "NOT_SENT"
        result.append(c_dict)

    return jsonify({
        "success": True,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "complaints": result
    }), 200

@admin_bp.route("/complaints/<int:complaint_id>", methods=["GET"])
@admin_required
def get_admin_complaint_detail(complaint_id):
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({
            "success": False,
            "message": "Complaint not found"
        }), 404

    data = complaint.to_dict()
    latest_email = EmailLog.query.filter_by(complaint_id=complaint.id).order_by(EmailLog.sent_at.desc()).first()
    data["email_status"] = latest_email.status if latest_email else "NOT_SENT"
    data["email_log"] = latest_email.to_dict() if latest_email else None

    return jsonify({
        "success": True,
        "complaint": data
    }), 200

@admin_bp.route("/complaints/<int:complaint_id>", methods=["PUT"])
@admin_required
def update_admin_complaint(complaint_id):
    """
    Admin controls to update department, severity, priority, or status.
    Updates PostgreSQL database.
    """
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({
            "success": False,
            "message": "Complaint not found"
        }), 404

    data = request.get_json() or {}

    if "department" in data and data["department"]:
        complaint.department = data["department"]
    if "severity" in data and data["severity"]:
        complaint.severity = data["severity"]
    if "priority" in data and data["priority"]:
        complaint.priority = data["priority"]
    if "status" in data and data["status"]:
        # Allowed statuses: Pending, Assigned, In Progress, Resolved, Rejected
        complaint.status = data["status"]

    complaint.updated_at = datetime.utcnow()

    try:
        db.session.commit()
        return jsonify({
            "success": True,
            "message": f"Complaint #{complaint.id} successfully updated",
            "complaint": complaint.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": f"Failed to update complaint: {str(e)}"
        }), 500
