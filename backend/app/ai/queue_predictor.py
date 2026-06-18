import os
import joblib
import pandas as pd

class QueuePredictor:
    def __init__(self, model_path=None):
        if model_path is None:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
            self.model_path = os.path.join(base_dir, 'trained_models', 'queue_model.joblib')
        else:
            self.model_path = model_path
        self.model_bundle = None
        self.load_model()
        
    def load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.model_bundle = joblib.load(self.model_path)
                print(f"Loaded queue wait time prediction model from {self.model_path}")
            except Exception as e:
                print(f"Failed to load queue model: {e}")
                self.model_bundle = None
                
    def predict(self, people_ahead, department, doctor_id='', hour=10, weekday=1, holiday=0, doctor_avg_time=10, emergency_cases=0):
        # Trigger reload if not loaded and file exists
        if not self.model_bundle:
            self.load_model()
            
        # Fallback prediction if model is not available
        fallback_prediction = people_ahead * doctor_avg_time + (emergency_cases * 15)
        
        if not self.model_bundle:
            return float(fallback_prediction)
            
        try:
            model = self.model_bundle['model']
            encoders = self.model_bundle['encoders']
            
            # Encode department
            dept_encoder = encoders.get('department')
            if dept_encoder and department in dept_encoder.classes_:
                dept_encoded = dept_encoder.transform([department])[0]
            else:
                dept_encoded = 0  # fallback index
                
            # Construct feature DataFrame matching feature names
            # Features: ['people_ahead', 'department', 'hour', 'weekday', 'holiday', 'emergency', 'doctor_average_time']
            input_df = pd.DataFrame([{
                'people_ahead': people_ahead,
                'department': dept_encoded,
                'hour': hour,
                'weekday': weekday,
                'holiday': holiday,
                'emergency': 1 if emergency_cases > 0 else 0,
                'doctor_average_time': doctor_avg_time
            }])
            
            prediction = model.predict(input_df)[0]
            return float(max(1.0, round(prediction, 2)))
        except Exception as e:
            print(f"Error running queue prediction inference: {e}. Falling back to default wait time.")
            return float(fallback_prediction)

# Single global instance
queue_predictor = QueuePredictor()
