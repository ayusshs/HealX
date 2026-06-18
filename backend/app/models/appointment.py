from datetime import datetime
from app import mongo
import random

class Appointment:
    @staticmethod
    def create(data):
        date_str = datetime.now().strftime('%Y%m%d')
        dept_code = data.get('department', 'GEN')[:4].upper()
        random_suffix = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=5))
        booking_id = f"HLX-{date_str}-{dept_code}-{random_suffix}"
        
        new_appointment = {
            'booking_id': booking_id,
            'patient_id': data.get('patient_id'),
            'hospital_id': data['hospital_id'],
            'doctor_id': data.get('doctor_id'),
            'department': data['department'],
            'slot_time': data.get('slot_time'),
            'queue_number': data.get('queue_number', 0),
            'status': data.get('status', 'pending'), # pending, completed, cancelled
            'wait_time_predicted': data.get('wait_time_predicted', 0),
            'type': data.get('type', 'In-Person'),
            'symptoms': data.get('symptoms', ''),
            'paymentMode': data.get('paymentMode', 'Cash'),
            'paymentStatus': data.get('paymentStatus', 'Pending'),
            'booked_at': datetime.utcnow()
        }
        mongo.db.appointments.insert_one(new_appointment)
        return new_appointment

    @staticmethod
    def find_active_by_patient(patient_id):
        return mongo.db.appointments.find_one({'patient_id': patient_id, 'status': 'pending'})

    @staticmethod
    def update_status(booking_id, status):
        mongo.db.appointments.update_one({'booking_id': booking_id}, {'$set': {'status': status}})
