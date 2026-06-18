from flask import Blueprint, jsonify, request
from app.routes.auth import token_required
from app.models.appointment import Appointment
from app.models.queue import Queue
from app.services.queue_service import QueueService
from app import mongo
from datetime import datetime

patient_bp = Blueprint('patient', __name__)

@patient_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    user_data = {
        'patient_id': current_user['patient_id'],
        'name': current_user['name'],
        'email': current_user['email'],
        'gender': current_user.get('gender', 'N/A'),
        'dob': current_user.get('dob', ''),
        'bloodGroup': current_user.get('bloodGroup', ''),
        'phone': current_user.get('phone', ''),
        'emergency_contact': current_user.get('emergency_contact', {}),
        'address': current_user.get('address', ''),
        'aadhar': current_user.get('aadhar', ''),
        'insurance': current_user.get('insurance', {}),
        'tss_points': current_user.get('tss_points', 0),
        'appointments': list(mongo.db.appointments.find({'patient_id': current_user['patient_id']}, {'_id': 0}).sort('booked_at', -1)),
        'medicines': current_user.get('medicines', []),
        'reports': current_user.get('reports', []),
        'bills': current_user.get('bills', [])
    }
    return jsonify(user_data), 200

@patient_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.json
    allowed_fields = ['name', 'gender', 'dob', 'bloodGroup', 'phone', 'emergency_contact', 'address', 'aadhar', 'insurance']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if update_data:
        mongo.db.patients.update_one({'patient_id': current_user['patient_id']}, {'$set': update_data})
        
    return jsonify({'message': 'Profile updated successfully'}), 200

@patient_bp.route('/active-appointment', methods=['GET'])
@token_required
def get_active_appointment(current_user):
    appointment = Appointment.find_active_by_patient(current_user['patient_id'])
    if not appointment:
        return jsonify({'message': 'No active appointment'}), 404

    if '_id' in appointment:
        appointment['_id'] = str(appointment['_id'])

    # --- LIVE RECALCULATION ---
    try:
        q = Queue.get_queue(appointment['hospital_id'], appointment['department'])
        current_serving = q.get('current_serving', 0)
        avg_time = q.get('avg_time_per_patient', 10)
        my_queue_number = appointment.get('queue_number', 1)

        # How many people are still ahead of me?
        people_ahead = max(0, my_queue_number - current_serving - 1)
        live_wait = people_ahead * avg_time

        appointment['current_serving'] = current_serving
        appointment['total_in_queue'] = q.get('total_in_queue', my_queue_number)
        appointment['people_ahead'] = people_ahead
        appointment['wait_time_predicted'] = live_wait  # Always live, not stale
        appointment['avg_time_per_patient'] = avg_time
    except Exception as e:
        appointment['current_serving'] = 0
        appointment['people_ahead'] = appointment.get('queue_number', 1) - 1

    return jsonify(appointment), 200

@patient_bp.route('/appointments', methods=['GET'])
@token_required
def get_my_appointments(current_user):
    appointments = list(mongo.db.appointments.find(
        {'patient_id': current_user['patient_id']},
        {'_id': 0}
    ).sort('booked_at', -1))
    return jsonify(appointments), 200

@patient_bp.route('/appointment/<booking_id>', methods=['GET'])
@token_required
def get_appointment(current_user, booking_id):
    appointment = mongo.db.appointments.find_one(
        {'patient_id': current_user['patient_id'], 'booking_id': booking_id},
        {'_id': 0}
    )
    if not appointment:
        return jsonify({'message': 'Appointment not found'}), 404
        
    # Also fetch hospital details to embed
    hospital = mongo.db.hospitals.find_one({'hospital_id': appointment['hospital_id']}, {'_id': 0})
    if hospital:
        appointment['hospital'] = hospital
        
    return jsonify(appointment), 200

@patient_bp.route('/book', methods=['POST'])
@token_required
def book_appointment(current_user):
    data = request.json or {}
    hospital_id = data.get('hospital_id')
    department = data.get('department')
    slot_time = data.get('slot_time', '11:00 AM')

    if not hospital_id or not department:
        return jsonify({'message': 'hospital_id and department are required'}), 400

    try:
        queue_info = QueueService.assign_queue_number(hospital_id, department)
    except Exception as e:
        return jsonify({'message': f'Queue error: {str(e)}'}), 500

    appointment_data = {
        'patient_id': current_user['patient_id'],
        'hospital_id': hospital_id,
        'doctor_id': data.get('doctor_id'),
        'department': department,
        'slot_time': slot_time,
        'queue_number': queue_info['queue_number'],
        'wait_time_predicted': queue_info['predicted_wait'],
        'status': 'pending',
        'type': data.get('type', 'In-Person'),
        'symptoms': data.get('symptoms', ''),
        'paymentMode': data.get('paymentMode', 'Cash'),
        'paymentStatus': 'Paid' if data.get('paymentMode') in ['Card', 'UPI'] else 'Pending',
        'booked_at': datetime.utcnow().isoformat()
    }

    try:
        appointment = Appointment.create(appointment_data)
        if '_id' in appointment:
            appointment['_id'] = str(appointment['_id'])
    except Exception as e:
        return jsonify({'message': f'Appointment creation error: {str(e)}'}), 500

    try:
        QueueService.broadcast_queue_update(hospital_id, department)
    except Exception:
        pass

    return jsonify({
        'message': 'Appointment booked successfully',
        'appointment': appointment
    }), 201

@patient_bp.route('/upload_report', methods=['POST'])
@token_required
def upload_report(current_user):
    import os
    if 'file' not in request.files:
        return jsonify({'message': 'No file part in the request'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No file selected for uploading'}), 400
        
    # Save file temporarily
    upload_dir = 'uploads'
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, file.filename)
    file.save(filepath)
    
    try:
        from app.ai.report_analyzer import report_analyzer
        report_doc = report_analyzer.analyze(filepath, current_user['patient_id'])
        
        # Convert ObjectId to string for JSON serialization
        if '_id' in report_doc:
            report_doc['_id'] = str(report_doc['_id'])
            
        return jsonify({
            'message': 'Report uploaded and analyzed successfully',
            'report': report_doc
        }), 201
    except Exception as e:
        print(f"Report analysis endpoint error: {e}")
        return jsonify({'message': f'Analysis error: {str(e)}'}), 500
    finally:
        # Clean up temp file
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception:
                pass

@patient_bp.route('/reports', methods=['GET'])
@token_required
def get_reports(current_user):
    reports = list(mongo.db.reports.find({'patient_id': current_user['patient_id']}))
    for r in reports:
        r['_id'] = str(r['_id'])
    return jsonify(reports), 200


