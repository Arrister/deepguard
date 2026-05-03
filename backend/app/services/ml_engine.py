import joblib
import numpy as np
import pandas as pd
import os
from typing import Dict, Any

class MLEngine:
    def __init__(self):
        self.model = None
        self.encoders = None
        self.columns = None
        self.load_model()
    
    def load_model(self):
        """Load the trained model and encoders"""
        model_path = os.path.join(os.path.dirname(__file__), "../../ml_model/saved_models/rf_model.pkl")
        encoders_path = os.path.join(os.path.dirname(__file__), "../../ml_model/saved_models/encoders.pkl")
        columns_path = os.path.join(os.path.dirname(__file__), "../../ml_model/saved_models/columns.pkl")
        
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
            self.encoders = joblib.load(encoders_path)
            self.columns = joblib.load(columns_path)
            print("ML Model loaded successfully")
        else:
            print("Warning: Model not found. Please train the model first.")
    
    def predict(self, features: Dict[str, Any]) -> tuple[str, float]:
        """
        Predict if network traffic is normal or attack
        Returns: (prediction, confidence)
        """
        if self.model is None:
            return "Unknown", 0.0
        
        try:
            # Work on a copy to avoid modifying the original dictionary
            features_copy = features.copy()
            
            # Encode categorical features
            for col in ['protocol_type', 'service', 'flag']:
                if col in features_copy and col in self.encoders:
                    try:
                        features_copy[col] = self.encoders[col].transform([features_copy[col]])[0]
                    except:
                        features_copy[col] = 0  # Unknown category
            
            # Create feature vector in correct order
            feature_vector = [features_copy.get(col, 0) for col in self.columns]
            
            # Convert to DataFrame to avoid sklearn warning about missing feature names
            feature_df = pd.DataFrame([feature_vector], columns=self.columns)
            
            # Predict
            prediction = self.model.predict(feature_df)[0]
            probabilities = self.model.predict_proba(feature_df)[0]
            confidence = float(max(probabilities))
            
            result = "Normal" if prediction == 0 else "Attack"
            return result, confidence
        
        except Exception as e:
            print(f"Prediction error: {e}")
            return "Error", 0.0

# Global instance
ml_engine = MLEngine()
