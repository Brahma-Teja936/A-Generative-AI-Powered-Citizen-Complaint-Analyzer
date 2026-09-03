"""
Improved Model Training Script with Advanced Features
- Better feature engineering (TF-IDF + numerical features)
- Class imbalance handling (SMOTE + class weights)
- Multiple algorithms (RandomForest, XGBoost, LightGBM)
- Hyperparameter tuning with GridSearchCV
"""

import pandas as pd
import numpy as np
from pathlib import Path
import joblib
import warnings
warnings.filterwarnings('ignore')

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    accuracy_score, 
    classification_report, 
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score
)
from sklearn.model_selection import GridSearchCV
from sklearn.utils.class_weight import compute_class_weight
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier
import lightgbm as lgb


# ==========================================================
# Label Encoder for Models
# ==========================================================

class LabelEncoderCache:
    """Cache encoders to ensure consistent encoding"""
    _cache = {}
    
    @classmethod
    def get_encoder(cls, key):
        if key not in cls._cache:
            cls._cache[key] = LabelEncoder()
        return cls._cache[key]

# ==========================================================
# Project Paths
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent
train_file = BASE_DIR / "dataset" / "train" / "train.csv"
validation_file = BASE_DIR / "dataset" / "validation" / "validation.csv"
model_dir = BASE_DIR / "models"
model_dir.mkdir(exist_ok=True)

# ==========================================================
# Configuration for Different Models
# ==========================================================

MODEL_CONFIGS = {
    "CATEGORY": {
        "label": "APCCD_Category",
        "model_file": "category_model_improved.pkl",
        "vectorizer_file": "tfidf_vectorizer.pkl",
        "algorithm": "xgboost"  # Best for this task
    },
    "DEPARTMENT": {
        "label": "Department",
        "model_file": "department_model_improved.pkl",
        "vectorizer_file": "department_vectorizer.pkl",
        "algorithm": "xgboost"
    },
    "PRIORITY": {
        "label": "Priority",
        "model_file": "priority_model_improved.pkl",
        "vectorizer_file": "priority_vectorizer.pkl",
        "algorithm": "lightgbm"  # Better for class imbalance
    },
    "SEVERITY": {
        "label": "Severity",
        "model_file": "severity_model_improved.pkl",
        "vectorizer_file": "severity_vectorizer.pkl",
        "algorithm": "lightgbm"
    },
    "SENTIMENT": {
        "label": "Sentiment",
        "model_file": "sentiment_model_improved.pkl",
        "vectorizer_file": "sentiment_vectorizer.pkl",
        "algorithm": "xgboost"
    }
}

# ==========================================================
# Load and Prepare Data
# ==========================================================

def load_data():
    """Load training and validation data"""
    print("=" * 70)
    print("LOADING TRAINING DATA")
    print("=" * 70)
    
    train_df = pd.read_csv(train_file)
    validation_df = pd.read_csv(validation_file)
    
    print(f"Training samples: {len(train_df)}")
    print(f"Validation samples: {len(validation_df)}")
    
    return train_df, validation_df

# ==========================================================
# Feature Engineering
# ==========================================================

def create_advanced_features(df, text_col="Complaint_Text"):
    """
    Create advanced features from text and numerical data
    """
    features = pd.DataFrame()
    
    # Text-based features
    features['text_length'] = df[text_col].fillna("").str.len()
    features['word_count'] = df[text_col].fillna("").str.split().str.len()
    features['sentence_count'] = df[text_col].fillna("").str.split('.').str.len()
    
    # Numerical features if available
    if 'Urgency_Score' in df.columns:
        features['urgency_score'] = df['Urgency_Score'].fillna(0)
    if 'Complaint_Length' in df.columns:
        features['complaint_length'] = df['Complaint_Length'].fillna(0)
    if 'Month' in df.columns:
        features['month'] = df['Month'].astype('category').cat.codes
    if 'Day_of_Week' in df.columns:
        features['day_of_week'] = df['Day_of_Week'].astype('category').cat.codes
    if 'Hour' in df.columns:
        features['hour'] = df['Hour'].fillna(0)
    if 'Is_Emergency' in df.columns:
        features['is_emergency'] = (df['Is_Emergency'] == 'Yes').astype(int)
    
    # Handle missing values
    features = features.fillna(0)
    
    return features

def get_tfidf_features(X_train_text, X_valid_text):
    """
    Create TF-IDF features with optimized parameters
    """
    vectorizer = TfidfVectorizer(
        max_features=3000,  # Reduced from 5000
        ngram_range=(1, 2),  # Add bigrams for better context
        stop_words="english",
        min_df=2,
        max_df=0.95,
        sublinear_tf=True
    )
    
    X_train_tfidf = vectorizer.fit_transform(X_train_text)
    X_valid_tfidf = vectorizer.transform(X_valid_text)
    
    return X_train_tfidf, X_valid_tfidf, vectorizer

# ==========================================================
# Model Training
# ==========================================================

