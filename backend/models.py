from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(30), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="citizen")  # 'citizen' or 'admin'
    location = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    complaints = db.relationship("Complaint", backref="citizen", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "location": self.location,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Department(db.Model):
    __tablename__ = "departments"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "description": self.description
        }

class Complaint(db.Model):
    __tablename__ = "complaints"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    description = db.Column(db.Text, nullable=False)
    image_path = db.Column(db.String(300), nullable=True)
    department = db.Column(db.String(120), nullable=False)
    severity = db.Column(db.String(50), nullable=False)
    priority = db.Column(db.String(50), nullable=False)
    summary = db.Column(db.Text, nullable=True)
    confidence_department = db.Column(db.Float, nullable=True, default=0.0)
    confidence_severity = db.Column(db.Float, nullable=True, default=0.0)
    confidence_priority = db.Column(db.Float, nullable=True, default=0.0)
    status = db.Column(db.String(50), default="Pending", nullable=False)  # Pending, Assigned, In Progress, Resolved, Rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    email_logs = db.relationship("EmailLog", backref="complaint", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        citizen_info = self.citizen.to_dict() if self.citizen else None
        return {
            "id": self.id,
            "user_id": self.user_id,
            "description": self.description,
            "image_path": self.image_path,
            "department": self.department,
            "severity": self.severity,
            "priority": self.priority,
            "summary": self.summary,
            "confidence_department": self.confidence_department,
            "confidence_severity": self.confidence_severity,
            "confidence_priority": self.confidence_priority,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "citizen": citizen_info
        }

class EmailLog(db.Model):
    __tablename__ = "email_logs"

    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaints.id"), nullable=True)
    recipient = db.Column(db.String(150), nullable=False)
    subject = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), nullable=False)  # 'SENT', 'FAILED'
    sent_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    error_message = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "complaint_id": self.complaint_id,
            "recipient": self.recipient,
            "subject": self.subject,
            "status": self.status,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "error_message": self.error_message
        }