from app import mongo
from app.ai.llm.ollama_client import ollama_client

class MedicalAgent:
    def process_question(self, history, system_prompt, patient_id):
        # General symptoms/FAQ reasoning
        # Append specific formatting helper instructions
        medical_instruction = (
            "\n\nINSTRUCTION: You are answering a general health query or medical FAQ. "
            "Ensure you suggest the correct department (Cardiology, ENT, Dentist, Neurology, or General Medicine) "
            "based on symptoms and recommend booking an appointment if symptoms persist. Never diagnose."
        )
        return ollama_client.chat(history, system_prompt=system_prompt + medical_instruction)
        
    def process_wallet(self, history, system_prompt, patient_id):
        if not patient_id:
            return "Please log in to view your medical wallet history."
            
        patient = mongo.db.patients.find_one({'patient_id': patient_id})
        if not patient:
            return "I could not locate your patient profile."
            
        # Compile patient data
        medicines = patient.get('medicines', [])
        appointments = list(mongo.db.appointments.find({'patient_id': patient_id}, {'_id': 0}).sort('booked_at', -1))
        reports = patient.get('reports', [])
        
        # Format a prompt section for Ollama
        wallet_context = (
            f"\n\nPATIENT MEDICAL WALLET RETRIEVAL:"
            f"\n- Medicines list: {', '.join(medicines) if medicines else 'None'}"
            f"\n- Total appointments booked: {len(appointments)}"
            f"\n- Reports on file: {len(reports)} files uploaded."
        )
        
        wallet_instruction = (
            "\n\nINSTRUCTION: Summarize the patient's medical wallet (medicines, past appointments, and reports) "
            "in a neat, comforting, and clear bullet-point layout. Keep it simple and easy to scan."
        )
        
        return ollama_client.chat(history, system_prompt=system_prompt + wallet_context + wallet_instruction)

# Single global instance
medical_agent = MedicalAgent()
