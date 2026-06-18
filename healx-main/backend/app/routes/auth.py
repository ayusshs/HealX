from flask import Blueprint, request, jsonify
from app.models.patient import Patient
from app.models.admin_user import AdminUser
from app import bcrypt
from app.config import Config
import jwt
from datetime import datetime, timedelta
from functools import wraps

auth_bp = Blueprint('auth', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            token = token.split(" ")[1] # Bearer token
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            
            # Check Patient first
            if 'patient_id' in data:
                current_user = Patient.find_by_id(data['patient_id'])
            elif 'admin_id' in data:
                current_user = AdminUser.find_by_id(data['admin_id'])
            else:
                current_user = None

            if not current_user:
                return jsonify({'message': 'Invalid token!'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    if Patient.find_by_email(data.get('email')):
        return jsonify({'message': 'Email already registered'}), 400
        
    patient = Patient.create(data)
    return jsonify({'message': 'Patient registered successfully', 'patient_id': patient['patient_id']}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    # Check Patient
    patient = Patient.find_by_email(email)
    if patient and bcrypt.check_password_hash(patient['password_hash'], password):
        # ensure role is set
        patient['role'] = patient.get('role', 'patient')
        # Remove password hash before sending to frontend
        patient.pop('password_hash', None)
        patient.pop('_id', None)
        
        token = jwt.encode({
            'patient_id': patient['patient_id'],
            'role': patient['role'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, Config.SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            'token': token,
            'user': patient
        }), 200
        
    # Check Admin
    admin = AdminUser.find_by_email(email)
    if admin and bcrypt.check_password_hash(admin['password_hash'], password):
        admin['role'] = admin.get('role', 'admin')
        admin.pop('password_hash', None)
        admin.pop('_id', None)
        
        token = jwt.encode({
            'admin_id': admin['admin_id'],
            'role': admin['role'],
            'hospitalId': admin.get('hospital_id', None),
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, Config.SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            'token': token,
            'user': admin
        }), 200
        
    return jsonify({'message': 'Invalid email or password'}), 401
