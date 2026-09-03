import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from config import Config
from extensions import db
from models import EmailLog, Department

def send_department_email(complaint, citizen_name="Citizen", citizen_location="Not specified") -> bool:
    """
    Sends an automated notification email to the responsible department for a submitted complaint.
    Logs the dispatch attempt (SENT or FAILED) into the email_logs table.
    Ensures failure never blocks or rolls back complaint creation.
    """
    # 1. Look up department email from DB
    dept_record = Department.query.filter_by(name=complaint.department).first()
    recipient_email = dept_record.email if dept_record and dept_record.email else f"{complaint.department.lower().replace(' ', '')}@city.gov"

    subject = f"[CivicAI] {complaint.priority} Priority Complaint #{complaint.id} - {complaint.department}"

    submitted_date_str = complaint.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if complaint.created_at else datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    body = f"""Dear {complaint.department} Department,

A new civic complaint has been submitted through CivicAI.

Complaint ID:
#{complaint.id}

Department:
{complaint.department}

Severity:
{complaint.severity}

Priority:
{complaint.priority}

AI Summary:
{complaint.summary or 'Not generated'}

Original Complaint:
"{complaint.description}"

Location:
{citizen_location}

Submitted By:
{citizen_name}

Submitted Date:
{submitted_date_str}

Please review and take appropriate action.

Regards,
CivicAI
Automated Civic Complaint Management System
"""

    status = "FAILED"
    error_message = None

    # Check if SMTP is configured
    if not Config.MAIL_SERVER:
        error_message = "SMTP server not configured in environment"
    else:
        try:
            msg = MIMEMultipart()
            msg["From"] = Config.MAIL_DEFAULT_SENDER or Config.MAIL_USERNAME or "civicai-alert@city.gov"
            msg["To"] = recipient_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain", "utf-8"))

            server = smtplib.SMTP(Config.MAIL_SERVER, Config.MAIL_PORT, timeout=5)
            if Config.MAIL_USE_TLS:
                server.starttls()
            if Config.MAIL_USERNAME and Config.MAIL_PASSWORD:
                server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
            
            server.send_message(msg)
            server.quit()
            status = "SENT"
        except Exception as e:
            error_message = str(e)
            print(f"[EMAIL ERROR] Failed to send email to {recipient_email}: {e}")

    # Log to email_logs table
    try:
        log_entry = EmailLog(
            complaint_id=complaint.id,
            recipient=recipient_email,
            subject=subject,
            status=status,
            sent_at=datetime.utcnow(),
            error_message=error_message
        )
        db.session.add(log_entry)
        db.session.commit()
    except Exception as db_err:
        print(f"[DB ERROR] Failed to save email log: {db_err}")
        db.session.rollback()

    return status == "SENT"
