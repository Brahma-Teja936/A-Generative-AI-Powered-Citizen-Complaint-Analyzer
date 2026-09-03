import joblib
from pathlib import Path

# ==========================================================
# Project Paths
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

model_file = BASE_DIR / "models" / "category_model.pkl"
vectorizer_file = BASE_DIR / "models" / "tfidf_vectorizer.pkl"

# ==========================================================
# Load Model
# ==========================================================

print("=" * 60)
print("Loading AI Model...")
print("=" * 60)

model = joblib.load(model_file)
vectorizer = joblib.load(vectorizer_file)

print("Model Loaded Successfully!")

# ==========================================================
# Prediction Loop
# ==========================================================

while True:

    print("\nEnter Complaint (type 'exit' to quit):")

    complaint = input("> ")

    if complaint.lower() == "exit":
        print("\nExiting...")
        break

    complaint_vector = vectorizer.transform([complaint])

    prediction = model.predict(complaint_vector)[0]

    print("\nPredicted Category :", prediction)