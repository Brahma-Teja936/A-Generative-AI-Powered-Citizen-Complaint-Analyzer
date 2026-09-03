import sys
from pathlib import Path
import joblib

ML_DIR = Path(__file__).resolve().parent
MODELS_DIR = ML_DIR / "models"
sys.path.append(str(ML_DIR))

from preprocessing import preprocess_text
from model_wrapper import XGBoostModelWrapper

# Load models and vectorizer
print("Loading CivicAI ML models...")
vectorizer = joblib.load(MODELS_DIR / "tfidf_vectorizer.pkl")
dept_model = joblib.load(MODELS_DIR / "department_model.pkl")
sev_model = joblib.load(MODELS_DIR / "severity_model.pkl")
pri_model = joblib.load(MODELS_DIR / "priority_model.pkl")
print("[OK] Models loaded.")

def predict(complaint_text: str):
    cleaned = preprocess_text(complaint_text)
    if not cleaned:
        return {
            "department": "Other",
            "severity": "LOW",
            "priority": "LOW",
            "confidence": {"department": 0.5, "severity": 0.5, "priority": 0.5}
        }
    
    vec = vectorizer.transform([cleaned])
    
    # Predictions
    dept = dept_model.predict(vec)[0]
    sev = sev_model.predict(vec)[0]
    pri = pri_model.predict(vec)[0]
    
    # Confidence probabilities
    dept_prob = float(max(dept_model.predict_proba(vec)[0]))
    sev_prob = float(max(sev_model.predict_proba(vec)[0]))
    pri_prob = float(max(pri_model.predict_proba(vec)[0]))
    
    return {
        "department": dept,
        "severity": sev,
        "priority": pri,
        "confidence": {
            "department": round(dept_prob, 2),
            "severity": round(sev_prob, 2),
            "priority": round(pri_prob, 2)
        }
    }

if __name__ == "__main__":
    test_text = "There is a huge pothole near the college entrance and vehicles are almost falling."
    res = predict(test_text)
    print("Test Input:", test_text)
    print("Prediction:", res)
