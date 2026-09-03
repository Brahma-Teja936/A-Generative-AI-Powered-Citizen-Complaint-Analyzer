import pandas as pd
import joblib

from pathlib import Path

from sklearn.metrics import (
    accuracy_score,
    classification_report
)


# ==========================================================
# PROJECT PATHS
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

test_file = (
    BASE_DIR / "test_dataset" / "unseen_test.csv"
)

models_dir = BASE_DIR / "models"


# ==========================================================
# LOAD TEST DATASET
# ==========================================================

print("=" * 70)
print("EVALUATION ON UNSEEN TEST DATASET")
print("=" * 70)

df = pd.read_csv(test_file)

print(f"\nTotal unseen test complaints: {len(df)}")


X_test = df["Complaint_Text"].fillna("")


# ==========================================================
# MODEL CONFIGURATION
# ==========================================================

models = {

    "CATEGORY": {
        "model": "category_model.pkl",
        "vectorizer": "tfidf_vectorizer.pkl",
        "label": "APCCD_Category"
    },

    "DEPARTMENT": {
        "model": "department_model.pkl",
        "vectorizer": "department_vectorizer.pkl",
        "label": "Department"
    },

    "PRIORITY": {
        "model": "priority_model.pkl",
        "vectorizer": "priority_vectorizer.pkl",
        "label": "Priority"
    },

    "SEVERITY": {
        "model": "severity_model.pkl",
        "vectorizer": "severity_vectorizer.pkl",
        "label": "Severity"
    },

    "SENTIMENT": {
        "model": "sentiment_model.pkl",
        "vectorizer": "sentiment_vectorizer.pkl",
        "label": "Sentiment"
    }

}


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


    # ------------------------------------------------------
    # Load Model
    # ------------------------------------------------------

    model_path = models_dir / config["model"]

    vectorizer_path = (
        models_dir / config["vectorizer"]
    )


    print("\nLoading model...")

    model = joblib.load(model_path)

    vectorizer = joblib.load(
        vectorizer_path
    )


    # ------------------------------------------------------
    # Transform Test Data
    # ------------------------------------------------------

    X_test_vector = vectorizer.transform(
        X_test
    )


    # ------------------------------------------------------
    # Predict
    # ------------------------------------------------------

    predictions = model.predict(
        X_test_vector
    )


    y_true = df[config["label"]]


    # ------------------------------------------------------
    # Accuracy
    # ------------------------------------------------------

    accuracy = accuracy_score(
        y_true,
        predictions
    )


    print(
        f"\nAccuracy: {accuracy:.4f} "
        f"({accuracy * 100:.2f}%)"
    )


    # ------------------------------------------------------
    # Classification Report
    # ------------------------------------------------------

    print("\nClassification Report:\n")

    print(
        classification_report(
            y_true,
            predictions,
            zero_division=0
        )
    )


    # ------------------------------------------------------
    # Save Result
    # ------------------------------------------------------

    results.append({

        "Model": model_name,
        "Accuracy": round(
            accuracy * 100,
            2
        )

    })


# ==========================================================
# FINAL SUMMARY
# ==========================================================

print("\n" + "=" * 70)
print("FINAL UNSEEN TEST RESULTS")
print("=" * 70)

results_df = pd.DataFrame(results)

print("\n")

print(
    results_df.to_string(
        index=False
    )
)


# ==========================================================
# SAVE RESULTS
# ==========================================================

results_file = (
    BASE_DIR
    / "test_dataset"
    / "unseen_test_results.csv"
)

results_df.to_csv(
    results_file,
    index=False
)


print("\nResults saved to:")

print(results_file)


print("\n" + "=" * 70)
print("EVALUATION COMPLETE")
print("=" * 70)