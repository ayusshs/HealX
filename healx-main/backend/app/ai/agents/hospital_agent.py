from app.ai.llm.ollama_client import ollama_client
from app.ai.recommendation_engine import recommendation_engine

class HospitalAgent:
    def detect_dept(self, text):
        t = text.lower()
        if any(w in t for w in ['heart', 'cardio', 'bp', 'blood pressure', 'chest']):
            return 'Cardiology'
        elif any(w in t for w in ['ear', 'nose', 'throat', 'ent', 'cough', 'cold', 'sinus']):
            return 'ENT'
        elif any(w in t for w in ['tooth', 'teeth', 'dentist', 'dental', 'gum']):
            return 'Dentist'
        elif any(w in t for w in ['brain', 'neuro', 'headache', 'nerve', 'migraine']):
            return 'Neurology'
        elif any(w in t for w in ['cancer', 'oncology', 'tumor']):
            return 'Oncology'
        return 'General'
        
    def process(self, history, system_prompt, patient_id):
        # 1. Detect requested department from last message
        last_msg = history[-1]['content']
        department = self.detect_dept(last_msg)
        
        # 2. Get recommendations
        # Coordinates can be parsed if available, otherwise defaults
        recommendations = recommendation_engine.recommend(department)
        
        # 3. Format context string
        rec_context = f"\n\nLIGHTGBM ML RECOMMENDED HOSPITALS FOR DEPARTMENT '{department}':\n"
        for idx, rec in enumerate(recommendations[:3], 1):
            rec_context += (
                f"{idx}. {rec['name']} (Hospital ID: {rec['hospital_id']})\n"
                f"   - AI Suitability Score: {rec['ai_score']}/100\n"
                f"   - Distance: {rec['distance']} km\n"
                f"   - Current Queue Length: {rec['queue_length']} patients\n"
                f"   - Rating: {rec['rating']}/5\n"
                f"   - Avg Doctor Experience: {rec['avg_experience']} years\n"
                f"   - Available Doctors in Dept: {rec['available_doctors']}\n"
            )
            
        instruction = (
            f"\n\nINSTRUCTION: Recommend the best hospital for the patient. "
            f"Present the top hospitals and explicitly explain WHY you recommend the top choice "
            f"based on its AI score (distance, queue size, and experience). "
            f"Keep your tone helpful, professional, and clear."
        )
        
        return ollama_client.chat(history, system_prompt=system_prompt + rec_context + instruction)

# Single global instance
hospital_agent = HospitalAgent()
