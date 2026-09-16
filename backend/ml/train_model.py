import os
import sys
from pathlib import Path
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import xgboost as xgb

ML_DIR = Path(__file__).resolve().parent
sys.path.append(str(ML_DIR))

from preprocessing import preprocess_text
from model_wrapper import XGBoostModelWrapper

DATASET_PATH = ML_DIR / "dataset" / "complaints.csv"
MODELS_DIR = ML_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

def train_all_models():
    print("=" * 70)
    print("CivicAI ML Training Pipeline: TF-IDF + XGBoost Classifiers")
    print("=" * 70)

    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)
    print(f"Total dataset records: {len(df)}")

    # 1. Clean Text
    df['cleaned_text'] = df['complaint'].apply(preprocess_text)
    df = df[df['cleaned_text'].str.strip().str.len() > 0].reset_index(drop=True)
    print(f"Cleaned records: {len(df)}")

    # 2. Train / Test Split
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df['department'])
    print(f"Train samples: {len(train_df)}, Test samples: {len(test_df)}")

    # 3. Fit TF-IDF
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        min_df=2,
        sublinear_tf=True
    )
    X_train = vectorizer.fit_transform(train_df['cleaned_text'])
    X_test = vectorizer.transform(test_df['cleaned_text'])
    print(f"TF-IDF vocabulary: {X_train.shape[1]} features")

    # Save Vectorizer
    vectorizer_path = MODELS_DIR / "tfidf_vectorizer.pkl"
    joblib.dump(vectorizer, vectorizer_path)
    print(f"Saved TF-IDF Vectorizer -> {vectorizer_path}")

    # 4. Target models
    targets = [
        ("department", "department_model.pkl"),
        ("category", "category_model.pkl"),
        ("subcategory", "subcategory_model.pkl"),
        ("severity", "severity_model.pkl"),
        ("priority", "priority_model.pkl"),
        ("urgency", "urgency_model.pkl"),
    ]

    metrics_summary = {}

    for target_col, model_file in targets:
        print(f"\nTraining [{target_col.upper()}] with XGBoost...")
        le = LabelEncoder()
        y_train = le.fit_transform(train_df[target_col])
        y_test = le.transform(test_df[target_col])

        n_classes = len(le.classes_)
        clf = xgb.XGBClassifier(
            n_estimators=100,
            learning_rate=0.15,
            max_depth=5,
            objective="multi:softprob" if n_classes > 2 else "binary:logistic",
            eval_metric="mlogloss" if n_classes > 2 else "logloss",
            random_state=42,
            n_jobs=-1
        )
        clf.fit(X_train, y_train)

        y_pred = clf.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

        print(f"  Accuracy : {acc * 100:.2f}% | F1: {f1 * 100:.2f}% | Classes: {n_classes}")

        # Save wrapper
        wrapper = XGBoostModelWrapper(clf, le)
        joblib.dump(wrapper, MODELS_DIR / model_file)

        metrics_summary[target_col] = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "classes": list(le.classes_)
        }

    # Save training metrics metadata for transparency
    joblib.dump(metrics_summary, MODELS_DIR / "model_metrics.pkl")

    print("\n" + "=" * 70)
    print("ALL MODELS TRAINED AND SAVED SUCCESSFULLY")
    print("=" * 70)
    for col, m in metrics_summary.items():
        print(f"  {col:<15}: Acc={m['accuracy']*100:.1f}% | F1={m['f1_score']*100:.1f}%")

if __name__ == "__main__":
    train_all_models()
