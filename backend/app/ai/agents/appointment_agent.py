import re
from datetime import datetime
from app import mongo
from app.models.appointment import Appointment
from app.services.queue_service import QueueService
from app.ai.llm.ollama_client import ollama_client

class AppointmentAgent:
    def parse_booking_details(self, message):
        msg = message.lower()
        
        # 1. Parse department
        department = None
        if any(w in msg for w in ['ent', 'ear', 'nose', 'throat']):
            department = 'ENT'
        elif any(w in msg for w in ['cardio', 'heart', 'cardiology']):
            department = 'Cardiology'
        elif any(w in msg for w in ['dental', 'dentist', 'tooth', 'teeth']):
            department = 'Dentist'
        elif any(w in msg for w in ['neuro', 'brain', 'neurology']):
            department = 'Neurology'
        elif any(w in msg for w in ['oncology', 'cancer', 'tumor']):
            department = 'Oncology'
        elif any(w in msg for w in ['general', 'physician', 'fever', 'cold']):
            department = 'General'
            
        # 2. Parse hospital
        hospital_id = None
        if 'sum' in msg:
            hospital_id = 'HOSP-001'
        elif 'aiims' in msg:
            hospital_id = 'HOSP-002'
        elif 'capital' in msg:
            hospital_id = 'HOSP-003'
            
        # 3. Parse slot time
        slot_time = "10:00 AM - 11:00 AM" # default
        if 'morning' in msg or '9' in msg:
            slot_time = "09:00 AM - 10:00 AM"
        elif 'afternoon' in msg or '2' in msg:
            slot_time = "02:00 PM - 03:00 PM"
        elif 'evening' in msg or '4' in msg:
            slot_time = "04:00 PM - 05:00 PM"
            
        return department, hospital_id, slot_time

    def process(self, history, system_prompt, patient_id):
        last_msg = history[-1]['content']
        
        if not patient_id:
            return "Please log in first to book appointments."
            
        # Parse details
        department, hospital_id, slot_time = self.parse_booking_details(last_msg)
        
        # If both department and hospital are specified, execute booking
        if department and hospital_id:
            try:
                # 1. Check if patient already has an active pending appointment
                existing = mongo.db.appointments.find_one({
                    'patient_id': patient_id, 
                    'status': 'pending'
                })
                if existing:
                    return (
                        f"You already have an active appointment scheduled: "
                        f"{existing['department']} at {existing['hospital_id']} for slot {existing['slot_time']}. "
                        f"Please complete or cancel your current appointment before scheduling another."
                    )
                
                # 2. Assign queue number
                queue_info = QueueService.assign_queue_number(hospital_id, department)
                
                # 3. Create appointment
                appt_data = {
                    'patient_id': patient_id,
                    'hospital_id': hospital_id,
                    'department': department,
                    'slot_time': slot_time,
                    'queue_number': queue_info['queue_number'],
                    'wait_time_predicted': queue_info['predicted_wait'],
                    'status': 'pending',
                    'booked_at': datetime.utcnow()
                }
                
                appt = Appointment.create(appt_data)
                
                # Broadcast real-time SocketIO update
                try:
                    QueueService.broadcast_queue_update(hospital_id, department)
                except Exception:
                    pass
                    
                hosp_name = "SUM Hospital" if hospital_id == 'HOSP-001' else ("AIIMS Bhubaneswar" if hospital_id == 'HOSP-002' else "Capital Hospital")
                return (
                    f"✅ **Appointment Confirmed!**\n\n"
                    f"I have booked a **{department}** appointment for you at **{hosp_name}**.\n"
                    f"- **Booking ID**: {appt['booking_id']}\n"
                    f"- **Scheduled Slot**: {slot_time}\n"
                    f"- **Your Queue Number**: {queue_info['queue_number']}\n"
                    f"- **Estimated Waiting Time**: {queue_info['predicted_wait']} minutes\n\n"
                    f"You can view and track this appointment in real-time on your dashboard."
                )
            except Exception as e:
                print(f"Appointment agent scheduling error: {e}")
                return "I encountered an error trying to book your appointment. Please try again or use the Booking screen."
                
        # If information is missing, ask Ollama to guide the user on what details to specify
        prompt_instructions = (
            "\n\nINSTRUCTION: The patient wants to book an appointment but has not provided both the hospital and department.\n"
            "Offer them the following options in a clear, friendly format:\n"
            "- **SUM Hospital** (Cardiology, ENT, Dentist, Neurology, General)\n"
            "- **AIIMS Bhubaneswar** (Cardiology, ENT, Neurology, Oncology, General)\n"
            "- **Capital Hospital** (ENT, Dentist, General)\n"
            "Instruct them to type something like: *'Book Cardiology at SUM Hospital'* to complete the action."
        )
        
        return ollama_client.chat(history, system_prompt=system_prompt + prompt_instructions)

# Single global instance
appointment_agent = AppointmentAgent()
