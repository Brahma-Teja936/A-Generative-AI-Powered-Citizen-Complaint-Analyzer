import joblib
from pathlib import Path

# ==========================================================
# Project Paths
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_DIR = BASE_DIR / "models"

# ==========================================================
# Load Models (Only Once)
# ==========================================================

print("=" * 60)
print("Loading AI Models...")
print("=" * 60)

category_model = joblib.load(MODEL_DIR / "category_model.pkl")
department_model = joblib.load(MODEL_DIR / "department_model.pkl")
priority_model = joblib.load(MODEL_DIR / "priority_model.pkl")
severity_model = joblib.load(MODEL_DIR / "severity_model.pkl")
sentiment_model = joblib.load(MODEL_DIR / "sentiment_model.pkl")

print("✓ Category Model Loaded")
print("✓ Department Model Loaded")
print("✓ Priority Model Loaded")
print("✓ Severity Model Loaded")
print("✓ Sentiment Model Loaded")

# ==========================================================
# Load Vectorizers
# ==========================================================

category_vectorizer = joblib.load(MODEL_DIR / "tfidf_vectorizer.pkl")
department_vectorizer = joblib.load(MODEL_DIR / "department_vectorizer.pkl")
priority_vectorizer = joblib.load(MODEL_DIR / "priority_vectorizer.pkl")
severity_vectorizer = joblib.load(MODEL_DIR / "severity_vectorizer.pkl")
sentiment_vectorizer = joblib.load(MODEL_DIR / "sentiment_vectorizer.pkl")

print("✓ All Vectorizers Loaded Successfully")

# ==========================================================
# Prediction Function
# ==========================================================

def predict_complaint(complaint_text):
    """
    Predict Category, Department,
    Priority, Severity and Sentiment
    from Complaint Text.
    """

    # Convert Complaint into TF-IDF Features

    category_features = category_vectorizer.transform([complaint_text])
    department_features = department_vectorizer.transform([complaint_text])
    priority_features = priority_vectorizer.transform([complaint_text])
    severity_features = severity_vectorizer.transform([complaint_text])
    sentiment_features = sentiment_vectorizer.transform([complaint_text])

    # Make Predictions

    category = category_model.predict(category_features)[0]
    department = department_model.predict(department_features)[0]
    priority = priority_model.predict(priority_features)[0]
    severity = severity_model.predict(severity_features)[0]
    sentiment = sentiment_model.predict(sentiment_features)[0]

    # Return Result

    return {
        "Complaint": complaint_text,
        "Category": category,
        "Department": department,
        "Priority": priority,
        "Severity": severity,
        "Sentiment": sentiment
    }


# ==========================================================
# Testing (Optional)
# ==========================================================

if __name__ == "__main__":

    complaint = input("Enter Complaint:\n\n")

    result = predict_complaint(complaint)

    print("\nPrediction Result\n")

    for key, value in result.items():
        print(f"{key} : {value}")