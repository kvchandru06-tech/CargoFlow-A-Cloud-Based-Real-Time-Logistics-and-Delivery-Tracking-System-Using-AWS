from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
import os

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()


def create_app(config_name=None):
    app = Flask(__name__)

    # Load config
    from config import config
    env = config_name or os.environ.get('FLASK_ENV', 'development')
    app.config.from_object(config.get(env, config['default']))

    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    CORS(app, resources={
        r"/api/*": {
            "origins": [app.config['FRONTEND_URL'], "http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.shipments import shipments_bp
    from app.routes.tracking import tracking_bp
    from app.routes.admin import admin_bp
    from app.routes.notifications import notifications_bp
    from app.routes.uploads import uploads_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(shipments_bp, url_prefix='/api/shipments')
    app.register_blueprint(tracking_bp, url_prefix='/api/tracking')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(uploads_bp, url_prefix='/api/uploads')

    # Health check
    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'service': 'CargoFlow API'}

    @app.route('/')
    def root():
        return {'message': 'CargoFlow backend is running. Use /api/health for health checks or start the frontend on http://localhost:3000.'}

    return app
