from flask import Blueprint, jsonify, request
from app.models.hospital import Hospital
from app.services.ai_service import ai_service

hospital_bp = Blueprint('hospital', __name__)

@hospital_bp.route('/seed', methods=['POST'])
def seed_hospitals():
    Hospital.seed_data()
    return jsonify({"message": "Hospitals seeded successfully"}), 200

@hospital_bp.route('/', methods=['GET'])
def get_hospitals():
    hospitals = Hospital.get_all()
    return jsonify(hospitals), 200

@hospital_bp.route('/search', methods=['GET'])
def search_hospitals():
    disease = request.args.get('disease', '')
    state = request.args.get('state', '')
    query = request.args.get('query', '').lower()
    
    hospitals = Hospital.get_all()
    
    if disease:
        department = ai_service.recommend_department(disease)
        hospitals = [h for h in hospitals if department in h.get('specialties', [])]
        
    if query:
        hospitals = [h for h in hospitals if query in h.get('name', '').lower() or query in h.get('address', '').lower() or query in h.get('location', {}).get('city', '').lower()]

    return jsonify(hospitals), 200

@hospital_bp.route('/<hospital_id>', methods=['GET'])
def get_hospital(hospital_id):
    hospital = Hospital.get_by_id(hospital_id)
    if hospital:
        return jsonify(hospital), 200
    return jsonify({'message': 'Hospital not found'}), 404

@hospital_bp.route('/<hospital_id>', methods=['PUT'])
def update_hospital(hospital_id):
    data = request.json
    hospital = Hospital.update(hospital_id, data)
    if hospital:
        return jsonify(hospital), 200
    return jsonify({'message': 'Hospital not found'}), 404
