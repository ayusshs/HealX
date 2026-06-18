import pickle
import os

# Dummy ML script as requested. 
# In a real scenario, this would train a scikit-learn model on past queue times.

def train_model():
    # Example model: a simple dictionary acting as model parameters
    # In reality, this could be a LinearRegression or RandomForest model
    model = {
        'ENT': 8,
        'Cardiology': 15,
        'General': 5,
        'Dentist': 20,
        'Neurology': 25
    }
    
    os.makedirs('ml_models', exist_ok=True)
    with open('ml_models/wait_time_model.pkl', 'wb') as f:
        pickle.dump(model, f)
        
    print("Dummy ML model trained and saved.")

if __name__ == '__main__':
    train_model()
