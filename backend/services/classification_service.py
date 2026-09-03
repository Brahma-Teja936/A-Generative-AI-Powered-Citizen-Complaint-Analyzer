import os
import sys
from pathlib import Path
import joblib

# Paths
SERVICE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SERVICE_DIR.parent
ML_DIR = BACKEND_DIR / "ml"
MODELS_DIR = ML_DIR / "models"

# Ensure ML package is in sys.path
if str(ML_DIR) not in sys.path:
    sys.path.append(str(ML_DIR))

from preprocessing import preprocess_text
from model_wrapper import XGBoostModelWrapper

class ClassificationService:
    def __init__(self):
        self.vectorizer = None
        self.dept_model = None
        self.sev_model = None
        self.pri_model = None
        self._load_models()

    def _load_models(self):
        try:
            vec_path = MODELS_DIR / "tfidf_vectorizer.pkl"
            dept_path = MODELS_DIR / "department_model.pkl"
            sev_path = MODELS_DIR / "severity_model.pkl"
            pri_path = MODELS_DIR / "priority_model.pkl"

            if vec_path.exists() and dept_path.exists() and sev_path.exists() and pri_path.exists():
                self.vectorizer = joblib.load(vec_path)
                self.dept_model = joblib.load(dept_path)
                self.sev_model = joblib.load(sev_path)
                self.pri_model = joblib.load(pri_path)
                print("[OK] CivicAI ML models & vectorizer loaded successfully.")
            else:
                print(f"[WARN] Some ML model files missing in {MODELS_DIR}. Retraining may be needed.")
        except Exception as e:
            print(f"[ERROR] Failed to load ML models: {e}")

    def apply_business_rules(self, text: str, dept: str, sev: str, pri: str, confidences: dict):
        """
        Business-rule validation layer:
        Refines predictions when safety risk or extreme urgency signals are detected.
        """
        text_lower = text.lower()

        # Immediate danger keywords -> CRITICAL / URGENT
        critical_risk_terms = [
            "sparking", "spark", "explosion", "fire", "live wire", "snapped wire",
            "electric shock", "hanging wire", "collapse", "collapsed", "caved in",
            "sinkhole", "toxic gas", "rabies", "rabid", "open manhole", "chemical waste",
            "falling into", "death trap", "suffocating", "deep trench"
        ]

        # High disruption keywords
        high_risk_terms = [
            "huge pothole", "massive crater", "broken bridge", "accident", "falling",
            "outbreak", "dengue", "cholera", "contaminated water", "no water for",
            "flood", "waterlogging", "blackout", "overflowing sewage", "burst pipe",
            "choked drain", "gridlock", "pileup"
        ]

        is_critical = any(term in text_lower for term in critical_risk_terms)
        is_high = any(term in text_lower for term in high_risk_terms)

        refined_sev = sev
        refined_pri = pri

        if is_critical:
            refined_sev = "CRITICAL"
            refined_pri = "URGENT"
            confidences["severity"] = max(confidences.get("severity", 0.8), 0.95)
            confidences["priority"] = max(confidences.get("priority", 0.8), 0.95)
        elif is_high and sev in ("LOW", "MEDIUM"):
            refined_sev = "HIGH"
            refined_pri = "HIGH"
            confidences["severity"] = max(confidences.get("severity", 0.8), 0.90)
            confidences["priority"] = max(confidences.get("priority", 0.8), 0.90)

        return refined_sev, refined_pri, confidences

    def classify_complaint(self, complaint_text: str) -> dict:
        """
        Executes end-to-end ML classification:
        Text -> Preprocessing -> TF-IDF -> XGBoost -> Business Rules -> Confidence Scores
        """
        if not complaint_text or not complaint_text.strip():
            return {
                "department": "Other",
                "severity": "LOW",
                "priority": "LOW",
                "confidence": {"department": 0.50, "severity": 0.50, "priority": 0.50}
            }

        cleaned = preprocess_text(complaint_text)

        # Fallback if text is completely stripped
        if not cleaned:
            cleaned = complaint_text.lower().strip()

        # Check if models are loaded
        if not self.vectorizer or not self.dept_model:
            self._load_models()

        if not self.vectorizer or not self.dept_model:
            # Fallback heuristic if models cannot be loaded
            return {
                "department": "Roads & Infrastructure",
                "severity": "MEDIUM",
                "priority": "MEDIUM",
                "confidence": {"department": 0.75, "severity": 0.75, "priority": 0.75}
            }

        # TF-IDF Vectorization
        features = self.vectorizer.transform([cleaned])

        # XGBoost Predictions
        dept = self.dept_model.predict(features)[0]
        sev = self.sev_model.predict(features)[0]
        pri = self.pri_model.predict(features)[0]

        # Probabilities / Confidences
        dept_probs = self.dept_model.predict_proba(features)[0]
        sev_probs = self.sev_model.predict_proba(features)[0]
        pri_probs = self.pri_model.predict_proba(features)[0]

        dept_conf = float(max(dept_probs))
        sev_conf = float(max(sev_probs))
        pri_conf = float(max(pri_probs))

        confidences = {
            "department": round(dept_conf, 2),
            "severity": round(sev_conf, 2),
            "priority": round(pri_conf, 2)
        }

        # Apply configurable business rules
        final_sev, final_pri, final_confs = self.apply_business_rules(
            complaint_text, dept, sev, pri, confidences
        )

        return {
            "department": dept,
            "severity": final_sev,
            "priority": final_pri,
            "confidence": final_confs
        }

# Global instance
classification_service = ClassificationService()
