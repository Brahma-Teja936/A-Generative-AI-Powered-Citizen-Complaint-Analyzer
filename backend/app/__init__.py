import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from backend.config import Config
from backend.app.extensions import Database
from backend.app.db.indexes import create_indexes
from backend.init_superadmin import initialize_superadmin, initialize_departments
from backend.app.ml.predictor import MLPredictor

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable Cross-Origin Resource Sharing
    CORS(app, resources={r"/api/*": {"origins": "*"}, r"/uploads/*": {"origins": "*"}})

    # Initialize Database Connection
    Database.initialize(app)

    # Ensure Uploads Directory exists
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

    with app.app_context():
        # Ensure collection indexes
        create_indexes()

        # Seed initial SUPER_ADMIN if none exists
        initialize_superadmin()

        # Seed initial civic departments if none exist
        initialize_departments()

        # Load ML Models once into memory
        print("[CivicAI Startup] Initializing ML Predictor models...")
        MLPredictor.get_instance()

    # Register Blueprints
    from backend.app.routes.auth import auth_bp
    from backend.app.routes.admin import admin_bp
    from backend.app.routes.department import department_bp
    from backend.app.routes.client import client_bp
    from backend.app.routes.emergency import emergency_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(department_bp, url_prefix="/api/department")
    app.register_blueprint(client_bp, url_prefix="/api/client")
    app.register_blueprint(emergency_bp, url_prefix="/api/admin/emergency")

    # Static file serving for complaint and evidence attachments
    @app.route('/uploads/<path:filename>')
    def serve_uploaded_file(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        db_connected = Database.get_db() is not None
        ml_loaded = MLPredictor.get_instance().models_loaded
        return jsonify({
            "status": "healthy",
            "service": "CivicAI Backend API",
            "database_connected": db_connected,
            "ml_models_loaded": ml_loaded,
            "version": "1.0.0"
        }), 200

    return app
