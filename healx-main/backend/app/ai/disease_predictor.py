import os
import joblib
import pandas as pd

class DiseasePredictor:
    def __init__(self, model_path=None):
        if model_path is None:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
            self.model_path = os.path.join(base_dir, 'trained_models', 'disease_risk_model.joblib')
        else:
            self.model_path = model_path
        self.model_bundle = None
        self.load_model()
        
    def load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.model_bundle = joblib.load(self.model_path)
                print(f"Loaded disease risk prediction model from {self.model_path}")
            except Exception as e:
                print(f"Failed to load disease risk model: {e}")
                self.model_bundle = None
                
    def predict(self, age, bmi, sys_bp, sugar, smoking, exercise, family_history):
        if not self.model_bundle:
            self.load_model()
            
        # Standard fallback if model is not available
        risk_score = (
            (age * 0.4) + 
            ((1 if bmi > 25.0 else 0) * 15) + 
            ((1 if sys_bp > 140 else 0) * 15) + 
            ((1 if sugar > 140 else 0) * 15) + 
            (smoking * 20) - 
            (exercise * 15) + 
            (family_history * 15)
        )
        
        fallback_level = 'Low Risk'
        fallback_conf = 0.90
        if risk_score >= 55:
            fallback_level = 'High Risk'
            fallback_conf = 0.75
        elif risk_score >= 30:
            fallback_level = 'Medium Risk'
            fallback_conf = 0.80
            
        if not self.model_bundle:
            return {
                'risk_level': fallback_level,
                'confidence': fallback_conf,
                'probabilities': {
                    'Low Risk': 0.6 if fallback_level == 'Low Risk' else 0.2,
                    'Medium Risk': 0.6 if fallback_level == 'Medium Risk' else 0.3,
                    'High Risk': 0.6 if fallback_level == 'High Risk' else 0.1
                },
                'source': 'Rule-Based Fallback'
            }
            
        try:
            model = self.model_bundle['model']
            
            input_df = pd.DataFrame([{
                'age': age,
                'bmi': bmi,
                'sys_bp': sys_bp,
                'sugar': sugar,
                'smoking': smoking,
                'exercise': exercise,
                'family_history': family_history
            }])
            
            # Predict class and probabilities
            pred_class = model.predict(input_df)[0]
            probs = model.predict_proba(input_df)[0]
            
            classes = ['Low Risk', 'Medium Risk', 'High Risk']
            result_level = classes[pred_class]
            confidence = float(probs[pred_class])
            
            return {
                'risk_level': result_level,
                'confidence': round(confidence, 2),
                'probabilities': {
                    classes[i]: round(float(probs[i]), 2) for i in range(len(classes))
                },
                'source': 'Random Forest Classifier'
            }
        except Exception as e:
            print(f"Error running disease risk inference: {e}")
            return {
                'risk_level': fallback_level,
                'confidence': fallback_conf,
                'probabilities': {},
                'source': 'Fallback on error'
            }

# Single global instance
disease_predictor = DiseasePredictor()
