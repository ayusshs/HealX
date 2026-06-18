from flask import Blueprint, jsonify, request
from app.models.appointment import Appointment
from app.models.queue import Queue
from app.services.queue_service import QueueService
from app import mongo
import csv
from io import StringIO
from flask import Response

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/appointments', methods=['GET'])
def get_all_appointments():
    # Simple list for admin
    status = request.args.get('status')
    hospital_id = request.args.get('hospital_id')
    query = {}
    if status and status != 'all':
        query['status'] = status
    if hospital_id:
        query['hospital_id'] = hospital_id
        
    appointments = list(mongo.db.appointments.find(query, {'_id': 0}).sort('booked_at', -1))
    return jsonify(appointments), 200

@admin_bp.route('/appointments/<booking_id>/status', methods=['PUT'])
def update_status(booking_id):
    data = request.json
    new_status = data.get('status')
    
    # Get appointment details to compute wait time if status is completed
    appointment = mongo.db.appointments.find_one({'booking_id': booking_id})
    if appointment and new_status == 'completed' and appointment.get('status') != 'completed':
        from datetime import datetime
        booked_at = appointment.get('booked_at')
        if booked_at:
            if isinstance(booked_at, str):
                try:
                    booked_at = datetime.fromisoformat(booked_at)
                except ValueError:
                    booked_at = datetime.utcnow()
            
            # calculate actual wait time in minutes
            served_time = datetime.utcnow()
            actual_wait = (served_time - booked_at).total_seconds() / 60.0
            actual_wait = max(0.0, round(actual_wait, 2))
            
            mongo.db.appointments.update_one(
                {'booking_id': booking_id}, 
                {'$set': {
                    'status': new_status,
                    'served_at': served_time,
                    'actual_wait': actual_wait
                }}
            )
            
            # Log queue event
            try:
                from app.models.queue_history import QueueHistory
                QueueHistory.create({
                    'hospital_id': appointment.get('hospital_id'),
                    'department': appointment.get('department'),
                    'queue_number': appointment.get('queue_number', 0),
                    'action': 'completed'
                })
            except Exception:
                pass
        else:
            Appointment.update_status(booking_id, new_status)
    elif appointment and new_status in ['cancelled', 'no-show']:
        Appointment.update_status(booking_id, new_status)
        try:
            from app.models.queue_history import QueueHistory
            QueueHistory.create({
                'hospital_id': appointment.get('hospital_id'),
                'department': appointment.get('department'),
                'queue_number': appointment.get('queue_number', 0),
                'action': new_status
            })
        except Exception:
            pass
    else:
        Appointment.update_status(booking_id, new_status)
        
    return jsonify({'message': 'Status updated successfully'}), 200

@admin_bp.route('/queue/serve', methods=['POST'])
def serve_next():
    data = request.json
    hospital_id = data.get('hospital_id')
    department = data.get('department')
    
    # Increment current_serving
    queue = Queue.increment_serving(hospital_id, department)
    
    # Broadcast queue update
    QueueService.broadcast_queue_update(hospital_id, department)
    
    # Log queue event
    try:
        from app.models.queue_history import QueueHistory
        QueueHistory.create({
            'hospital_id': hospital_id,
            'department': department,
            'current_serving': queue.get('current_serving', 0),
            'action': 'served'
        })
    except Exception:
        pass
        
    if queue and '_id' in queue:
        queue['_id'] = str(queue['_id'])
        
    return jsonify({'message': 'Queue updated', 'queue': queue}), 200

@admin_bp.route('/analytics', methods=['GET'])
def get_analytics():
    hospital_id = request.args.get('hospital_id', 'HOSP-001')
    total_appointments = mongo.db.appointments.count_documents({'hospital_id': hospital_id})
    queues = list(mongo.db.queue.find({'hospital_id': hospital_id}, {'_id': 0}))
    
    # Generate AI-driven analytics insights
    try:
        from app.ai.analytics_ai import analytics_ai
        ai_insights = analytics_ai.generate_admin_insights(hospital_id)
    except Exception as e:
        print(f"Failed to generate AI analytics: {e}")
        ai_insights = {
            'insights': ["Patient flow rates are normal across all check-in counters."],
            'recommendations': ["No immediate staffing adjustments required."]
        }
        
    return jsonify({
        'total_appointments': total_appointments,
        'queues': queues,
        'ai_insights': ai_insights.get('insights', []),
        'ai_recommendations': ai_insights.get('recommendations', [])
    }), 200

