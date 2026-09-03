import joblib
from pathlib import Path

# ==========================================================
# Project Paths
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_DIR = BASE_DIR / "models"

# ==========================================================
# Load Models
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

print("\nLoading TF-IDF Vectorizers...")

category_vectorizer = joblib.load(MODEL_DIR / "tfidf_vectorizer.pkl")
department_vectorizer = joblib.load(MODEL_DIR / "department_vectorizer.pkl")
priority_vectorizer = joblib.load(MODEL_DIR / "priority_vectorizer.pkl")
severity_vectorizer = joblib.load(MODEL_DIR / "severity_vectorizer.pkl")
sentiment_vectorizer = joblib.load(MODEL_DIR / "sentiment_vectorizer.pkl")

print("✓ Category Vectorizer Loaded")
print("✓ Department Vectorizer Loaded")
print("✓ Priority Vectorizer Loaded")
print("✓ Severity Vectorizer Loaded")
print("✓ Sentiment Vectorizer Loaded")

print("\nAll Models Loaded Successfully!")

# ==========================================================
# Prediction Function
# ==========================================================

def predict_complaint(complaint_text):

    # Convert to TF-IDF

    category_features = category_vectorizer.transform([complaint_text])
    department_features = department_vectorizer.transform([complaint_text])
    priority_features = priority_vectorizer.transform([complaint_text])
    severity_features = severity_vectorizer.transform([complaint_text])
    sentiment_features = sentiment_vectorizer.transform([complaint_text])

    # Predictions

    category = category_model.predict(category_features)[0]
    department = department_model.predict(department_features)[0]
    priority = priority_model.predict(priority_features)[0]
    severity = severity_model.predict(severity_features)[0]
    sentiment = sentiment_model.predict(sentiment_features)[0]

    return {
        "Category": category,
        "Department": department,
        "Priority": priority,
        "Severity": severity,
        "Sentiment": sentiment,
    }


# ==========================================================
# Main Program
# ==========================================================

print("\n" + "=" * 60)
print("APCCD-2026 AI Complaint Prediction System")
print("=" * 60)

while True:

    print("\nEnter Complaint (or type 'exit' to quit):\n")

    complaint = input("> ").strip()

    if complaint.lower() == "exit":
        print("\nThank you for using APCCD-2026 AI System.")
        break

    if complaint == "":
        print("\nPlease enter a valid complaint.")
        continue

    result = predict_complaint(complaint)

    print("\n" + "=" * 60)
    print("PREDICTION RESULT")
    print("=" * 60)

    print(f"\nComplaint : {complaint}")

    print(f"\nCategory   : {result['Category']}")
    print(f"Department : {result['Department']}")
    print(f"Priority   : {result['Priority']}")
    print(f"Severity   : {result['Severity']}")
    print(f"Sentiment  : {result['Sentiment']}")

    print("\n" + "-" * 60)