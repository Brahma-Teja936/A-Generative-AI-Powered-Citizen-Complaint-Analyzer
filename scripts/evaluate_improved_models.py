"""
Evaluation script for improved models on unseen test dataset
"""
import pandas as pd
import joblib
import numpy as np
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    confusion_matrix
)

# ==========================================================
# PROJECT PATHS
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

test_file = BASE_DIR / "test_dataset" / "unseen_test.csv"
models_dir = BASE_DIR / "models"
results_file = BASE_DIR / "test_dataset" / "improved_test_results.csv"

# ==========================================================
# LOAD TEST DATASET
# ==========================================================

print("=" * 70)
print("EVALUATION ON UNSEEN TEST DATASET (IMPROVED MODELS)")
print("=" * 70)

df = pd.read_csv(test_file)
print(f"\nTotal unseen test complaints: {len(df)}")

X_test = df["Complaint_Text"].fillna("")

# ==========================================================
# MODEL CONFIGURATION
# ==========================================================

models = {
    "CATEGORY": {
        "model": "category_model_improved.pkl",
        "vectorizer": "tfidf_vectorizer.pkl",
        "label": "APCCD_Category"
    },
    "DEPARTMENT": {
        "model": "department_model_improved.pkl",
        "vectorizer": "department_vectorizer.pkl",
        "label": "Department"
    },
    "PRIORITY": {
        "model": "priority_model_improved.pkl",
        "vectorizer": "priority_vectorizer.pkl",
        "label": "Priority"
    },
    "SEVERITY": {
        "model": "severity_model_improved.pkl",
        "vectorizer": "severity_vectorizer.pkl",
        "label": "Severity"
    },
    "SENTIMENT": {
        "model": "sentiment_model_improved.pkl",
        "vectorizer": "sentiment_vectorizer.pkl",
        "label": "Sentiment"
    }
}

# ==========================================================
# HELPER FUNCTION FOR FEATURE ENGINEERING
# ==========================================================

def create_advanced_features(df, text_col="Complaint_Text"):
    """Create advanced features from text and numerical data"""
    features = pd.DataFrame()
    
    features['text_length'] = df[text_col].fillna("").str.len()
    features['word_count'] = df[text_col].fillna("").str.split().str.len()
    features['sentence_count'] = df[text_col].fillna("").str.split('.').str.len()
    
    if 'Urgency_Score' in df.columns:
        features['urgency_score'] = df['Urgency_Score'].fillna(0)
    if 'Complaint_Length' in df.columns:
        features['complaint_length'] = df['Complaint_Length'].fillna(0)
    if 'Month' in df.columns:
        features['month'] = pd.Categorical(df['Month']).codes
    if 'Day_of_Week' in df.columns:
        features['day_of_week'] = pd.Categorical(df['Day_of_Week']).codes
    if 'Hour' in df.columns:
        features['hour'] = df['Hour'].fillna(0)
    if 'Is_Emergency' in df.columns:
        features['is_emergency'] = (df['Is_Emergency'] == 'Yes').astype(int)
    
    features = features.fillna(0)
    return features

# ==========================================================
# STORE RESULTS
# ==========================================================

results = []

# ==========================================================
# EVALUATE EACH MODEL
# ==========================================================

for model_name, config in models.items():

    print("\n" + "=" * 70)
    print(f"{model_name} MODEL")
    print("=" * 70)

    # Load Model
    model_path = models_dir / config["model"]
    vectorizer_path = models_dir / config["vectorizer"]
    encoder_path = models_dir / f"{model_name.lower()}_label_encoder.pkl"

    if not model_path.exists():
        print(f"⚠ Model not found: {model_path}")
        print(f"  Using old model instead: {config['model'].replace('_improved', '')}")
        model_path = models_dir / config["model"].replace("_improved", "")

    if not vectorizer_path.exists():
        print(f"⚠ Vectorizer not found: {vectorizer_path}")
        continue

    print("\nLoading model...")

    model = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)
    
    # Load label encoder if it exists
    encoder = None
    if encoder_path.exists():
        encoder = joblib.load(encoder_path)
    
    # Transform Test Data - TF-IDF
    X_test_tfidf = vectorizer.transform(X_test)

    # Transform Test Data - Advanced Features
    X_test_adv = create_advanced_features(df, "Complaint_Text")

    # Combine features
    X_test_combined = np.hstack([X_test_tfidf.toarray(), X_test_adv.values])

    # Predict
    predictions_encoded = model.predict(X_test_combined)
    
    # Decode predictions if encoder exists
    if encoder is not None:
        predictions = encoder.inverse_transform(predictions_encoded)
    else:
        predictions = predictions_encoded

    y_true = df[config["label"]]

    # Accuracy
    accuracy = accuracy_score(y_true, predictions)

    print(f"\nAccuracy: {accuracy:.4f} ({accuracy * 100:.2f}%)")

    # Classification Report
    print("\nClassification Report:\n")
    print(classification_report(y_true, predictions, zero_division=0))

    # Additional Metrics
    print("\nAdditional Metrics:")
    macro_f1 = f1_score(y_true, predictions, average='macro', zero_division=0)
    weighted_f1 = f1_score(y_true, predictions, average='weighted', zero_division=0)
    macro_precision = precision_score(y_true, predictions, average='macro', zero_division=0)
    macro_recall = recall_score(y_true, predictions, average='macro', zero_division=0)
    
    print(f"Macro F1-Score: {macro_f1:.4f}")
    print(f"Weighted F1-Score: {weighted_f1:.4f}")
    print(f"Macro Precision: {macro_precision:.4f}")
    print(f"Macro Recall: {macro_recall:.4f}")

    # Save Result
    results.append({
        "Model": model_name,
        "Accuracy": round(accuracy * 100, 2),
        "Macro_F1": round(macro_f1, 4),
        "Weighted_F1": round(weighted_f1, 4),
        "Macro_Precision": round(macro_precision, 4),
        "Macro_Recall": round(macro_recall, 4)
    })

# ==========================================================
# FINAL SUMMARY
# ==========================================================

print("\n" + "=" * 70)
print("FINAL IMPROVED TEST RESULTS")
print("=" * 70)

results_df = pd.DataFrame(results)

print("\n")
print(results_df.to_string(index=False))

# Save results
results_df.to_csv(results_file, index=False)
print(f"\n✓ Results saved to: {results_file}")

# Comparison with old results
old_results_file = BASE_DIR / "test_dataset" / "unseen_test_results.csv"
if old_results_file.exists():
    old_results = pd.read_csv(old_results_file)
    print(f"\n{'=' * 70}")
    print("COMPARISON: IMPROVED vs OLD MODELS")
    print(f"{'=' * 70}\n")
    
    comparison = pd.DataFrame()
    comparison['Model'] = results_df['Model']
    comparison['Old_Accuracy'] = comparison['Model'].map(old_results.set_index('Model')['Accuracy'])
    comparison['New_Accuracy'] = results_df['Accuracy']
    comparison['Improvement'] = comparison['New_Accuracy'] - comparison['Old_Accuracy']
    
    print(comparison.to_string(index=False))

print("\n" + "=" * 70)
print("✓ EVALUATION COMPLETE")
print("=" * 70)