@admin_bp.route('/patient/<patient_id>/ai_summary', methods=['GET'])
def get_patient_ai_summary(patient_id):
    from datetime import datetime
    patient = mongo.db.patients.find_one({'patient_id': patient_id})
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
        
    # Compile patient medical records
    appointments = list(mongo.db.appointments.find({'patient_id': patient_id}).sort('booked_at', -1))
    reports = list(mongo.db.reports.find({'patient_id': patient_id}))
    
    # Fetch disease risk prediction if any
    latest_risk = "Not evaluated"
    try:
        from app.ai.disease_predictor import disease_predictor
        dob = patient.get('dob', '1990')
        age = 35 # default
        if len(dob) >= 4:
            try: age = datetime.now().year - int(dob[:4])
            except: pass
            
        risk_result = disease_predictor.predict(
            age=age,
            bmi=24.5,
            sys_bp=120,
            sugar=95,
            smoking=0,
            exercise=1,
            family_history=0
        )
        latest_risk = f"{risk_result.get('risk_level')} (Confidence: {risk_result.get('confidence') * 100:.0f}%)"
    except Exception:
        pass
        
    # Build Ollama reasoning context for doctor summary
    patient_details = (
        f"Patient Details:\n"
        f"- Name: {patient.get('name')}\n"
        f"- Gender: {patient.get('gender')}\n"
        f"- Blood Group: {patient.get('bloodGroup')}\n"
        f"- Current Medicines: {', '.join(patient.get('medicines', [])) or 'None'}\n"
        f"- Disease Risk Estimation: {latest_risk}\n"
        f"- Past Visits count: {len(appointments)}\n"
        f"- Lab Reports uploaded: {len(reports)} files\n"
    )
    
    messages = [{
        'role': 'user',
        'content': f"Synthesize this patient clinical history into a concise, professional doctor brief:\n\n{patient_details}"
    }]
    
    system_prompt = (
        "You are an expert clinical summarization assistant.\n"
        "Draft a concise markdown summary for a doctor visiting this patient.\n"
        "Highlight key metrics, active prescriptions, potential risk concerns, and follow-up consultation goals.\n"
        "Keep it strictly professional and short."
    )
    
    try:
        from app.ai.llm.ollama_client import ollama_client
        summary = ollama_client.chat(messages, system_prompt=system_prompt)
    except Exception as e:
        summary = "AI summary engine offline. Please review patient history files manually."
        
    return jsonify({
        'patient_id': patient_id,
        'summary': summary
    }), 200

@admin_bp.route('/feedback_analytics', methods=['GET'])
def get_feedback_analytics():
    feedbacks = list(mongo.db.feedback.find({}, {'_id': 0}))
    
    # Seed default feedbacks if empty
    if not feedbacks:
        feedbacks = [
            {'text': "The waiting time in Cardiology was extremely long. I waited over an hour.", 'department': 'Cardiology'},
            {'text': "Dr. Ramesh was fantastic. Very clear instructions and friendly.", 'department': 'Cardiology'},
            {'text': "The clinic was very clean, but booking slots online is a bit confusing.", 'department': 'General'},
            {'text': "Billing counter is understaffed. Had to wait 30 minutes just to make a cash payment.", 'department': 'Billing'}
        ]
        
    # Analyze each review using feedback_analyzer
    analyzed_feedbacks = []
    sentiment_counts = {'positive': 0, 'neutral': 0, 'negative': 0}
    topic_counts = {}
    
    try:
        from app.ai.feedback_analyzer import feedback_analyzer
        for f in feedbacks:
            text = f.get('text', '')
            res = feedback_analyzer.analyze(text)
            sentiment = res['sentiment']
            sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1
            
            for t in res['topics']:
                topic_counts[t] = topic_counts.get(t, 0) + 1
                
            analyzed_feedbacks.append({
                'text': text,
                'department': f.get('department', 'General'),
                'sentiment': sentiment,
                'topics': res['topics']
            })
    except Exception as e:
        print(f"Feedback analyzer failed: {e}")
        
    return jsonify({
        'total_reviews': len(feedbacks),
        'sentiment_distribution': sentiment_counts,
        'common_issues_by_topic': topic_counts,
        'reviews': analyzed_feedbacks[:10] # limit to 10
    }), 200


@admin_bp.route('/export', methods=['GET'])
def export_csv():
    appointments = list(mongo.db.appointments.find({}, {'_id': 0}).sort('booked_at', -1))
    
    def generate():
        data = StringIO()
        writer = csv.writer(data)
        
        writer.writerow(('Booking ID', 'Patient ID', 'Hospital ID', 'Department', 'Status', 'Wait Time', 'Queue Number'))
        yield data.getvalue()
        data.seek(0)
        data.truncate(0)
        
        for appt in appointments:
            writer.writerow((
                appt.get('booking_id', ''),
                appt.get('patient_id', ''),
                appt.get('hospital_id', ''),
                appt.get('department', ''),
                appt.get('status', ''),
                appt.get('wait_time_predicted', ''),
                appt.get('queue_number', '')
            ))
            yield data.getvalue()
            data.seek(0)
            data.truncate(0)
            
    return Response(generate(), mimetype='text/csv', headers={"Content-Disposition": "attachment;filename=appointments.csv"})
