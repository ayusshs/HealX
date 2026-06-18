import os
import sys

# Ensure backend root is in import path
sys.path.append(os.path.dirname(__file__))

from app import create_app

def run_verification_tests():
    print("==================================================")
    print("         HEALX V2.0 AI ARCHITECTURE VERIFIER      ")
    print("==================================================")
    
    app = create_app()
    with app.app_context():
        # 1. Test RAG Vector Store & Retriever
        print("\n[1/8] Verifying RAG Retriever...")
        from app.ai.rag.retriever import retriever
        query = "How can I book an appointment?"
        matches = retriever.retrieve(query, top_k=1)
        assert len(matches) > 0, "RAG Index should return at least one match"
        print(f" -> SUCCESS. Query: '{query}' -> Match: '{matches[0]['text'][:80]}...'")
        
        # 2. Test XGBoost Queue Wait Predictor
        print("\n[2/8] Verifying XGBoost Queue Predictor...")
        from app.ai.queue_predictor import queue_predictor
        wait_time = queue_predictor.predict(
            people_ahead=3, 
            department='ENT', 
            doctor_avg_time=8, 
            hour=10, 
            weekday=1
        )
        print(f" -> SUCCESS. XGBoost Wait time: {wait_time} minutes.")
        assert wait_time > 0, "Predicted wait time should be greater than zero."
        
        # 3. Test LightGBM Hospital Recommender
        print("\n[3/8] Verifying LightGBM Hospital Recommender...")
        from app.ai.recommendation_engine import recommendation_engine
        recs = recommendation_engine.recommend('ENT')
        assert len(recs) > 0, "Recommendation engine should rank hospitals"
        print(f" -> SUCCESS. Top Recommended Hospital: {recs[0]['name']} (AI Score: {recs[0]['ai_score']}/100)")
        
        # 4. Test RandomForest Disease Risk Classifier
        print("\n[4/8] Verifying Random Forest Disease Risk Predictor...")
        from app.ai.disease_predictor import disease_predictor
        risk = disease_predictor.predict(
            age=45, 
            bmi=28.4, 
            sys_bp=135, 
            sugar=105, 
            smoking=0, 
            exercise=1, 
            family_history=1
        )
        print(f" -> SUCCESS. Risk Level: {risk['risk_level']} (Confidence: {risk['confidence']*100:.0f}%, Source: {risk['source']})")
        assert risk['risk_level'] in ['Low Risk', 'Medium Risk', 'High Risk'], "Invalid risk level returned"
        
        # 5. Test Naive Bayes Feedback Sentiment Analyzer
        print("\n[5/8] Verifying Naive Bayes Feedback Analyzer...")
        from app.ai.feedback_analyzer import feedback_analyzer
        fb_res = feedback_analyzer.analyze("The doctor was extremely rude and the wait was long.")
        print(f" -> SUCCESS. Sentiment: {fb_res['sentiment']}, Topics: {fb_res['topics']}")
        assert fb_res['sentiment'] == 'negative', "Sentiment should be classified as negative"
        
        # 6. Test OCR & Report Analyzer
        print("\n[6/8] Verifying OCR & Report Analyzer Fallbacks...")
        from app.ai.report_analyzer import report_analyzer
        # We pass a dummy path that triggers the seeder fallback in the test
        report_doc = report_analyzer.analyze('blood_test_report.png', 'PAT-TEST001')
        print(f" -> SUCCESS. Extracted Report Text: '{report_doc['extracted_text'][:60]}...'")
        print(f" -> AI Summary:\n{report_doc['ai_summary'][:200]}...")
        assert report_doc['patient_id'] == 'PAT-TEST001', "Uploaded report should map to patient_id"
        
        # 7. Test Admin Analytics Insight Generator
        print("\n[7/8] Verifying Admin Analytics insights...")
        from app.ai.analytics_ai import analytics_ai
        insights = analytics_ai.generate_admin_insights('HOSP-001')
        print(f" -> SUCCESS. Insights count: {len(insights['insights'])}, Recommendations count: {len(insights['recommendations'])}")
        assert len(insights['insights']) > 0, "Should generate at least one dashboard insight"
        
        # 8. Test AI Intent Router
        print("\n[8/8] Verifying AI Chat Intent Router...")
        from app.ai.core.router import ai_router
        context = {'patient_id': 'PAT-TEST001'}
        r1 = ai_router.route(context, "What is my wait time?")
        print(f" -> Queue Query -> Intent: {r1['intent']}")
        assert r1['intent'] == 'queue_status', "Query should resolve to queue_status intent"
        
        r2 = ai_router.route(context, "Find the best Cardiology hospital")
        print(f" -> Recommendation Query -> Intent: {r2['intent']}")
        assert r2['intent'] == 'hospital_recommendation', "Query should resolve to hospital_recommendation intent"
        
        print("\n==================================================")
        print("          ALL AI/ML SYSTEMS VERIFIED!             ")
        print("==================================================")

if __name__ == '__main__':
    run_verification_tests()
