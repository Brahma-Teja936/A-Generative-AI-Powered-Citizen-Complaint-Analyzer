import smtplib
import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pymongo.errors import DuplicateKeyError
from backend.config import Config
from backend.app.extensions import Database

class EmailService:
    @staticmethod
    def send_idempotent_email(complaint_id: str, email_type: str, event_id: str,
                              recipient: str, subject: str, body_text: str, html_content: str = None) -> dict:
        """
        Sends an email with strict DB-enforced idempotency via compound key (complaint_id, email_type, event_id).
        Prevents duplicate sends from browser refreshes, double clicks, or retries.
        """
        db = Database.get_db()
        if not recipient:
            return {"status": "SKIPPED", "message": "No recipient email provided"}

        idempotency_log = {
            "complaint_id": complaint_id,
            "email_type": email_type,
            "event_id": event_id,
            "recipient": recipient,
            "subject": subject,
            "status": "PENDING",
            "sent_at": None,
            "error": None,
            "retry_count": 0,
            "created_at": datetime.datetime.now(datetime.timezone.utc)
        }

        # Step 1: Atomic insert into email_logs collection to claim idempotency lock
        if db is not None:
            try:
                insert_res = db.email_logs.insert_one(idempotency_log)
                log_id = insert_res.inserted_id
            except DuplicateKeyError:
                # Key already exists! This email has already been initiated or sent.
                existing = db.email_logs.find_one({
                    "complaint_id": complaint_id,
                    "email_type": email_type,
                    "event_id": event_id
                })
                print(f"[CivicAI Email Idempotency] Duplicate email prevented: {complaint_id} / {email_type} / {event_id}")
                return {
                    "status": "DUPLICATE_PREVENTED",
                    "message": "Email already dispatched or logged for this event.",
                    "log": str(existing.get("_id")) if existing else None
                }
            except Exception as e:
                print(f"[CivicAI Email Log Error] {e}")
                log_id = None
        else:
            log_id = None

        # Step 2: Attempt SMTP dispatch
        is_sent = False
        error_msg = None

        # If SMTP username/password are not provided, mark as simulated/sent for dev
        if not Config.SMTP_USERNAME or not Config.SMTP_PASSWORD:
            print(f"[CivicAI Email Simulated] To: {recipient} | Subject: {subject}")
            is_sent = True
        else:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = Config.SMTP_FROM
                msg["To"] = recipient

                part1 = MIMEText(body_text, "plain")
                msg.attach(part1)
                if html_content:
                    part2 = MIMEText(html_content, "html")
                    msg.attach(part2)

                with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10) as server:
                    if Config.SMTP_TLS:
                        server.starttls()
                    server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
                    server.sendmail(Config.SMTP_FROM, recipient, msg.as_string())
                is_sent = True
            except Exception as e:
                error_msg = str(e)
                print(f"[CivicAI SMTP Error] Failed to send email to {recipient}: {e}")

        # Step 3: Update email_log status
        if db is not None and log_id:
            db.email_logs.update_one(
                {"_id": log_id},
                {"$set": {
                    "status": "SENT" if is_sent else "FAILED",
                    "sent_at": datetime.datetime.now(datetime.timezone.utc) if is_sent else None,
                    "error": error_msg
                }}
            )

        return {
            "status": "SENT" if is_sent else "FAILED",
            "recipient": recipient,
            "subject": subject,
            "error": error_msg
        }

    @classmethod
    def send_client_acknowledgement(cls, complaint: dict, client_email: str):
        cid = complaint.get("complaint_id")
        subject = f"Complaint Received - {cid}"
        body = (
            f"Dear Citizen,\n\n"
            f"Your complaint '{complaint.get('title')}' has been successfully received.\n"
            f"Complaint ID: {cid}\n"
            f"AI Category: {complaint.get('category', 'General')}\n"
            f"Status: {complaint.get('status', 'SUBMITTED')}\n\n"
            f"You can track the live progress on your CivicAI portal.\n"
            f"CivicAI Municipal Administration"
        )
        return cls.send_idempotent_email(
            complaint_id=cid,
            email_type="CLIENT_ACKNOWLEDGEMENT",
            event_id="initial_submission",
            recipient=client_email,
            subject=subject,
            body_text=body
        )

    @classmethod
    def send_resolution_email(cls, complaint: dict, client_email: str, resolution_desc: str):
        cid = complaint.get("complaint_id")
        subject = f"Complaint Resolved - {cid}"
        body = (
            f"Dear Citizen,\n\n"
            f"Your complaint '{complaint.get('title')}' ({cid}) has been officially RESOLVED.\n\n"
            f"Resolution Summary:\n{resolution_desc}\n\n"
            f"Thank you for contributing to civic improvement.\n"
            f"CivicAI Municipal Administration"
        )
        # Event id ensures resolution email is sent exactly once
        return cls.send_idempotent_email(
            complaint_id=cid,
            email_type="RESOLUTION",
            event_id=f"resolved_{cid}",
            recipient=client_email,
            subject=subject,
            body_text=body
        )

    @classmethod
    def send_department_notification(cls, complaint: dict, dept_email: str):
        cid = complaint.get("complaint_id")
        subject = f"New Assigned Complaint - {cid}"
        body = (
            f"To Department Operations,\n\n"
            f"A complaint has been assigned to your department.\n"
            f"Complaint ID: {cid}\n"
            f"Title: {complaint.get('title')}\n"
            f"Severity: {complaint.get('severity')}\n"
            f"Priority: {complaint.get('priority')}\n"
            f"Urgency: {complaint.get('urgency')}\n\n"
            f"Please log in to your department dashboard to accept and process."
        )
        return cls.send_idempotent_email(
            complaint_id=cid,
            email_type="DEPARTMENT_NOTIFICATION",
            event_id=f"assigned_{complaint.get('assigned_department_id')}",
            recipient=dept_email,
            subject=subject,
            body_text=body
        )

    @classmethod
    def send_emergency_alert(cls, complaint: dict, admin_email: str):
        cid = complaint.get("complaint_id")
        subject = f"Emergency Alert - {cid}"
        body = (
            f"🚨 CRITICAL EMERGENCY ALERT\n\n"
            f"Complaint ID: {cid}\n"
            f"Issue: {complaint.get('title')}\n"
            f"Severity: CRITICAL | Urgency: IMMEDIATE\n"
            f"Location: {complaint.get('location', {}).get('address', 'GPS coordinates logged')}\n\n"
            f"Immediate review required in the Emergency Command Center."
        )
        return cls.send_idempotent_email(
            complaint_id=cid,
            email_type="EMERGENCY_ALERT",
            event_id=f"emergency_detected_{cid}",
            recipient=admin_email,
            subject=subject,
            body_text=body
        )
