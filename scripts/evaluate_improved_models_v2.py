#!/usr/bin/env python3
"""
Evaluate improved models on unseen test dataset.
Uses same feature engineering as training.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib
import warnings

warnings.filterwarnings('ignore')

# ==========================================================
# PATHS AND DATA LOADING
# ==========================================================

project_root = Path(__file__).parent.parent
models_dir = project_root / "models"
data_dir = project_root / "test_dataset"

print("=" * 70)
print("EVALUATION ON UNSEEN TEST DATASET (IMPROVED MODELS)")
print("=" * 70)

# Load test data
test_path = data_dir / "unseen_test.csv"
df = pd.read_csv(test_path)

print(f"\nTotal unseen test complaints: {len(df)}")

# ==========================================================
# FEATURE ENGINEERING (MATCHES TRAINING)
# ==========================================================

def create_advanced_features(df, text_col="Complaint_Text"):
    """Create advanced features - MUST MATCH TRAINING - 9 features total"""
    features = pd.DataFrame()
    
    # 1-3: Text features (always available)
    features['text_length'] = df[text_col].fillna("").str.len()
    features['word_count'] = df[text_col].fillna("").str.split().str.len()
    features['sentence_count'] = df[text_col].fillna("").str.split('.').str.len()
    
    # 4: Urgency score
    if 'Urgency_Score' in df.columns:
        features['urgency_score'] = df['Urgency_Score'].fillna(0)
    else:
        features['urgency_score'] = 0
    
    # 5: Complaint length
    if 'Complaint_Length' in df.columns:
        features['complaint_length'] = df['Complaint_Length'].fillna(0)
    else:
        features['complaint_length'] = 0
    
    # 6: Month
    if 'Month' in df.columns:
        features['month'] = pd.Categorical(df['Month']).codes
    else:
        features['month'] = 0
    
    # 7: Day of week
    if 'Day_of_Week' in df.columns:
        features['day_of_week'] = pd.Categorical(df['Day_of_Week']).codes
    else:
        features['day_of_week'] = 0
    
    # 8: Hour
    if 'Hour' in df.columns:
        features['hour'] = df['Hour'].fillna(0)
    else:
        features['hour'] = 0
    
    # 9: Is emergency
    if 'Is_Emergency' in df.columns:
        features['is_emergency'] = (df['Is_Emergency'] == 'Yes').astype(int)
    else:
        features['is_emergency'] = 0
    
    features = features.fillna(0)
    return features

# ==========================================================
# LOAD PREVIOUS RESULTS FOR COMPARISON
# ==========================================================

old_results_path = data_dir / "unseen_test_results.csv"
old_results = None
if old_results_path.exists():
    old_results = pd.read_csv(old_results_path)
    print(f"\nLoaded baseline results from previous evaluation")

# ==========================================================
# MODEL CONFIGURATIONS
# ==========================================================

models = {
    "category": {
        "model": "category_model_improved.pkl",
        "vectorizer": "tfidf_vectorizer.pkl",
        "label": "APCCD_Category",
    },
    "department": {
        "model": "department_model_improved.pkl",
        "vectorizer": "department_vectorizer.pkl",
        "label": "Department",
    },
    "priority": {
        "model": "priority_model_improved.pkl",
        "vectorizer": "priority_vectorizer.pkl",
        "label": "Priority",
    },
    "severity": {
        "model": "severity_model_improved.pkl",
        "vectorizer": "severity_vectorizer.pkl",
        "label": "Severity",
    },
    "sentiment": {
        "model": "sentiment_model_improved.pkl",
        "vectorizer": "sentiment_vectorizer.pkl",
        "label": "Sentiment",
    },
}

results = []

# ==========================================================
# EVALUATE EACH MODEL
# ==========================================================

for model_name, config in models.items():

    print("\n" + "=" * 70)
    print(f"{model_name.upper()} MODEL")
    print("=" * 70)

    model_path = models_dir / config["model"]
    vectorizer_path = models_dir / config["vectorizer"]
    encoder_path = models_dir / f"{model_name}_label_encoder.pkl"

    # Check if model exists
    if not model_path.exists():
        print(f"⚠ Model not found: {model_path}")
        continue

    if not vectorizer_path.exists():
        print(f"⚠ Vectorizer not found: {vectorizer_path}")
        continue

    try:
        print(f"Loading model and vectorizer...")
        model = joblib.load(model_path)
        vectorizer = joblib.load(vectorizer_path)
        
        encoder = None
        if encoder_path.exists():
            encoder = joblib.load(encoder_path)
            print(f"Loading label encoder...")
        
        # Feature engineering - TF-IDF
        print(f"Generating TF-IDF features...")
        X_test_tfidf = vectorizer.transform(df["Complaint_Text"])
        print(f"  TF-IDF shape: {X_test_tfidf.shape}")
        
        # Feature engineering - Advanced
        print(f"Generating advanced features...")
        X_test_adv = create_advanced_features(df, "Complaint_Text")
        print(f"  Advanced features shape: {X_test_adv.shape}")
        
        # Combine
        X_test_combined = np.hstack([X_test_tfidf.toarray(), X_test_adv])
        print(f"  Combined features shape: {X_test_combined.shape}")
        
        # Predict
        print(f"Making predictions...")
        predictions_encoded = model.predict(X_test_combined)
        
        # Decode if needed
        if encoder is not None:
            predictions = encoder.inverse_transform(predictions_encoded)
        else:
            predictions = predictions_encoded

        # Get true labels
        y_true = df[config["label"]].values
        
        # Calculate accuracy
        accuracy = (predictions == y_true).mean()
        
        print(f"\nResults:")
        print(f"  Accuracy: {accuracy:.2%}")
        print(f"  Correct: {(predictions == y_true).sum()} / {len(df)}")
        
        # Compare with baseline if available
        if old_results is not None:
            old_accuracy = old_results[old_results['Model'] == model_name.capitalize()]['Accuracy'].values
            if len(old_accuracy) > 0:
                improvement = accuracy - old_accuracy[0]
                print(f"  Baseline: {old_accuracy[0]:.2%}")
                print(f"  Improvement: {improvement:+.2%}")
        
        # Store results
        result_row = {
            'Model': model_name.capitalize(),
            'Accuracy': accuracy,
            'Correct': (predictions == y_true).sum(),
            'Total': len(df),
        }
        results.append(result_row)
        
        # Show some examples
        print(f"\nSample predictions (first 5):")
        for i in range(min(5, len(df))):
            match = "✓" if predictions[i] == y_true[i] else "✗"
            print(f"  {match} Predicted: {predictions[i]}, True: {y_true[i]}")
            
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        continue

# ==========================================================
# SAVE RESULTS
# ==========================================================

if results:
    results_df = pd.DataFrame(results)
    output_path = data_dir / "improved_test_results.csv"
    results_df.to_csv(output_path, index=False)
    print(f"\n" + "=" * 70)
    print(f"SUMMARY")
    print("=" * 70)
    print(results_df.to_string(index=False))
    print(f"\nResults saved to: {output_path}")
else:
    print("\nNo results to save")
