from datetime import datetime
from app import mongo, bcrypt

class AdminUser:
    @staticmethod
    def create(data):
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        admin_id = "ADM-" + datetime.utcnow().strftime('%Y%m%d%H%M%S')
        new_admin = {
            'admin_id': admin_id,
            'name': data['name'],
            'email': data['email'],
            'password_hash': hashed_password,
            'role': data.get('role', 'admin'), # 'admin' or 'superadmin'
            'hospitalId': data.get('hospitalId', None),
            'created_at': datetime.utcnow()
        }
        mongo.db.admins.insert_one(new_admin)
        return new_admin

    @staticmethod
    def find_by_email(email):
        return mongo.db.admins.find_one({'email': email})

    @staticmethod
    def find_by_id(admin_id):
        return mongo.db.admins.find_one({'admin_id': admin_id})

    @staticmethod
    def seed_superadmin():
        if mongo.db.admins.count_documents({'role': 'superadmin'}) == 0:
            AdminUser.create({
                'name': 'Super Admin',
                'email': 'superadmin@healx.com',
                'password': 'superpassword',
                'role': 'superadmin',
                'hospitalId': None
            })
            print("Seeded Super Admin")
