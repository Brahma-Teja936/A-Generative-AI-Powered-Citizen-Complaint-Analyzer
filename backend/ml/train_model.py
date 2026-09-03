import os
import sys
from pathlib import Path
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
import xgboost as xgb

# Add backend and ml directories to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
ML_DIR = Path(__file__).resolve().parent
sys.path.append(str(ML_DIR))

from preprocessing import preprocess_text
from model_wrapper import XGBoostModelWrapper

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Paths
DATASET_PATH = ML_DIR / "dataset" / "complaints.csv"
MODELS_DIR = ML_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

def train_and_evaluate():
    print("=" * 70)
    print("CivicAI Machine Learning Pipeline - TF-IDF + XGBoost Training")
    print("=" * 70)
    
    if not DATASET_PATH.exists():
        print(f"Error: Dataset not found at {DATASET_PATH}")
        sys.exit(1)
        
    print(f"Loading dataset from: {DATASET_PATH}")
    df = pd.read_csv(DATASET_PATH)
    print(f"Total dataset records: {len(df)}")
    
    # 1. Clean Text using consistent preprocessing
    print("\n[Step 1/5] Preprocessing complaint text...")
    df['cleaned_text'] = df['complaint'].apply(preprocess_text)
    
    # Remove any empty cleaned text
    df = df[df['cleaned_text'].str.strip().str.len() > 0].reset_index(drop=True)
    print(f"Valid records after preprocessing: {len(df)}")
    
    # 2. Train / Test Split
    print("\n[Step 2/5] Splitting into Train (80%) and Test (20%) sets...")
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df['department'])
    print(f"Training samples: {len(train_df)} | Test samples: {len(test_df)}")
    
    # 3. Fit TF-IDF Vectorizer
    print("\n[Step 3/5] Fitting TF-IDF Vectorizer (max_features=5000, ngram_range=(1,2), min_df=2)...")
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        min_df=2,
        sublinear_tf=True
    )
    X_train = vectorizer.fit_transform(train_df['cleaned_text'])
    X_test = vectorizer.transform(test_df['cleaned_text'])
    print(f"TF-IDF feature vocabulary size: {X_train.shape[1]}")
    
    # Save TF-IDF Vectorizer
    vectorizer_path = MODELS_DIR / "tfidf_vectorizer.pkl"
    joblib.dump(vectorizer, vectorizer_path)
    print(f"[OK] Saved vectorizer to {vectorizer_path}")
    
    # 4. Train XGBoost Classifiers for Department, Severity, Priority
    targets = [
        ("department", "department_model.pkl"),
        ("severity", "severity_model.pkl"),
        ("priority", "priority_model.pkl")
    ]
    
    results = {}
    
    for target_name, model_filename in targets:
        print("\n" + "-" * 70)
        print(f"[Training] Model: {target_name.upper()} (XGBoost)")
        print("-" * 70)
        
        # Label encoding
        le = LabelEncoder()
        y_train = le.fit_transform(train_df[target_name])
        y_test = le.transform(test_df[target_name])
        
        num_classes = len(le.classes_)
        print(f"Classes ({num_classes}): {list(le.classes_)}")
        
        # XGBoost Classifier
        clf = xgb.XGBClassifier(
            n_estimators=120,
            learning_rate=0.1,
            max_depth=5,
            objective="multi:softprob" if num_classes > 2 else "binary:logistic",
            eval_metric="mlogloss" if num_classes > 2 else "logloss",
            random_state=42,
            n_jobs=-1
        )
        
        clf.fit(X_train, y_train)
        
        # Predictions & Probabilities
        y_pred = clf.predict(X_test)
        
        # Metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
        
        print(f"\nEvaluation Metrics for {target_name.upper()}:")
        print(f"  Accuracy  : {acc:.4f} ({acc*100:.2f}%)")
        print(f"  Precision : {prec:.4f} ({prec*100:.2f}%)")
        print(f"  Recall    : {rec:.4f} ({rec*100:.2f}%)")
        print(f"  F1 Score  : {f1:.4f} ({f1*100:.2f}%)")
        
        # Save wrapped model
        wrapped_model = XGBoostModelWrapper(clf, le)
        model_save_path = MODELS_DIR / model_filename
        joblib.dump(wrapped_model, model_save_path)
        print(f"[OK] Saved {target_name.upper()} model to {model_save_path}")
        
        results[target_name] = {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1
        }
    
    print("\n" + "=" * 70)
    print("SUMMARY OF MODEL EVALUATIONS:")
    print("=" * 70)
    for target, metrics in results.items():
        print(f"{target.upper():<15} | Acc: {metrics['accuracy']:.4f} | Prec: {metrics['precision']:.4f} | Rec: {metrics['recall']:.4f} | F1: {metrics['f1_score']:.4f}")
    print("=" * 70)
    print("All models and vectorizer successfully saved in:", MODELS_DIR)
    
    return results

if __name__ == "__main__":
    train_and_evaluate()
