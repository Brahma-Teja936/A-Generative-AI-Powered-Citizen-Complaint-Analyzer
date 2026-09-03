import pandas as pd
from pathlib import Path
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# ==========================================================
# Project Paths
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

train_file = BASE_DIR / "dataset" / "train" / "train.csv"
validation_file = BASE_DIR / "dataset" / "validation" / "validation.csv"

model_dir = BASE_DIR / "models"
model_dir.mkdir(exist_ok=True)

model_file = model_dir / "severity_model.pkl"
vectorizer_file = model_dir / "severity_vectorizer.pkl"

# ==========================================================
# Load Dataset
# ==========================================================

print("=" * 60)
print("Loading Training Dataset...")
print("=" * 60)

train_df = pd.read_csv(train_file)
validation_df = pd.read_csv(validation_file)

print("Training Shape :", train_df.shape)
print("Validation Shape :", validation_df.shape)

# ==========================================================
# Prepare Features
# ==========================================================

X_train = train_df["Complaint_Text"].fillna("")
y_train = train_df["Severity"]

X_valid = validation_df["Complaint_Text"].fillna("")
y_valid = validation_df["Severity"]

# ==========================================================
# TF-IDF Vectorization
# ==========================================================

print("\nCreating TF-IDF Features...")

vectorizer = TfidfVectorizer(
    max_features=5000,
    stop_words="english"
)

X_train_vector = vectorizer.fit_transform(X_train)
X_valid_vector = vectorizer.transform(X_valid)

print("Vectorization Completed!")

# ==========================================================
# Train Model
# ==========================================================

print("\nTraining Severity Prediction Model...")

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train_vector, y_train)

print("Model Trained Successfully!")

# ==========================================================
# Prediction
# ==========================================================

print("\nPredicting Validation Data...")

predictions = model.predict(X_valid_vector)

# ==========================================================
# Evaluation
# ==========================================================

accuracy = accuracy_score(y_valid, predictions)

print("\n" + "=" * 60)
print("SEVERITY MODEL PERFORMANCE")
print("=" * 60)

print(f"\nAccuracy : {accuracy:.4f}")

print("\nClassification Report:\n")

print(classification_report(y_valid, predictions, zero_division=0))

# ==========================================================
# Save Model
# ==========================================================

joblib.dump(model, model_file)
joblib.dump(vectorizer, vectorizer_file)

print("\n" + "=" * 60)
print("Severity Model Saved Successfully!")
print("=" * 60)

print("\nSaved Files:")

print(model_file)
print(vectorizer_file)

print("\nDone.")