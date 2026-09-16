import os
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
# Explicitly load .env from project root
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv()

class Config:
    # Flask settings
    SECRET_KEY = os.getenv("SECRET_KEY", "civicai-super-secret-system-key-change-in-production-2026")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    PORT = int(os.getenv("PORT", 5000))

    # MongoDB Atlas / Local MongoDB
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/civicai_db")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "civicai_db")

    # JWT Settings
    JWT_SECRET = os.getenv("JWT_SECRET", "civicai-jwt-super-secure-token-secret-key-38492048293")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", 24)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", 7)))

    # Groq API Configuration
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    # SMTP Settings
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM = os.getenv("SMTP_FROM", "CivicAI Notification Center <notifications@civicai.gov>")
    SMTP_TLS = os.getenv("SMTP_TLS", "True").lower() in ("true", "1", "yes")

    # Initial Super Admin credentials (used during secure auto-initialization)
    INITIAL_SUPER_ADMIN_EMAIL = os.getenv("INITIAL_SUPER_ADMIN_EMAIL", "superadmin@civicai.gov")
    INITIAL_SUPER_ADMIN_USERNAME = os.getenv("INITIAL_SUPER_ADMIN_USERNAME", "superadmin")
    INITIAL_SUPER_ADMIN_PASSWORD = os.getenv("INITIAL_SUPER_ADMIN_PASSWORD", "SuperAdminCivicAI@2026!")
    INITIAL_SUPER_ADMIN_NAME = os.getenv("INITIAL_SUPER_ADMIN_NAME", "CivicAI System Administrator")
    INITIAL_SUPER_ADMIN_PHONE = os.getenv("INITIAL_SUPER_ADMIN_PHONE", "+919876543210")

    # Uploads & Storage
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024)) # 16 MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'mp4', 'mov', 'webp'}

    # ML models directory
    MODELS_DIR = os.path.join(BASE_DIR, "models")

    # AI Confidence Threshold
    AI_CONFIDENCE_THRESHOLD = float(os.getenv("AI_CONFIDENCE_THRESHOLD", 0.65))

    # Emergency Escalation Timeouts (minutes)
    EMERGENCY_ESCALATION_LEVEL1_MINUTES = int(os.getenv("EMERGENCY_ESCALATION_LEVEL1_MINUTES", 5))
    EMERGENCY_ESCALATION_LEVEL2_MINUTES = int(os.getenv("EMERGENCY_ESCALATION_LEVEL2_MINUTES", 15))
