import re
from app.ai.memory.memory import chat_memory
from app.ai.llm.ollama_client import ollama_client
from app.ai.core.context_builder import ContextBuilder

# Lazy import agents to avoid circular dependencies
class AIRouter:
    def detect_intent(self, message):
        msg = message.lower()
        
        # 1. Appointment booking/scheduling
        if any(w in msg for w in ['book', 'schedule', 'appointment', 'reserve', 'slot']):
            return 'appointment'
            
        # 2. Queue prediction/waiting status
        if any(w in msg for w in ['queue', 'wait time', 'waiting', 'how long', 'my turn', 'people ahead']):
            return 'queue_status'
            
        # 3. Hospital recommendations
        if 'hospital' in msg and any(w in msg for w in ['find', 'best', 'recommend', 'near', 'good', 'which', 'list', 'search']):
            return 'hospital_recommendation'
        if 'recommend' in msg:
            return 'hospital_recommendation'

            
        # 4. Medical report analysis
        if any(w in msg for w in ['report', 'blood test', 'lab', 'prescription', 'mri', 'xray', 'x-ray']):
            return 'report_summary'
            
        # 5. Wallet check (medical history)
        if any(w in msg for w in ['wallet', 'my record', 'medicine', 'prescription', 'history', 'past visit', 'allergy']):
            return 'wallet_query'
            
        # Default: General symptom check / healthcare FAQ
        return 'medical_question'
        
    def route(self, patient_context, message):
        patient_id = patient_context.get('patient_id') if patient_context else None
        intent = self.detect_intent(message)
        
        # Load conversation memory
        history = chat_memory.get_chat_history(patient_id, limit=6)
        # Append latest message
        history.append({'role': 'user', 'content': message})
        
        # Fetch relevant DB stats & context
        patient_db_context = ContextBuilder.build_patient_context(patient_id)
        rag_context = ContextBuilder.build_rag_context(message)
        
        # Build base system prompt
        system_prompt = ContextBuilder.build_system_prompt()
        if patient_db_context:
            system_prompt += f"\n\n{patient_db_context}"
        if rag_context:
            system_prompt += f"\n\n{rag_context}"
            
        # Dispatch to agents
        response_text = ""
        try:
            if intent == 'appointment':
                from app.ai.agents.appointment_agent import appointment_agent
                response_text = appointment_agent.process(history, system_prompt, patient_id)
            elif intent == 'queue_status':
                from app.ai.agents.queue_agent import queue_agent
                response_text = queue_agent.process(history, system_prompt, patient_id)
            elif intent == 'hospital_recommendation':
                from app.ai.agents.hospital_agent import hospital_agent
                response_text = hospital_agent.process(history, system_prompt, patient_id)
            elif intent == 'report_summary':
                from app.ai.agents.report_agent import report_agent
                response_text = report_agent.process(history, system_prompt, patient_id)
            elif intent == 'wallet_query':
                from app.ai.agents.medical_agent import medical_agent
                response_text = medical_agent.process_wallet(history, system_prompt, patient_id)
            else:
                # medical_question
                from app.ai.agents.medical_agent import medical_agent
                response_text = medical_agent.process_question(history, system_prompt, patient_id)
        except Exception as e:
            print(f"Agent processing error: {e}. Falling back to default Ollama client.")
            response_text = ollama_client.chat(history, system_prompt=system_prompt)
            
        # Save response in memory
        chat_memory.add_chat_message(patient_id, 'user', message)
        chat_memory.add_chat_message(patient_id, 'assistant', response_text)
        
        return {
            'intent': intent,
            'response': response_text
        }

# Global singleton
ai_router = AIRouter()
