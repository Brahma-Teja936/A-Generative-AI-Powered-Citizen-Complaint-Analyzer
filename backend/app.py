import os
import sys
from pathlib import Path
from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy.exc import OperationalError

# Configure paths
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from config import Config
from extensions import db
from models import User, Department, Complaint, EmailLog

# Import Blueprints
from routes.auth import auth_bp
from routes.complaints import complaints_bp
from routes.admin import admin_bp
from routes.departments import departments_bp
from routes.email_logs import email_logs_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.json.sort_keys = False

    # Enable CORS for all routes
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize SQLAlchemy database
    db.init_app(app)

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(complaints_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(departments_bp)
    app.register_blueprint(email_logs_bp)

    # Health Check / Home Route
    @app.route("/", methods=["GET"])
    def home():
        return jsonify({
            "project": "CivicAI - AI-Based Civic Complaint Analyzer",
            "status": "Backend Running Successfully",
            "version": "1.0.0",
            "database": app.config.get("SQLALCHEMY_DATABASE_URI", "").split("://")[0]
        }), 200

    # Error Handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"success": False, "message": "Bad request"}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "message": "Resource not found"}), 404

    @app.errorhandler(413)
    def file_too_large(e):
        return jsonify({"success": False, "message": "Uploaded file is too large (maximum 16MB)"}), 413

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"success": False, "message": "Internal server error"}), 500

    # Ensure tables exist with graceful PostgreSQL/SQLite handling
    with app.app_context():
        try:
            db.create_all()
            print(f"[OK] Database connected using: {app.config['SQLALCHEMY_DATABASE_URI']}")
        except OperationalError as err:
            print(f"[WARN] PostgreSQL connection failed ({err}). Falling back to local SQLite database...")
            # Fallback for local development if PostgreSQL server is not running
            instance_dir = BASE_DIR / "instance"
            instance_dir.mkdir(parents=True, exist_ok=True)
            fallback_uri = f"sqlite:///{instance_dir / 'civicai.db'}"
            app.config["SQLALCHEMY_DATABASE_URI"] = fallback_uri
            db.engine.dispose()
            db.init_app(app)
            db.create_all()
            print(f"[OK] Fallback SQLite database connected: {fallback_uri}")

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
