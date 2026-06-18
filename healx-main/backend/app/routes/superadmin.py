from flask import Blueprint, jsonify, request
from functools import wraps
from app.models.admin_user import AdminUser
from app.models.hospital import Hospital
from app.routes.auth import token_required
from app import mongo
import datetime

superadmin_bp = Blueprint('superadmin', __name__)


def superadmin_required(f):
    """Decorator that checks the user has 'superadmin' role."""
    @wraps(f)
    def decorated(*args, **kwargs):
        # Re-use token_required logic inline to avoid double-wrapping bugs
        from flask import request as req
        from app.config import Config
        import jwt

        token = req.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            token = token.split(" ")[1]
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])

            if 'admin_id' in data:
                current_user = mongo.db.admins.find_one({'admin_id': data['admin_id']})
            elif 'patient_id' in data:
                current_user = mongo.db.patients.find_one({'patient_id': data['patient_id']})
            else:
                current_user = None

            if not current_user:
                return jsonify({'message': 'Invalid token!'}), 401

            if current_user.get('role') != 'superadmin':
                return jsonify({'message': 'Superadmin privileges required!'}), 403

        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401

        return f(current_user, *args, **kwargs)
    return decorated


# ─── Dashboard ────────────────────────────────────────────────────────────────

@superadmin_bp.route('/dashboard', methods=['GET'])
@superadmin_required
def get_dashboard(current_user):
    return jsonify({
        'total_hospitals': mongo.db.hospitals.count_documents({}),
        'total_admins': mongo.db.admins.count_documents({'role': 'admin'}),
        'total_patients': mongo.db.patients.count_documents({}),
        'total_appointments': mongo.db.appointments.count_documents({}),
    }), 200


@superadmin_bp.route('/analytics', methods=['GET'])
@superadmin_required
def get_platform_analytics(current_user):
    return jsonify({
        'total_hospitals': mongo.db.hospitals.count_documents({}),
        'total_admins': mongo.db.admins.count_documents({'role': 'admin'}),
        'total_patients': mongo.db.patients.count_documents({}),
        'total_appointments': mongo.db.appointments.count_documents({}),
    }), 200


# ─── Hospitals ────────────────────────────────────────────────────────────────

@superadmin_bp.route('/hospitals', methods=['GET'])
@superadmin_required
def list_hospitals(current_user):
    hospitals = list(mongo.db.hospitals.find({}, {'_id': 0}))
    return jsonify(hospitals), 200


@superadmin_bp.route('/hospitals', methods=['POST'])
@superadmin_required
def create_hospital(current_user):
    data = request.json
    new_hospital = Hospital.create(data)
    return jsonify({'message': 'Hospital created successfully', 'hospital': new_hospital}), 201


@superadmin_bp.route('/hospitals/<hospital_id>', methods=['PUT'])
@superadmin_required
def update_hospital(current_user, hospital_id):
    data = request.json
    updated_hospital = Hospital.update(hospital_id, data)
    return jsonify({'message': 'Hospital updated successfully', 'hospital': updated_hospital}), 200


# ─── Admins ───────────────────────────────────────────────────────────────────

@superadmin_bp.route('/admins', methods=['GET'])
@superadmin_required
def list_admins(current_user):
    admins = list(mongo.db.admins.find({}, {'_id': 0, 'password_hash': 0}))
    return jsonify(admins), 200


@superadmin_bp.route('/admins', methods=['POST'])
@superadmin_required
def create_admin(current_user):
    data = request.json

    # Allow superadmin role only if explicitly set, otherwise default to admin
    allowed_roles = ['admin', 'superadmin']
    role = data.get('role', 'admin')
    if role not in allowed_roles:
        role = 'admin'
    data['role'] = role

    if AdminUser.find_by_email(data.get('email')):
        return jsonify({'message': 'Email already registered'}), 400

    admin = AdminUser.create(data)

    # Link admin to hospital if provided
    hospital_id = data.get('hospitalId') or data.get('hospital_id')
    if hospital_id and role == 'admin':
        hospital = Hospital.get_by_id(hospital_id)
        if hospital:
            adminIds = hospital.get('adminIds', [])
            if admin['admin_id'] not in adminIds:
                adminIds.append(admin['admin_id'])
                Hospital.update(hospital_id, {'adminIds': adminIds})

    return jsonify({'message': f'{role.capitalize()} created successfully', 'admin_id': admin['admin_id']}), 201
