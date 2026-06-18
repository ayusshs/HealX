from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from app.config import Config

# Initialize extensions
socketio = SocketIO(cors_allowed_origins="*")
bcrypt = Bcrypt()
mongo = None # We will initialize this in create_app

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    CORS(app)
    
    global mongo
    try:
        mongo = MongoClient(app.config['MONGO_URI'])
        # test connection
        mongo.admin.command('ping')
        print("Connected to MongoDB successfully!")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")

    # Initialize SocketIO with message queue if available
    try:
        socketio.init_app(app, message_queue=app.config.get('REDIS_URL'))
    except Exception as e:
        print(f"Could not connect to Redis: {e}, falling back to simple queue")
        socketio.init_app(app)

    bcrypt.init_app(app)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.patient import patient_bp
    from app.routes.hospital import hospital_bp
    from app.routes.api import api_bp
    from app.routes.admin import admin_bp
    from app.routes.superadmin import superadmin_bp
    from app.routes.ai import ai_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(patient_bp, url_prefix='/api/patient')
    app.register_blueprint(hospital_bp, url_prefix='/api/hospital')
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(superadmin_bp, url_prefix='/api/superadmin')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')

    @app.route('/')
    def index():
        return {"message": "Welcome to HealX API"}

    return app
