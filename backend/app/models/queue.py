from datetime import datetime
from app import mongo

class Queue:
    @staticmethod
    def _get_default_avg_time(department):
        dept_avg_minutes = {
            'ENT': 8,
            'Cardiology': 15,
            'General': 5,
            'Dentist': 20,
            'Neurology': 25,
            'Oncology': 30,
        }
        return dept_avg_minutes.get(department, 10)

    @staticmethod
    def get_or_create(hospital_id, department):
        """Get existing queue or create a fresh one — always returns a valid document."""
        result = mongo.db.queue.find_one_and_update(
            {'hospital_id': hospital_id, 'department': department},
            {
                '$setOnInsert': {
                    'hospital_id': hospital_id,
                    'department': department,
                    'current_serving': 0,
                    'total_in_queue': 0,
                    'avg_time_per_patient': Queue._get_default_avg_time(department),
                    'last_updated': datetime.utcnow()
                }
            },
            upsert=True,
            return_document=True
        )
        return result

    @staticmethod
    def get_queue(hospital_id, department):
        return Queue.get_or_create(hospital_id, department)

    @staticmethod
    def increment_total(hospital_id, department):
        """Increment total_in_queue atomically, guaranteed to have current_serving."""
        # Ensure document exists first
        Queue.get_or_create(hospital_id, department)
        # Now increment
        queue = mongo.db.queue.find_one_and_update(
            {'hospital_id': hospital_id, 'department': department},
            {
                '$inc': {'total_in_queue': 1},
                '$set': {'last_updated': datetime.utcnow()}
            },
            return_document=True
        )
        return queue

    @staticmethod
    def increment_serving(hospital_id, department):
        Queue.get_or_create(hospital_id, department)
        return mongo.db.queue.find_one_and_update(
            {'hospital_id': hospital_id, 'department': department},
            {'$inc': {'current_serving': 1}, '$set': {'last_updated': datetime.utcnow()}},
            return_document=True
        )
