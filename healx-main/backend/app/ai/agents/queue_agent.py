from datetime import datetime
from app import mongo
from app.models.queue import Queue
from app.ai.queue_predictor import queue_predictor
from app.ai.llm.ollama_client import ollama_client

class QueueAgent:
    def process(self, history, system_prompt, patient_id):
        if not patient_id:
            return "Please log in to check your active queue status."
            
        # Check active appointment
        appt = mongo.db.appointments.find_one({'patient_id': patient_id, 'status': 'pending'})
        if not appt:
            return (
                "You do not have any active upcoming appointments at the moment. "
                "If you would like to book one, just tell me: 'Book an ENT appointment tomorrow' "
                "or click the 'Book Appointment' screen in the side menu."
            )
            
        hosp_id = appt['hospital_id']
        dept = appt['department']
        my_queue = appt.get('queue_number', 1)
        
        # Get active queue status
        q = Queue.get_queue(hosp_id, dept)
        current_serving = q.get('current_serving', 0)
        avg_time = q.get('avg_time_per_patient', 10)
        
        people_ahead = max(0, my_queue - current_serving - 1)
        
        # Predict wait time using XGBoost
        predicted_wait = queue_predictor.predict(
            people_ahead=people_ahead,
            department=dept,
            hour=datetime.now().hour,
            weekday=datetime.now().weekday(),
            holiday=1 if datetime.now().weekday() in [5, 6] else 0,
            doctor_avg_time=avg_time
        )
        
        # Format context
        queue_context = (
            f"\n\nACTIVE QUEUE PREDICTION STATUS:\n"
            f"- Your Booking ID: {appt.get('booking_id')}\n"
            f"- Hospital ID: {hosp_id}\n"
            f"- Department: {dept}\n"
            f"- Your Queue Number: {my_queue}\n"
            f"- Current Serving Number: {current_serving}\n"
            f"- People Ahead of You: {people_ahead}\n"
            f"- XGBoost AI Predicted Waiting Time: {predicted_wait} minutes\n"
        )
        
        instruction = (
            "\n\nINSTRUCTION: Inform the patient about their queue standing in a natural, friendly manner. "
            "Report exactly how many patients are ahead of them and the XGBoost AI estimated waiting time (e.g. 18 minutes). "
            "Explain that this is based on historical clinic loads. Keep it clear."
        )
        
        return ollama_client.chat(history, system_prompt=system_prompt + queue_context + instruction)

# Single global instance
queue_agent = QueueAgent()
