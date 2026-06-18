from app import mongo
from app.ai.rag.retriever import retriever

class ContextBuilder:
    @staticmethod
    def build_system_prompt():
        return (
            "You are HealX AI, a helpful, professional, and knowledgeable medical chatbot for the HealX healthcare platform.\n"
            "Here are your rules of engagement:\n"
            "1. NEVER provide a definitive diagnosis. Always clarify that your suggestions are informational estimates, not clinical diagnoses.\n"
            "2. Always advise consulting a qualified doctor or practitioner for urgent, severe, or worsening symptoms.\n"
            "3. If symptoms sound critical (chest pain radiating, severe breathing difficulties, sudden weakness/stroke, heavy bleeding), tell the user clearly to call 108 immediately.\n"
            "4. Recommend appropriate departments (e.g. Cardiology for chest pain/BP, ENT for ear/nose/throat/cough, Dentist for toothache, Neurology for severe headache/nerve issues, General Medicine for fever/cold).\n"
            "5. Use queue predictions from the ML service and hospital recommendations from the LightGBM engine when provided in the context.\n"
            "6. Answer questions about hospital hours, check-in policies, or billing based solely on the provided RAG context.\n"
            "7. Present reports and health data in simple, clear, empathetic language."
        )

    @staticmethod
    def build_patient_context(patient_id):
        if not patient_id:
            return ""
            
        patient = mongo.db.patients.find_one({'patient_id': patient_id})
        if not patient:
            return ""
            
        context_lines = [
            f"Logged-in Patient Details:",
            f"- Name: {patient.get('name')}",
            f"- Blood Group: {patient.get('bloodGroup', 'N/A')}",
            f"- Gender: {patient.get('gender', 'N/A')}",
            f"- Age/DOB: {patient.get('dob', 'N/A')}",
            f"- Current Medicines: {', '.join(patient.get('medicines', [])) or 'None recorded'}"
        ]
        
        # Get active appointment
        appt = mongo.db.appointments.find_one({'patient_id': patient_id, 'status': 'pending'})
        if appt:
            context_lines.append(
                f"- Active Upcoming Appointment:\n"
                f"  * Booking ID: {appt.get('booking_id')}\n"
                f"  * Hospital ID: {appt.get('hospital_id')}\n"
                f"  * Department: {appt.get('department')}\n"
                f"  * Queue Number: {appt.get('queue_number')}\n"
                f"  * Booking Slot: {appt.get('slot_time')}"
            )
            
        return "\n".join(context_lines)

    @staticmethod
    def build_rag_context(query):
        matches = retriever.retrieve(query, top_k=2)
        if not matches:
            return ""
            
        context_lines = ["Here is relevant documentation from the hospital knowledge base:"]
        for match in matches:
            context_lines.append(f"[{match['metadata'].get('source')}]: {match['text']}")
            
        return "\n\n".join(context_lines)
