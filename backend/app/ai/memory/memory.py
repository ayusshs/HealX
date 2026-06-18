from datetime import datetime
from app import mongo

class ChatMemory:
    @staticmethod
    def get_chat_history(patient_id, limit=10):
        if not patient_id:
            return []
            
        history = mongo.db.chat_history.find_one({'patient_id': patient_id})
        if not history:
            return []
            
        # Return the last N messages
        messages = history.get('messages', [])
        return messages[-limit:]
        
    @staticmethod
    def add_chat_message(patient_id, role, content):
        if not patient_id:
            return
            
        timestamp = datetime.utcnow().isoformat()
        new_msg = {
            'role': role,
            'content': content,
            'timestamp': timestamp
        }
        
        mongo.db.chat_history.update_one(
            {'patient_id': patient_id},
            {
                '$push': {'messages': new_msg},
                '$set': {'last_updated': datetime.utcnow()}
            },
            upsert=True
        )
        
    @staticmethod
    def clear_chat_history(patient_id):
        if not patient_id:
            return
        mongo.db.chat_history.delete_one({'patient_id': patient_id})

# Single instance
chat_memory = ChatMemory()
