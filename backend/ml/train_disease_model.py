import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

def train_disease_risk_model():
    print("Generating synthetic disease risk training data...")
    np.random.seed(42)
    num_samples = 1000
    
    age = np.random.randint(18, 85, num_samples)
    bmi = np.random.uniform(15.0, 45.0, num_samples)
    sys_bp = np.random.randint(90, 180, num_samples)
    sugar = np.random.randint(70, 250, num_samples) # blood sugar (mg/dL)
    smoking = np.random.randint(0, 2, num_samples)
    exercise = np.random.randint(0, 2, num_samples)
    family_history = np.random.randint(0, 2, num_samples)
    
    # Simple risk rule to generate ground truth labels
    # High risk if old age + high bmi + high bp + high sugar etc.
    risk_score = (
        (age * 0.4) + 
        ((bmi > 25.0).astype(int) * 15) + 
        ((sys_bp > 140).astype(int) * 15) + 
        ((sugar > 140).astype(int) * 15) + 
        (smoking * 20) - 
        (exercise * 15) + 
        (family_history * 15)
    )
    
    # Classify: Low risk < 35, Medium risk 35-60, High risk > 60
    risk_level = []
    for s in risk_score:
        if s < 30:
            risk_level.append(0)  # Low
        elif s < 55:
            risk_level.append(1)  # Medium
        else:
            risk_level.append(2)  # High
            
    df = pd.DataFrame({
        'age': age,
        'bmi': bmi,
        'sys_bp': sys_bp,
        'sugar': sugar,
        'smoking': smoking,
        'exercise': exercise,
        'family_history': family_history,
        'risk_level': risk_level
    })
    
    features = ['age', 'bmi', 'sys_bp', 'sugar', 'smoking', 'exercise', 'family_history']
    X = df[features]
    y = df['risk_level']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    model.fit(X_train, y_train)
    
    predictions = model.predict(X_test)
    acc = accuracy_score(y_test, predictions)
    print(f"Disease risk model trained. Accuracy: {acc:.2%}")
    
    # Save model
    os.makedirs('trained_models', exist_ok=True)
    model_bundle = {
        'model': model,
        'features': features,
        'target_names': ['Low Risk', 'Medium Risk', 'High Risk']
    }
    joblib.dump(model_bundle, 'trained_models/disease_risk_model.joblib')
    print("Saved disease risk prediction model to trained_models/disease_risk_model.joblib")
    return True

if __name__ == '__main__':
    train_disease_risk_model()
