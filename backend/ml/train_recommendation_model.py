import os
import joblib
import numpy as np
import pandas as pd
from lightgbm import LGBMRegressor
from sklearn.model_selection import train_test_split

def train_recommendation_predictor():
    print("Generating synthetic recommendation training data...")
    # Features: distance, rating, queue_length, crowd_level, doctor_experience, availability
    np.random.seed(42)
    num_samples = 1000
    
    distance = np.random.uniform(0.5, 25.0, num_samples) # km
    rating = np.random.uniform(3.0, 5.0, num_samples)    # 1-5 stars
    queue_length = np.random.randint(0, 30, num_samples) # people in queue
    crowd_level = np.random.randint(0, 4, num_samples)   # 0: Low, 1: Medium, 2: High, 3: Very High
    doctor_experience = np.random.uniform(2, 35, num_samples) # years
    availability = np.random.randint(0, 5, num_samples)   # active doctors in dept
    
    # Calculate suitability score (dependent target variable between 0 and 100)
    # Higher rating, experience, availability -> increases score
    # Higher distance, queue length, crowd level -> decreases score
    score = (
        (rating * 15) + 
        (doctor_experience * 0.8) + 
        (availability * 5) - 
        (distance * 1.5) - 
        (queue_length * 0.8) - 
        (crowd_level * 5)
    )
    
    # Normalize score between 0 and 100
    score = (score - score.min()) / (score.max() - score.min()) * 100.0
    # Add random noise
    score += np.random.normal(0, 3, num_samples)
    score = np.clip(score, 0.0, 100.0)
    
    df = pd.DataFrame({
        'distance': distance,
        'rating': rating,
        'queue_length': queue_length,
        'crowd_level': crowd_level,
        'doctor_experience': doctor_experience,
        'availability': availability,
        'suitability_score': score
    })
    
    X = df[['distance', 'rating', 'queue_length', 'crowd_level', 'doctor_experience', 'availability']]
    y = df['suitability_score']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training LightGBM Regressor...")
    model = LGBMRegressor(
        n_estimators=100, 
        learning_rate=0.05, 
        max_depth=4, 
        verbosity=-1, 
        random_state=42
    )
    model.fit(X_train, y_train)
    
    # Evaluation
    predictions = model.predict(X_test)
    rmse = np.sqrt(np.mean((y_test - predictions) ** 2))
    print(f"LightGBM model trained. RMSE suitability score: {rmse:.2f}")
    
    # Save model
    os.makedirs('trained_models', exist_ok=True)
    joblib.dump(model, 'trained_models/recommendation_model.joblib')
    print("Saved hospital recommendation model to trained_models/recommendation_model.joblib")
    return True

if __name__ == '__main__':
    train_recommendation_predictor()
