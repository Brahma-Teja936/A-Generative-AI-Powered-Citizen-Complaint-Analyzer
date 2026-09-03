import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "civicai-jwt-super-secret-key-2026-production")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "civicai-jwt-super-secret-key-2026-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    # Database: Default to PostgreSQL if psycopg2 is installed, otherwise SQLite
    default_db = "postgresql://postgres:postgres@localhost:5432/civicai"
    try:
        import psycopg2
        has_psycopg2 = True
    except ImportError:
        has_psycopg2 = False

    raw_db_url = os.getenv("DATABASE_URL")
    if raw_db_url and (has_psycopg2 or not raw_db_url.startswith("postgresql")):
        SQLALCHEMY_DATABASE_URI = raw_db_url
    elif has_psycopg2:
        SQLALCHEMY_DATABASE_URI = default_db
    else:
        # Fallback to local SQLite when psycopg2 / PostgreSQL is not present locally
        instance_dir = BASE_DIR / "instance"
        instance_dir.mkdir(parents=True, exist_ok=True)
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{instance_dir / 'civicai.db'}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Email / SMTP Configuration
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() in ("true", "1", "yes")
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", "civicai-notifications@city.gov")

    # Optional AI / Groq API
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", os.getenv("OPTIONAL_AI_API_KEY", ""))

    # Uploads
    UPLOAD_FOLDER = BASE_DIR / "uploads"
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max limit
    ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}