from datetime import datetime
from app import mongo

class Report:
    @staticmethod
    def create(data):
        new_report = {
            'patient_id': data['patient_id'],
            'filename': data['filename'],
            'extracted_text': data.get('extracted_text', ''),
            'ai_summary': data.get('ai_summary', ''),
            'uploaded_at': datetime.utcnow()
        }
        mongo.db.reports.insert_one(new_report)
        
        # Link reference directly in patient profile
        mongo.db.patients.update_one(
            {'patient_id': data['patient_id']},
            {'$push': {'reports': {
                'filename': data['filename'],
                'uploaded_at': new_report['uploaded_at']
            }}}
        )
        return new_report
