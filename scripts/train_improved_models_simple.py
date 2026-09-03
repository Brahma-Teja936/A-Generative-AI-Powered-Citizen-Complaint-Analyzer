"""
Simplified Improved Model Training - RandomForest with Advanced Features
Focuses on what works: RandomForest with class weights + advanced features
"""

import pandas as pd
import numpy as np
from pathlib import Path
import joblib
import warnings
warnings.filterwarnings('ignore')

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, 
    classification_report, 
    f1_score,
    precision_score,
    recall_score
)
from sklearn.utils.class_weight import compute_class_weight

# ==========================================================
# Project Paths
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent
train_file = BASE_DIR / "dataset" / "train" / "train.csv"
validation_file = BASE_DIR / "dataset" / "validation" / "validation.csv"
model_dir = BASE_DIR / "models"
model_dir.mkdir(exist_ok=True)

# ==========================================================
# Configuration
# ==========================================================

MODEL_CONFIGS = {
    "CATEGORY": {
        "label": "APCCD_Category",
        "model_file": "category_model_improved.pkl",
        "vectorizer_file": "tfidf_vectorizer.pkl",
    },
    "DEPARTMENT": {
        "label": "Department",
        "model_file": "department_model_improved.pkl",
        "vectorizer_file": "department_vectorizer.pkl",
    },
    "PRIORITY": {
        "label": "Priority",
        "model_file": "priority_model_improved.pkl",
        "vectorizer_file": "priority_vectorizer.pkl",
    },
    "SEVERITY": {
        "label": "Severity",
        "model_file": "severity_model_improved.pkl",
        "vectorizer_file": "severity_vectorizer.pkl",
    },
    "SENTIMENT": {
        "label": "Sentiment",
        "model_file": "sentiment_model_improved.pkl",
        "vectorizer_file": "sentiment_vectorizer.pkl",
    }
}

# ==========================================================
# Feature Engineering
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

def get_tfidf_features(X_train_text, X_valid_text):
    """Create TF-IDF features"""
    vectorizer = TfidfVectorizer(
        max_features=3000,
        ngram_range=(1, 2),
        stop_words="english",
        min_df=2,
        max_df=0.95,
        sublinear_tf=True
    )
    
    X_train_tfidf = vectorizer.fit_transform(X_train_text)
    X_valid_tfidf = vectorizer.transform(X_valid_text)
    
    return X_train_tfidf, X_valid_tfidf, vectorizer

# ==========================================================
# Main Training
# ==========================================================

def train_model(X_train, y_train, X_valid, y_valid, model_name):
    """Train RandomForest with class weights"""
    print(f"\n{'=' * 70}")
    print(f"TRAINING {model_name} MODEL")
    print(f"{'=' * 70}")
    
    print(f"\nClass distribution:")
    print(y_train.value_counts())
    
    # Encode labels
    encoder = LabelEncoder()
    y_train_encoded = encoder.fit_transform(y_train)
    y_valid_encoded = encoder.transform(y_valid)
    
    # Train RandomForest with class weights
    print(f"\nTraining RandomForest with class weights...")
    
    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train_encoded)
    
    # Predictions
    y_pred_train = model.predict(X_train)
    y_pred_valid = model.predict(X_valid)
    
    # Decode for reporting
    y_pred_valid_labels = encoder.inverse_transform(y_pred_valid)
    
    # Evaluation
    train_accuracy = accuracy_score(y_train_encoded, y_pred_train)
    valid_accuracy = accuracy_score(y_valid_encoded, y_pred_valid)
    
    print(f"\nTraining Accuracy: {train_accuracy:.4f}")
    print(f"Validation Accuracy: {valid_accuracy:.4f}")
    
    print("\nValidation Classification Report:")
    print(classification_report(y_valid, y_pred_valid_labels, zero_division=0))
    
    print("\nAdditional Metrics:")
    macro_f1 = f1_score(y_valid_encoded, y_pred_valid, average='macro', zero_division=0)
    weighted_f1 = f1_score(y_valid_encoded, y_pred_valid, average='weighted', zero_division=0)
    
    print(f"Macro F1-Score: {macro_f1:.4f}")
    print(f"Weighted F1-Score: {weighted_f1:.4f}")
    
    return model, encoder, valid_accuracy

# ==========================================================
# Main
# ==========================================================

def main():
    print("=" * 70)
    print("LOADING DATA")
    print("=" * 70)
    
    train_df = pd.read_csv(train_file)
    validation_df = pd.read_csv(validation_file)
    
    print(f"Training samples: {len(train_df)}")
    print(f"Validation samples: {len(validation_df)}")
    
    text_col = "Complaint_Text"
    
    # Get TF-IDF features
    X_train_tfidf, X_valid_tfidf, vectorizer = get_tfidf_features(
        train_df[text_col].fillna(""),
        validation_df[text_col].fillna("")
    )
    
    # Get advanced features
    X_train_adv = create_advanced_features(train_df, text_col)
    X_valid_adv = create_advanced_features(validation_df, text_col)
    
    # Combine
    X_train = np.hstack([X_train_tfidf.toarray(), X_train_adv.values])
    X_valid = np.hstack([X_valid_tfidf.toarray(), X_valid_adv.values])
    
    results = []
    
    for model_type, config in MODEL_CONFIGS.items():
        print(f"\n\n{'#' * 70}")
        print(f"# {model_type} MODEL")
        print(f"{'#' * 70}")
        
        label_col = config["label"]
        y_train = train_df[label_col]
        y_valid = validation_df[label_col]
        
        # Train
        model, encoder, accuracy = train_model(X_train, y_train, X_valid, y_valid, model_type)
        
        # Save
        model_path = model_dir / config["model_file"]
        encoder_path = model_dir / f"{model_type.lower()}_label_encoder.pkl"
        vectorizer_path = model_dir / config["vectorizer_file"]
        
        joblib.dump(model, model_path)
        joblib.dump(encoder, encoder_path)
        joblib.dump(vectorizer, vectorizer_path)
        
        print(f"\n✓ Model saved: {model_path}")
        print(f"✓ Encoder saved: {encoder_path}")
        
        results.append({
            "Model": model_type,
            "Accuracy": round(accuracy * 100, 2)
        })
    
    # Summary
    print(f"\n\n{'=' * 70}")
    print("TRAINING SUMMARY")
    print(f"{'=' * 70}")
    
    results_df = pd.DataFrame(results)
    print(results_df.to_string(index=False))
    
    print(f"\n✓ All models trained successfully!")
    print(f"✓ Next: Run evaluate_improved_models.py")

if __name__ == "__main__":
    main()
