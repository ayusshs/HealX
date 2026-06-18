from datetime import datetime
from app import socketio
from app.models.queue import Queue
from app.models.queue_history import QueueHistory

class QueueService:
    @staticmethod
    def assign_queue_number(hospital_id, department):
        """
        Atomically assign a queue number.
        Wait time = people_ahead * avg_time_per_patient
        people_ahead = total_in_queue (after increment) - current_serving - 1
        """
        queue = Queue.increment_total(hospital_id, department)

        total = queue['total_in_queue']          # My queue number (1-indexed)
        serving = queue.get('current_serving', 0)  # Currently being served
        avg_time = queue.get('avg_time_per_patient', 10)

        # People physically ahead of me in line
        people_ahead = max(0, total - serving - 1)
        
        # Try AI Wait time prediction, fallback to rule-based
        predicted_wait = people_ahead * avg_time
        try:
            from app.ai.queue_predictor import queue_predictor
            predicted_wait = queue_predictor.predict(
                people_ahead=people_ahead,
                department=department,
                doctor_id='',
                hour=datetime.now().hour,
                weekday=datetime.now().weekday(),
                holiday=0,
                doctor_avg_time=avg_time,
                emergency_cases=0
            )
        except Exception as e:
            # Fallback to rule-based prediction
            predicted_wait = people_ahead * avg_time

        # Log queue event
        try:
            QueueHistory.create({
                'hospital_id': hospital_id,
                'department': department,
                'queue_number': total,
                'people_ahead': people_ahead,
                'current_serving': serving,
                'action': 'joined'
            })
        except Exception:
            pass

        return {
            'queue_number': total,
            'people_ahead': people_ahead,
            'predicted_wait': predicted_wait,
            'current_serving': serving,
        }


    @staticmethod
    def broadcast_queue_update(hospital_id, department):
        queue = Queue.get_queue(hospital_id, department)
        if not queue:
            return

        serving = queue.get('current_serving', 0)
        total = queue.get('total_in_queue', 0)
        avg_time = queue.get('avg_time_per_patient', 10)

        socketio.emit('queue_update', {
            'hospital_id': hospital_id,
            'department': department,
            'current_serving': serving,
            'total_in_queue': total,
            'avg_time_per_patient': avg_time,
            # Generic remaining wait for any patient — frontend recalculates per position
            'base_wait_per_person': avg_time,
        })
