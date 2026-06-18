import os
import sys
import joblib
import pandas as pd
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score

# Ensure backend root is in import path to access models/pymongo context
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils.dataset_generator import export_dataset_to_csv

def train_queue_predictor():
    print("Exporting datasets...")
    export_dataset_to_csv('datasets/queue_dataset.csv')
    
    if not os.path.exists('datasets/queue_dataset.csv'):
        print("Dataset not found!")
        return False
        
    df = pd.read_csv('datasets/queue_dataset.csv')
    
    # Preprocessing
    encoders = {}
    categorical_cols = ['hospital_id', 'department', 'doctor_id']
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
        
    # Feature columns: what features will be used?
    features = [
        'people_ahead', 'department', 'hour', 'weekday', 'holiday', 
        'emergency', 'doctor_average_time'
    ]
    target = 'actual_wait'
    
    X = df[features]
    y = df[target]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training XGBoost Regressor...")
    model = XGBRegressor(n_estimators=100, learning_rate=0.08, max_depth=5, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluation
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    
    print(f"Model trained. MAE: {mae:.2f} minutes. R2 Score: {r2:.2f}")
    
    # Save model and encoders
    os.makedirs('trained_models', exist_ok=True)
    model_bundle = {
        'model': model,
        'encoders': encoders,
        'features': features,
        'mae': mae
    }
    
    joblib.dump(model_bundle, 'trained_models/queue_model.joblib')
    print("Saved queue prediction model bundle to trained_models/queue_model.joblib")
    return True

if __name__ == '__main__':
    train_queue_predictor()
