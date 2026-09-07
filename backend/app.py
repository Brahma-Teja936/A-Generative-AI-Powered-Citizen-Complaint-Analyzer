import os
import sys
from pathlib import Path
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from config import Config
from database.mongodb import db

# Import Blueprints
from routes.auth import auth_bp
from routes.client import client_bp
from routes.admin import admin_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.json.sort_keys = False

    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(client_bp)
    app.register_blueprint(admin_bp)

    # Health check
    @app.route("/", methods=["GET"])
    @app.route("/api/health", methods=["GET"])
    def index():
        return jsonify({
            "project": "CivicAI - AI-Powered Civic Complaint Management System",
            "status": "Running",
            "version": "2.0.0",
            "database": "MongoDB",
            "ml_engine": "TF-IDF + XGBoost"
        }), 200

    # Uploads serving endpoint
    @app.route("/api/uploads/<filename>", methods=["GET"])
    def serve_uploaded_file(filename):
        return send_from_directory(str(Config.UPLOAD_FOLDER), filename)

    # Error Handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"success": False, "message": "Bad request"}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"success": False, "message": "Access forbidden"}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "message": "Resource not found"}), 404

    @app.errorhandler(413)
    def file_too_large(e):
        return jsonify({"success": False, "message": "File exceeds maximum upload size (16MB)"}), 413

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"success": False, "message": "Internal server error"}), 500

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
