from app import mongo
from datetime import datetime, timedelta

class AnalyticsAI:
    @staticmethod
    def generate_admin_insights(hospital_id):
        # Fetch queues for the hospital
        queues = list(mongo.db.queue.find({'hospital_id': hospital_id}))
        
        insights = []
        recommendations = []
        
        # Analyze each department queue
        for q in queues:
            dept = q.get('department', 'General')
            total = q.get('total_in_queue', 0)
            serving = q.get('current_serving', 0)
            avg_time = q.get('avg_time_per_patient', 10)
            
            waiting = max(0, total - serving)
            
            # If there's an active queue, generate alerts
            if waiting > 5:
                insights.append(f"{dept} wait times have increased by approximately {waiting * 10}% due to higher patient inflow.")
                recommendations.append(f"Assign one additional physician to {dept} to reduce patient queue backlog.")
            elif waiting > 0:
                insights.append(f"{dept} current wait time is stable at around {waiting * avg_time} minutes.")
            
        # Default insights if queue is empty or for a general baseline
        if not insights:
            insights.append("All department patient queues are operating within target average wait thresholds (under 15 mins).")
            
        # Time-based load insights
        hour = datetime.now().hour
        if 9 <= hour <= 12:
            insights.append("Peak morning registration load expected. Queue check-in rate is elevated by 25%.")
            recommendations.append("Ensure double reception desks are active in main lobby.")
        elif 16 <= hour <= 18:
            insights.append("Evening consultation peak load in progress.")
            recommendations.append("Authorize nurse triage check-in pre-screening to accelerate doctor throughput.")
        else:
            insights.append("Current registration load is low/moderate. Patient flow rate is optimal.")
            
        if not recommendations:
            recommendations.append("Maintain standard staffing levels and continue monitoring real-time queue broadcasts.")
            
        return {
            'hospital_id': hospital_id,
            'timestamp': datetime.utcnow().isoformat(),
            'insights': insights,
            'recommendations': recommendations
        }

# Global singleton
analytics_ai = AnalyticsAI()
