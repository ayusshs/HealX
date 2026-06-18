from app import mongo

class Hospital:
    @staticmethod
    def get_all():
        return list(mongo.db.hospitals.find({}, {'_id': 0}))

    @staticmethod
    def get_by_id(hospital_id):
        return mongo.db.hospitals.find_one({'hospital_id': hospital_id}, {'_id': 0})
        
    @staticmethod
    def create(data):
        count = mongo.db.hospitals.count_documents({}) + 1
        hospital_id = f"HOSP-{count:03d}"
        
        new_hospital = {
            'hospital_id': hospital_id,
            'name': data.get('name', ''),
            'logo': data.get('logo', ''),
            'address': data.get('address', ''),
            'location': data.get('location', {'city': '', 'state': '', 'lat': 0.0, 'lng': 0.0}),
            'workingHours': data.get('workingHours', '24/7'),
            'phone': data.get('phone', ''),
            'email': data.get('email', ''),
            'specialties': data.get('specialties', []),
            'departments': data.get('departments', []),
            'adminIds': data.get('adminIds', []),
            'crowd_level': data.get('crowd_level', 'Low'),
            'rating': data.get('rating', 0.0),
            'doctors': data.get('doctors', [])
        }
        mongo.db.hospitals.insert_one(new_hospital)
        new_hospital.pop('_id', None)
        return new_hospital
        
    @staticmethod
    def update(hospital_id, data):
        mongo.db.hospitals.update_one({'hospital_id': hospital_id}, {'$set': data})
        return Hospital.get_by_id(hospital_id)

    @staticmethod
    def seed_data():
        if mongo.db.hospitals.count_documents({}) == 0:
            hospitals = [
                {
                    'hospital_id': 'HOSP-001',
                    'name': 'SUM Hospital',
                    'logo': 'https://upload.wikimedia.org/wikipedia/en/c/c5/IMS_and_SUM_Hospital_logo.png',
                    'address': 'Kalinga Nagar, Bhubaneswar',
                    'location': {'city': 'Bhubaneswar', 'state': 'Odisha', 'lat': 20.28, 'lng': 85.78},
                    'workingHours': '24/7',
                    'phone': '0674-2386281',
                    'email': 'contact@sumhospital.com',
                    'specialties': ['Cardiology', 'ENT', 'Dentist', 'Neurology', 'General'],
                    'departments': [
                        {'deptId': 'CARD', 'name': 'Cardiology', 'isActive': True, 'doctors': [{'name': 'Dr. Ramesh', 'doctorId': 'DOC-102'}]},
                        {'deptId': 'ENT', 'name': 'ENT', 'isActive': True, 'doctors': [{'name': 'Dr. Ayush', 'doctorId': 'DOC-101'}]}
                    ],
                    'adminIds': [],
                    'crowd_level': 'High',
                    'rating': 4.5,
                    'doctors': [
                        {'name': 'Dr. Ayush', 'doctorId': 'DOC-101', 'specialty': 'ENT', 'slots': ['10:00AM - 11:00AM', '11:00AM - 12:00PM']},
                        {'name': 'Dr. Ramesh', 'doctorId': 'DOC-102', 'specialty': 'Cardiology', 'slots': ['01:00PM - 02:00PM']}
                    ]
                },
                {
                    'hospital_id': 'HOSP-002',
                    'name': 'AIIMS Bhubaneswar',
                    'logo': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/All_India_Institute_of_Medical_Sciences%2C_Bhubaneswar_logo.png/220px-All_India_Institute_of_Medical_Sciences%2C_Bhubaneswar_logo.png',
                    'address': 'Sijua, Patrapada, Bhubaneswar',
                    'location': {'city': 'Bhubaneswar', 'state': 'Odisha', 'lat': 20.23, 'lng': 85.77},
                    'workingHours': '08:00 AM - 08:00 PM',
                    'phone': '0674-2472200',
                    'email': 'info@aiimsbhubaneswar.edu.in',
                    'specialties': ['Cardiology', 'ENT', 'Neurology', 'Oncology', 'General'],
                    'departments': [
                        {'deptId': 'NEUR', 'name': 'Neurology', 'isActive': True, 'doctors': [{'name': 'Dr. Panda', 'doctorId': 'DOC-201'}]}
                    ],
                    'adminIds': [],
                    'crowd_level': 'Very High',
                    'rating': 4.8,
                    'doctors': [
                        {'name': 'Dr. Panda', 'doctorId': 'DOC-201', 'specialty': 'Neurology', 'slots': ['09:00AM - 10:00AM']}
                    ]
                },
                {
                    'hospital_id': 'HOSP-003',
                    'name': 'Capital Hospital',
                    'logo': '',
                    'address': 'Unit-6, Bhubaneswar',
                    'location': {'city': 'Bhubaneswar', 'state': 'Odisha', 'lat': 20.27, 'lng': 85.83},
                    'workingHours': '24/7',
                    'phone': '0674-2391983',
                    'email': 'capitalhospital@yahoo.com',
                    'specialties': ['ENT', 'Dentist', 'General'],
                    'departments': [
                        {'deptId': 'DENT', 'name': 'Dentist', 'isActive': True, 'doctors': [{'name': 'Dr. Singh', 'doctorId': 'DOC-301'}]}
                    ],
                    'adminIds': [],
                    'crowd_level': 'Medium',
                    'rating': 4.2,
                    'doctors': [
                        {'name': 'Dr. Singh', 'doctorId': 'DOC-301', 'specialty': 'Dentist', 'slots': ['04:00PM - 05:00PM']}
                    ]
                }
            ]
            mongo.db.hospitals.insert_many(hospitals)
            print("Seeded Hospitals Collection")