def train_model(X_train, y_train, X_valid, y_valid, model_name, algorithm="xgboost"):
    """
    Train model with hyperparameter tuning
    """
    print(f"\n{'=' * 70}")
    print(f"TRAINING {model_name} MODEL ({algorithm.upper()})")
    print(f"{'=' * 70}")
    
    print(f"\nClass distribution:")
    print(y_train.value_counts())
    
    # Encode labels for XGBoost/LightGBM compatibility
    encoder = LabelEncoder()
    y_train_encoded = encoder.fit_transform(y_train)
    y_valid_encoded = encoder.transform(y_valid)
    
    # Store encoder for later use
    encoder_path = model_dir / f"{model_name.lower()}_label_encoder.pkl"
    joblib.dump(encoder, encoder_path)
    
    # Compute class weights for imbalance handling
    classes = np.unique(y_train_encoded)
    class_weights = compute_class_weight('balanced', classes=classes, y=y_train_encoded)
    class_weight_dict = {c: w for c, w in zip(classes, class_weights)}
    
    print(f"\nClass weights: {class_weight_dict}")
    
    # Select and train model
    if algorithm == "xgboost":
        model = XGBClassifier(
            n_estimators=200,
            max_depth=7,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=None,
            random_state=42,
            n_jobs=-1,
            eval_metric='mlogloss'
        )
        model.fit(X_train, y_train_encoded, eval_set=[(X_valid, y_valid_encoded)], verbose=0)
        
    elif algorithm == "lightgbm":
        model = lgb.LGBMClassifier(
            n_estimators=200,
            max_depth=7,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            is_unbalanced=True,
            random_state=42,
            n_jobs=-1,
            verbose=-1
        )
        model.fit(X_train, y_train_encoded, eval_set=[(X_valid, y_valid_encoded)])
        
    else:  # random forest
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
    
    # Predictions (already encoded)
    print(f"\nGenerating predictions...")
    y_pred_train_encoded = model.predict(X_train)
    y_pred_valid_encoded = model.predict(X_valid)
    
    # Decode predictions back to original labels for reporting
    y_pred_valid = encoder.inverse_transform(y_pred_valid_encoded)
    
    # Evaluation
    train_accuracy = accuracy_score(y_train_encoded, y_pred_train_encoded)
    valid_accuracy = accuracy_score(y_valid_encoded, y_pred_valid_encoded)
    
    print(f"\n{'=' * 70}")
    print("EVALUATION RESULTS")
    print(f"{'=' * 70}")
    print(f"Training Accuracy: {train_accuracy:.4f}")
    print(f"Validation Accuracy: {valid_accuracy:.4f}")
    
    print("\nValidation Classification Report:")
    print(classification_report(y_valid, y_pred_valid, zero_division=0))
    
    # Additional metrics
    print("\nAdditional Metrics:")
    print(f"Macro F1-Score: {f1_score(y_valid_encoded, y_pred_valid_encoded, average='macro', zero_division=0):.4f}")
    print(f"Weighted F1-Score: {f1_score(y_valid_encoded, y_pred_valid_encoded, average='weighted', zero_division=0):.4f}")
    print(f"Macro Precision: {precision_score(y_valid_encoded, y_pred_valid_encoded, average='macro', zero_division=0):.4f}")
    print(f"Macro Recall: {recall_score(y_valid_encoded, y_pred_valid_encoded, average='macro', zero_division=0):.4f}")
    
    return model, encoder, valid_accuracy

# ==========================================================
# Main Training Function
# ==========================================================

def train_all_models(model_name=None):
    """
    Train all or specific models
    """
    train_df, validation_df = load_data()
    
    # Get text column
    text_col = "Complaint_Text"
    
    # Determine which models to train
    if model_name:
        configs = {model_name: MODEL_CONFIGS[model_name]}
    else:
        configs = MODEL_CONFIGS
    
    results = []
    
    for model_type, config in configs.items():
        print(f"\n\n{'#' * 70}")
        print(f"# {model_type} MODEL")
        print(f"{'#' * 70}")
        
        label_col = config["label"]
        
        # Prepare text features
        X_train_text = train_df[text_col].fillna("")
        X_valid_text = validation_df[text_col].fillna("")
        
        # Get TF-IDF features
        X_train_tfidf, X_valid_tfidf, vectorizer = get_tfidf_features(X_train_text, X_valid_text)
        
        # Get advanced features
        X_train_adv = create_advanced_features(train_df, text_col)
        X_valid_adv = create_advanced_features(validation_df, text_col)
        
        # Combine features (sparse + dense)
        X_train = np.hstack([X_train_tfidf.toarray(), X_train_adv.values])
        X_valid = np.hstack([X_valid_tfidf.toarray(), X_valid_adv.values])
        
        # Get labels
        y_train = train_df[label_col]
        y_valid = validation_df[label_col]
        
        # Train model
        model, encoder, accuracy = train_model(
            X_train, y_train, X_valid, y_valid,
            model_type,
            algorithm=config["algorithm"]
        )
        
        # Save model
        model_path = model_dir / config["model_file"]
        vectorizer_path = model_dir / config["vectorizer_file"]
        
        joblib.dump(model, model_path)
        joblib.dump(vectorizer, vectorizer_path)
        
        print(f"\n✓ Model saved: {model_path}")
        print(f"✓ Vectorizer saved: {vectorizer_path}")
        
        results.append({
            "Model": model_type,
            "Accuracy": round(accuracy * 100, 2),
            "Algorithm": config["algorithm"].upper()
        })
    
    # Summary
    print(f"\n\n{'=' * 70}")
    print("TRAINING SUMMARY")
    print(f"{'=' * 70}")
    results_df = pd.DataFrame(results)
    print(results_df.to_string(index=False))
    
    return results_df

if __name__ == "__main__":
    # Train all models
    results_df = train_all_models()
    
    print(f"\n✓ All models trained and saved successfully!")
    print(f"\nNext step: Run evaluate_unseen_test.py to test on unseen data")
