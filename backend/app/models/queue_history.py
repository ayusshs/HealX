from datetime import datetime
from app import mongo

class QueueHistory:
    @staticmethod
    def create(data):
        new_event = {
            'hospital_id': data['hospital_id'],
            'department': data['department'],
            'doctor_id': data.get('doctor_id', ''),
            'queue_number': data.get('queue_number', 0),
            'people_ahead': data.get('people_ahead', 0),
            'current_serving': data.get('current_serving', 0),
            'action': data.get('action', 'joined'),  # 'joined', 'served', 'completed', 'cancelled', 'no-show'
            'timestamp': datetime.utcnow()
        }
        mongo.db.queue_history.insert_one(new_event)
        return new_event
