import os
import requests

class OllamaClient:
    def __init__(self):
        # Allow customizing host and model through environment variables
        self.base_url = os.environ.get('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.default_model = os.environ.get('OLLAMA_MODEL', 'gemma3:4b')
        
    def is_connected(self):
        try:
            res = requests.get(f"{self.base_url}/api/tags", timeout=2)
            return res.status_code == 200
        except Exception:
            return False
            
    def chat(self, messages, system_prompt=None, model=None):
        model = model or self.default_model
        url = f"{self.base_url}/api/chat"
        
        formatted_messages = []
        if system_prompt:
            formatted_messages.append({'role': 'system', 'content': system_prompt})
            
        formatted_messages.extend(messages)
        
        payload = {
            'model': model,
            'messages': formatted_messages,
            'stream': False
        }
        
        try:
            response = requests.post(url, json=payload, timeout=120)
            if response.status_code == 200:
                data = response.json()
                return data.get('message', {}).get('content', '')
            else:
                print(f"Ollama API returned error status {response.status_code}: {response.text}")
                return self.get_fallback_response(messages[-1]['content'])
        except Exception as e:
            print(f"Ollama connection error: {e}. Running fallback reasoning.")
            return self.get_fallback_response(messages[-1]['content'])
            
    def get_fallback_response(self, user_message):
        """
        Fallback response generator if the local Ollama service is unavailable.
        Uses simple local rules to respond to common healthcare assistant topics.
        """
        msg = user_message.lower()
        if any(word in msg for word in ['emergency', 'heart attack', 'stroke', 'bleeding']):
            return "EMERGENCY: This sounds like a critical medical emergency. Please call 108 immediately or go to the nearest emergency department."
        elif any(word in msg for word in ['book', 'appointment', 'schedule', 'doctor']):
            return "You can schedule an appointment using the 'Book Appointment' screen in the side menu. Choose the hospital, department, and doctor, then pick an available slot."
        elif any(word in msg for word in ['wait', 'queue', 'delay', 'how long']):
            return "Based on historical average times, the wait time is estimated at 10 minutes per person ahead. You can view your active appointment details on the dashboard to see live queue updates."
        elif any(word in msg for word in ['fever', 'cold', 'flu', 'cough']):
            return "It seems you may have mild symptoms. We recommend booking an appointment with a General Physician for a checkup. Stay hydrated and get plenty of rest."
        else:
            return "I am the HealX AI assistant. I'm currently running in offline fallback mode because I couldn't connect to my local Ollama reasoning engine. I can still guide you to book appointments, check queues, or advise you on minor symptoms."

# Global singleton
ollama_client = OllamaClient()
