import spacy
from anthropic import Anthropic
from app.config import Config

class AIService:
    def __init__(self):
        try:
            # We use small english model. If not installed, it falls back to basic keyword matching
            self.nlp = spacy.load("en_core_web_sm")
        except:
            self.nlp = None
            
        self.anthropic_client = Anthropic(api_key=Config.ANTHROPIC_API_KEY) if Config.ANTHROPIC_API_KEY else None

    def recommend_department(self, symptoms_text):
        if not symptoms_text:
            return "General"
            
        # Very simple fallback logic for demo if Spacy is complex to setup on the fly
        symptoms_text = symptoms_text.lower()
        if any(word in symptoms_text for word in ['heart', 'chest', 'bp', 'blood pressure']):
            return 'Cardiology'
        elif any(word in symptoms_text for word in ['ear', 'nose', 'throat', 'cough', 'cold']):
            return 'ENT'
        elif any(word in symptoms_text for word in ['tooth', 'teeth', 'gum', 'jaw']):
            return 'Dentist'
        elif any(word in symptoms_text for word in ['headache', 'brain', 'nerve', 'migraine']):
            return 'Neurology'
            
        return 'General'

    def get_chatbot_response(self, message):
        # Mock response to avoid API key errors as requested
        msg = message.lower()
        if any(word in msg for word in ['emergency', 'heart attack', 'stroke', 'pain', 'accident']):
            return "Call 108 immediately! This sounds like a medical emergency."
        elif any(word in msg for word in ['fever', 'cold', 'cough']):
            return "It seems you have mild symptoms. You can book an appointment with a General Physician."
        elif any(word in msg for word in ['headache', 'migraine']):
            return "For severe or recurring headaches, it's best to consult a Neurologist."
        else:
            return "I am the HealX AI assistant. I can help you identify which department to visit based on your symptoms."
            
ai_service = AIService()
