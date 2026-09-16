import os
import joblib
import numpy as np
from backend.config import Config
from backend.app.ml.preprocessor import preprocess_text

class MLPredictor:
    _instance = None

    def __init__(self):
        self.models_loaded = False
        self.tfidf = None
        self.models = {}
        self.label_encoders = {}
        self.model_version = "xgboost-v1.0"
        self.load_models()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = MLPredictor()
        return cls._instance

    def load_models(self):
        """Loads TF-IDF vectorizer and 6 target XGBoost models once into memory."""
        models_dir = Config.MODELS_DIR
        try:
            tfidf_path = os.path.join(models_dir, "tfidf_vectorizer.pkl")
            encoders_path = os.path.join(models_dir, "label_encoders.pkl")

            if not os.path.exists(tfidf_path) or not os.path.exists(encoders_path):
                print(f"[CivicAI ML] Models not yet generated in {models_dir}. Will use rule-based fallback until trained.")
                return

            self.tfidf = joblib.load(tfidf_path)
            self.label_encoders = joblib.load(encoders_path)

            targets = ["department", "category", "subcategory", "severity", "priority", "urgency"]
            for target in targets:
                model_path = os.path.join(models_dir, f"{target}_model.pkl")
                if os.path.exists(model_path):
                    self.models[target] = joblib.load(model_path)

            self.models_loaded = True
            print(f"[CivicAI ML] Successfully loaded TF-IDF and {len(self.models)} XGBoost models.")
        except Exception as e:
            print(f"[CivicAI ML Error] Failed loading models: {e}")
            self.models_loaded = False

    def predict(self, text: str) -> dict:
        """
        Executes TF-IDF feature extraction and XGBoost classification across 6 targets.
        Extracts genuine calibrated probabilities for confidence calculation.
        """
        clean = preprocess_text(text)
        if not clean:
            clean = "general civic complaint"

        if not self.models_loaded or self.tfidf is None:
            return self._heuristic_fallback(text)

        try:
            X_vec = self.tfidf.transform([clean])
            results = {}
            confidences = {}

            targets = ["department", "category", "subcategory", "severity", "priority", "urgency"]
            for target in targets:
                model = self.models.get(target)
                encoder = self.label_encoders.get(target)
                if model and encoder:
                    # Genuine probabilities from XGBoost predict_proba
                    probs = model.predict_proba(X_vec)[0]
                    best_idx = int(np.argmax(probs))
                    predicted_class = encoder.inverse_transform([best_idx])[0]
                    confidence_score = float(probs[best_idx])

                    results[target] = predicted_class
                    confidences[target] = round(confidence_score, 4)
                else:
                    results[target] = "Unknown"
                    confidences[target] = 0.5

            # Calculate overall confidence as harmonic mean or average of key targets
            primary_conf = (confidences.get("department", 0.5) + confidences.get("severity", 0.5) + confidences.get("priority", 0.5)) / 3.0
            overall_conf = round(primary_conf, 4)
            is_low_confidence = overall_conf < Config.AI_CONFIDENCE_THRESHOLD

            return {
                "department": results.get("department", "Public Health & Sanitation"),
                "category": results.get("category", "Sanitation & Hygiene"),
                "subcategory": results.get("subcategory", "General Civic Issue"),
                "severity": results.get("severity", "MEDIUM"),
                "priority": results.get("priority", "MEDIUM"),
                "urgency": results.get("urgency", "WITHIN 3 DAYS"),
                "confidence": overall_conf,
                "per_target_confidence": confidences,
                "is_low_confidence": is_low_confidence,
                "model_version": self.model_version,
                "prediction_source": "TF-IDF + XGBoost",
                "warning": "AI classification confidence is low. Manual review recommended." if is_low_confidence else None
            }
        except Exception as e:
            print(f"[CivicAI ML Predict Error] {e}. Falling back to rule-based analysis.")
            return self._heuristic_fallback(text)

    def _heuristic_fallback(self, text: str) -> dict:
        """Rule-based emergency and domain fallback if models are uninitialized."""
        t = text.lower()
        
        # Check emergency keywords
        is_critical = any(w in t for w in [
            "fire", "blast", "explosion", "11kv", "live wire", "cylinder", "sparking",
            "collapse", "trapped", "blood", "accident", "open manhole", "borewell", "మంటలు", "ఆగ్"
        ])
        
        if any(w in t for w in ["wire", "electricity", "transformer", "shock", "streetlight", "current", "కరెంట్"]):
            dept = "Electricity & Power"
            cat = "Power Infrastructure"
            subcat = "Live Wire Hazard" if is_critical else "Streetlight Outage"
        elif any(w in t for w in ["water", "pipe", "burst", "drainage", "sewage", "manhole", "నీరు", "మురికి"]):
            dept = "Water Supply & Sewerage"
            cat = "Water & Drainage"
            subcat = "Open Manhole" if is_critical else "Pipeline Burst"
        elif any(w in t for w in ["fire", "cylinder", "flame", "smoke", "గ్యాస్"]):
            dept = "Fire & Emergency Services"
            cat = "Fire & Disaster"
            subcat = "Building Fire" if is_critical else "Gas Leakage"
        elif any(w in t for w in ["garbage", "trash", "waste", "stagnant", "dengue", "mosquito", "చెత్త"]):
            dept = "Public Health & Sanitation"
            cat = "Sanitation & Hygiene"
            subcat = "Garbage Overflow"
        elif any(w in t for w in ["pothole", "road", "footpath", "divider", "గుంతలు", "సడక్"]):
            dept = "Roads & Infrastructure"
            cat = "Road Maintenance"
            subcat = "Potholes"
        else:
            dept = "Public Safety & Police"
            cat = "Civic Safety & Law"
            subcat = "General Safety Hazard"

        severity = "CRITICAL" if is_critical else ("HIGH" if "urgent" in t or "broken" in t else "MEDIUM")
        priority = "CRITICAL" if severity == "CRITICAL" else ("HIGH" if severity == "HIGH" else "MEDIUM")
        urgency = "IMMEDIATE" if severity == "CRITICAL" else "WITHIN 24 HOURS"

        return {
            "department": dept,
            "category": cat,
            "subcategory": subcat,
            "severity": severity,
            "priority": priority,
            "urgency": urgency,
            "confidence": 0.72 if is_critical else 0.60,
            "per_target_confidence": {"department": 0.70, "severity": 0.75, "priority": 0.70},
            "is_low_confidence": not is_critical,
            "model_version": "heuristic-fallback-v1.0",
            "prediction_source": "NLP Rule-Based Heuristic Fallback",
            "warning": "AI classification running in fallback mode."
        }
