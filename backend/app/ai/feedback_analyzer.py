import os
import joblib

class FeedbackAnalyzer:
    def __init__(self, model_path=None):
        if model_path is None:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
            self.model_path = os.path.join(base_dir, 'trained_models', 'feedback_sentiment_model.joblib')
        else:
            self.model_path = model_path
        self.pipeline = None
        self.load_model()
        
    def load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.pipeline = joblib.load(self.model_path)
                print(f"Loaded feedback sentiment model from {self.model_path}")
            except Exception as e:
                print(f"Failed to load feedback sentiment model: {e}")
                self.pipeline = None
                
    def analyze_sentiment(self, text):
        if not self.pipeline:
            self.load_model()
            
        if not self.pipeline:
            # Hardcoded dictionary fallback
            lower_text = text.lower()
            if any(w in lower_text for w in ['horrible', 'waste', 'bad', 'worst', 'rude', 'dirty', 'delay', 'wait']):
                return 'negative'
            elif any(w in lower_text for w in ['good', 'excellent', 'great', 'professional', 'clean', 'friendly']):
                return 'positive'
            return 'neutral'
            
        try:
            prediction = self.pipeline.predict([text])[0]
            return str(prediction)
        except Exception as e:
            print(f"Error predicting sentiment: {e}")
            return 'neutral'
            
    def extract_topics(self, text):
        lower_text = text.lower()
        topics = []
        
        if any(w in lower_text for w in ['wait', 'delay', 'time', 'queue', 'hour', 'waiting', 'slow']):
            topics.append('Waiting Time')
        if any(w in lower_text for w in ['doctor', 'dr.', 'physician', 'care', 'professional', 'rude', 'nurse', 'staff']):
            topics.append('Doctor Care')
        if any(w in lower_text for w in ['billing', 'charge', 'money', 'payment', 'cost', 'fee', 'price']):
            topics.append('Billing')
        if any(w in lower_text for w in ['clean', 'dirty', 'hygiene', 'dust', 'toilet', 'room', 'bed', 'hospital', 'clinic']):
            topics.append('Cleanliness')
            
        if not topics:
            topics.append('General')
            
        return topics
        
    def analyze(self, text):
        sentiment = self.analyze_sentiment(text)
        topics = self.extract_topics(text)
        return {
            'sentiment': sentiment,
            'topics': topics,
            'text': text
        }

# Single global instance
feedback_analyzer = FeedbackAnalyzer()
