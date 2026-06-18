from datetime import datetime
from app import mongo, bcrypt

class Patient:
    @staticmethod
    def create(data):
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        patient_id = "PAT-" + datetime.utcnow().strftime('%Y%m%d%H%M%S')
        new_patient = {
            'patient_id': patient_id,
            'name': data['name'],
            'email': data['email'],
            'password_hash': hashed_password,
            'gender': data['gender'],
            'dob': data.get('dob', ''),
            'bloodGroup': data.get('bloodGroup', ''),
            'phone': data['phone'],
            'emergency_contact': data.get('emergency_contact', {}),
            'address': data.get('address', ''),
            'aadhar': data.get('aadhar', ''),
            'insurance': data.get('insurance', {}),
            'role': 'patient',
            'created_at': datetime.utcnow(),
            'tss_points': 0,
            'appointments': [],
            'medicines': [],
            'reports': [],
            'bills': []
        }
        mongo.db.patients.insert_one(new_patient)
        return new_patient

    @staticmethod
    def find_by_email(email):
        return mongo.db.patients.find_one({'email': email})

    @staticmethod
    def find_by_id(patient_id):
        return mongo.db.patients.find_one({'patient_id': patient_id})
