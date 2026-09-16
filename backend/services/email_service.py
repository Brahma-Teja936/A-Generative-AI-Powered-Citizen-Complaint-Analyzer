import smtplib
import uuid
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from bson import ObjectId
from config import Config
from database.mongodb import db

def send_email_with_idempotency(complaint_id: str, email_type: str, recipient: str, subject: str, body: str, event_id: str = None) -> dict:
    """
    Sends email with idempotency protection and stores dispatch logs in MongoDB email_logs collection.
    Guarantees that an email for (complaint_id, email_type, event_id) will never be duplicate-sent.
    """
    if not event_id:
        event_id = f"{email_type}_{complaint_id}_initial"

    # Check if this exact event has already been sent successfully
    existing = db.email_logs.find_one({
        "complaint_id": complaint_id,
        "email_type": email_type,
        "event_id": event_id
    })

    if existing and existing.get("status") == "SENT":
        return {
            "sent": True,
            "status": "ALREADY_SENT",
            "message": "Email already dispatched previously (idempotent skipped)",
            "log_id": str(existing["_id"])
        }

    status = "FAILED"
    error_msg = None
    msg_id = f"civicai-{uuid.uuid4().hex[:12]}@city.gov"

    # Check SMTP configuration
    if not Config.SMTP_HOST or not Config.SMTP_USERNAME:
        error_msg = "SMTP credentials not configured in environment (.env)"
    else:
        try:
            msg = MIMEMultipart()
            msg["From"] = Config.SMTP_FROM or Config.SMTP_USERNAME
            msg["To"] = recipient
            msg["Subject"] = subject
            msg["Message-ID"] = msg_id
            msg.attach(MIMEText(body, "plain", "utf-8"))

            server = smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=5)
            if Config.SMTP_USE_TLS:
                server.starttls()
            if Config.SMTP_USERNAME and Config.SMTP_PASSWORD:
                server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            status = "SENT"
        except Exception as e:
            error_msg = str(e)
            print(f"[EMAIL FAILED] {email_type} to {recipient}: {e}")

    # Record or update in email_logs collection
    log_doc = {
        "complaint_id": complaint_id,
        "recipient": recipient,
        "email_type": email_type,
        "subject": subject,
        "status": status,
        "message_id": msg_id,
        "sent_at": datetime.utcnow() if status == "SENT" else None,
        "error": error_msg,
        "retry_count": 0 if not existing else existing.get("retry_count", 0) + 1,
        "event_id": event_id,
        "created_at": datetime.utcnow()
    }

    if existing:
        db.email_logs.update_one({"_id": existing["_id"]}, {"$set": log_doc})
        log_id = str(existing["_id"])
    else:
        insert_res = db.email_logs.insert_one(log_doc)
        log_id = str(insert_res.inserted_id)

    return {
        "sent": (status == "SENT"),
        "status": status,
        "error": error_msg,
        "log_id": log_id
    }

def send_client_acknowledgement(complaint: dict, citizen_name: str, citizen_email: str):
    """Subject: Complaint Received - CMP-YYYY-XXXXXX"""
    cid = complaint.get("complaint_id")
    subject = f"Complaint Received - {cid}"
    body = f"""Dear {citizen_name},

Thank you for submitting your complaint.

Your complaint has been successfully received.

Complaint ID:
{cid}

Title:
{complaint.get("title", "Civic Complaint")}

Complaint:
{complaint.get("description", "")}

Current Status:
PENDING

Our administration team will review your complaint and take the necessary action.

Thank you for helping improve our community.

Regards,
CivicAI Administration
"""
    return send_email_with_idempotency(
        complaint_id=cid,
        email_type="CLIENT_ACKNOWLEDGEMENT",
        recipient=citizen_email,
        subject=subject,
        body=body,
        event_id=f"ack_{cid}"
    )

