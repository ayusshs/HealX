from flask import Blueprint, request, jsonify
from app.models.appointment import Appointment
from app.services.queue_service import QueueService
from app.services.ai_service import ai_service

api_bp = Blueprint('api', __name__)

@api_bp.route('/walkin_book', methods=['POST'])
def walkin_book():
    data = request.json
    hospital_id = data.get('hospital_id')
    department = data.get('department')
    
    # Get queue info
    queue_info = QueueService.assign_queue_number(hospital_id, department)
    
    data['patient_id'] = f"WALKIN-{data.get('phone')}"
    data['queue_number'] = queue_info['queue_number']
    data['wait_time_predicted'] = queue_info['predicted_wait']
    
    appointment = Appointment.create(data)
    
    QueueService.broadcast_queue_update(hospital_id, department)
    
    if '_id' in appointment:
        appointment['_id'] = str(appointment['_id'])
        
    return jsonify({
        'message': 'Walk-in appointment booked',
        'appointment': appointment
    }), 201

@api_bp.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message')
    patient_context = data.get('patient_context', {})
    
    try:
        from app.ai.core.router import ai_router
        result = ai_router.route(patient_context, message)
        return jsonify({'response': result['response']})
    except Exception as e:
        print(f"Fallback routing to advanced AI failed: {e}. Running rule-based chatbot.")
        response = ai_service.get_chatbot_response(message)
        return jsonify({'response': response})
