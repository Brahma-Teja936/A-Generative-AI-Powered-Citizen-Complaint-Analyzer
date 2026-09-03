import pandas as pd
import joblib

from pathlib import Path


# ==========================================================
# PROJECT PATHS
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

test_file = (
    BASE_DIR / "test_dataset" / "unseen_test.csv"
)

models_dir = BASE_DIR / "models"


# ==========================================================
# LOAD TEST DATA
# ==========================================================

print("=" * 70)
print("DETAILED UNSEEN PREDICTION ANALYSIS")
print("=" * 70)

df = pd.read_csv(test_file)

X_test = df["Complaint_Text"].fillna("")


# ==========================================================
# MODEL CONFIGURATION
# ==========================================================

models = {

    "Category": {
        "model": "category_model.pkl",
        "vectorizer": "tfidf_vectorizer.pkl",
        "actual_column": "APCCD_Category"
    },

    "Department": {
        "model": "department_model.pkl",
        "vectorizer": "department_vectorizer.pkl",
        "actual_column": "Department"
    },

    "Priority": {
        "model": "priority_model.pkl",
        "vectorizer": "priority_vectorizer.pkl",
        "actual_column": "Priority"
    },

    "Severity": {
        "model": "severity_model.pkl",
        "vectorizer": "severity_vectorizer.pkl",
        "actual_column": "Severity"
    },

    "Sentiment": {
        "model": "sentiment_model.pkl",
        "vectorizer": "sentiment_vectorizer.pkl",
        "actual_column": "Sentiment"
    }

}


# ==========================================================
# CREATE RESULTS DATAFRAME
# ==========================================================

results_df = pd.DataFrame()

results_df["Complaint_Text"] = X_test


# ==========================================================
# PREDICT USING EACH MODEL
# ==========================================================

for name, config in models.items():

    print(f"\nAnalyzing {name} Model...")

    model_path = (
        models_dir / config["model"]
    )

    vectorizer_path = (
        models_dir / config["vectorizer"]
    )


    model = joblib.load(model_path)

    vectorizer = joblib.load(
        vectorizer_path
    )


    X_vector = vectorizer.transform(
        X_test
    )


    predictions = model.predict(
        X_vector
    )


    # Actual values
    results_df[f"Actual_{name}"] = (
        df[config["actual_column"]]
    )


    # Predicted values
    results_df[f"Predicted_{name}"] = (
        predictions
    )


    # Correct / Wrong
    results_df[f"{name}_Correct"] = (
        results_df[f"Actual_{name}"]
        ==
        results_df[f"Predicted_{name}"]
    )


# ==========================================================
# SAVE COMPLETE ANALYSIS
# ==========================================================

output_file = (
    BASE_DIR
    / "test_dataset"
    / "detailed_prediction_analysis.csv"
)


results_df.to_csv(
    output_file,
    index=False
)


# ==========================================================
# PRINT SUMMARY
# ==========================================================

print("\n" + "=" * 70)
print("MODEL ERROR SUMMARY")
print("=" * 70)


for name in models.keys():

    correct = results_df[
        f"{name}_Correct"
    ].sum()

    wrong = len(results_df) - correct


    print(f"\n{name}")

    print(f"Correct Predictions : {correct}")

    print(f"Wrong Predictions   : {wrong}")


print("\n" + "=" * 70)
print("ANALYSIS COMPLETE")
print("=" * 70)

print("\nDetailed results saved to:")

print(output_file)