def send_department_notification(complaint: dict, dept_name: str, dept_email: str):
    """Subject: New Complaint Assigned - CMP-YYYY-XXXXXX"""
    cid = complaint.get("complaint_id")
    ai = complaint.get("ai_analysis", {})
    subject = f"New Complaint Assigned - {cid}"
    body = f"""Dear {dept_name} Department,

A new civic complaint has been assigned to your department through CivicAI.

Complaint ID:
{cid}

Original Complaint:
"{complaint.get("description", "")}"

Location:
{complaint.get("location", "Location not specified")}

Category:
{ai.get("category", "General")}

Subcategory:
{ai.get("subcategory", "General")}

Severity:
{ai.get("severity", "MEDIUM")}

Priority:
{ai.get("priority", "MEDIUM")}

Urgency:
{ai.get("urgency", "ROUTINE")}

Safety Risk:
{ai.get("safety_risk", "LOW")}

Public Impact:
{ai.get("public_impact", "LOW")}

AI Summary:
{ai.get("summary", "Summary not available")}

Recommended Action:
{ai.get("recommended_action", "Investigate and resolve site condition")}

Expected Response Time:
{ai.get("recommended_response_time", "Within 48 hours")}

Please review and initiate field action.

Regards,
CivicAI Administration
"""
    return send_email_with_idempotency(
        complaint_id=cid,
        email_type="DEPARTMENT_NOTIFICATION",
        recipient=dept_email,
        subject=subject,
        body=body,
        event_id=f"dept_assign_{cid}_{dept_name.replace(' ', '_')}"
    )

def send_progress_update_email(complaint: dict, status: str, description: str, citizen_email: str, citizen_name: str):
    """Sends email to citizen when significant progress status changes"""
    cid = complaint.get("complaint_id")
    subject = f"Complaint Update - {cid}: {status}"
    body = f"""Dear {citizen_name},

There is a new update regarding your civic complaint #{cid}.

Status:
{status}

Update Details:
{description}

Department:
{complaint.get('assignment', {}).get('department_name') or complaint.get('ai_analysis', {}).get('department', 'Civic Administration')}

You can track real-time progress on your CivicAI portal dashboard.

Regards,
CivicAI Administration
"""
    return send_email_with_idempotency(
        complaint_id=cid,
        email_type="PROGRESS_UPDATE",
        recipient=citizen_email,
        subject=subject,
        body=body,
        event_id=f"prog_{cid}_{status}_{uuid.uuid4().hex[:6]}"
    )

def send_resolution_email(complaint: dict, citizen_name: str, citizen_email: str, resolution_desc: str):
    """Subject: Complaint Resolved - CMP-YYYY-XXXXXX"""
    cid = complaint.get("complaint_id")
    dept = complaint.get("assignment", {}).get("department_name") or complaint.get("ai_analysis", {}).get("department", "Civic Department")
    sev = complaint.get("admin_decision", {}).get("severity") or complaint.get("ai_analysis", {}).get("severity", "MEDIUM")
    pri = complaint.get("admin_decision", {}).get("priority") or complaint.get("ai_analysis", {}).get("priority", "MEDIUM")
    resolved_date = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    subject = f"Complaint Resolved - {cid}"
    body = f"""Dear {citizen_name},

Thank you for bringing this issue to our attention.

Your complaint has been successfully resolved.

Complaint ID:
{cid}

Original Complaint:
"{complaint.get('description', '')}"

Department:
{dept}

Severity:
{sev}

Priority:
{pri}

Resolution:
{resolution_desc}

Resolved Date:
{resolved_date}

Thank you for helping improve our community.

Regards,
CivicAI Administration
"""
    return send_email_with_idempotency(
        complaint_id=cid,
        email_type="RESOLUTION",
        recipient=citizen_email,
        subject=subject,
        body=body,
        event_id=f"resolved_{cid}"
    )

def retry_email(log_id: str) -> dict:
    """Admin endpoint action to retry a failed email from email_logs"""
    log = db.email_logs.find_one({"_id": ObjectId(log_id)})
    if not log:
        return {"success": False, "message": "Email log not found"}

    recipient = log.get("recipient")
    subject = log.get("subject")
    cid = log.get("complaint_id")
    email_type = log.get("email_type")
    
    # Try resending
    status = "FAILED"
    error_msg = None
    if not Config.SMTP_HOST or not Config.SMTP_USERNAME:
        error_msg = "SMTP credentials not configured"
    else:
        try:
            msg = MIMEMultipart()
            msg["From"] = Config.SMTP_FROM or Config.SMTP_USERNAME
            msg["To"] = recipient
            msg["Subject"] = subject
            msg.attach(MIMEText("CivicAI Notification Resend", "plain", "utf-8"))
            server = smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=5)
            if Config.SMTP_USE_TLS:
                server.starttls()
            if Config.SMTP_USERNAME and Config.SMTP_PASSWORD:
                server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            status = "SENT"
        except Exception as e:
            error_msg = str(e)

    db.email_logs.update_one(
        {"_id": ObjectId(log_id)},
        {
            "$set": {
                "status": status,
                "error": error_msg,
                "sent_at": datetime.utcnow() if status == "SENT" else None
            },
            "$inc": {"retry_count": 1}
        }
    )

    return {"success": (status == "SENT"), "status": status, "error": error_msg}
