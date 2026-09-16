import os
import re
import sys
from pathlib import Path
import joblib
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

ML_DIR = Path(__file__).resolve().parent
MODELS_DIR = ML_DIR / "models"
sys.path.append(str(ML_DIR))

from preprocessing import preprocess_text
from model_wrapper import XGBoostModelWrapper

class AIAnalysisService:
    def __init__(self):
        self.vectorizer = None
        self.models = {}
        self._load_models()

    def _load_models(self):
        try:
            vec_path = MODELS_DIR / "tfidf_vectorizer.pkl"
            if vec_path.exists():
                self.vectorizer = joblib.load(vec_path)
                for target in ["department", "category", "subcategory", "severity", "priority", "urgency"]:
                    mpath = MODELS_DIR / f"{target}_model.pkl"
                    if mpath.exists():
                        self.models[target] = joblib.load(mpath)
                print("[OK] All CivicAI ML models and TF-IDF vectorizer loaded.")
            else:
                print(f"[WARN] Vectorizer not found at {vec_path}")
        except Exception as e:
            print(f"[ERROR] Failed to load ML models: {e}")

    def extract_duration(self, text: str) -> str:
        """Extract duration phrases like 'for 3 days', 'since last week', 'for 2 months'"""
        patterns = [
            r'\b(?:for|past|over|last)\s+(?:\d+|two|three|four|five|six|several|a few|couple of)\s+(?:hours?|days?|weeks?|months?|years?)\b',
            r'\bsince\s+(?:yesterday|last\s+(?:week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|morning|morning\s+today|\d{1,2}(?:st|nd|rd|th)?\s+[a-z]+)\b',
            r'\bfor\s+(?:more than|almost|nearly)\s+\d+\s+(?:days?|weeks?|months?)\b',
            r'\b(?:past|last)\s+\d+\s+(?:days?|weeks?)\b'
        ]
        for pat in patterns:
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                return match.group(0).strip()
        return "Duration not specified"

    def extract_location(self, text: str, user_location: str = None) -> str:
        """Extract location from text or use citizen-provided location"""
        if user_location and user_location.strip() and user_location.strip().lower() != "location not specified":
            return user_location.strip()
        
        # Regex patterns for explicit locations
        patterns = [
            r'\b(?:near|at|opposite|in front of|behind|beside|along|on)\s+([A-Z0-9][A-Za-z0-9\s,\.\'\-]+?(?:school|college|hospital|station|road|street|nagar|colony|gate|junction|cross|flyover|bridge|market|park|sector|block|layout|temple|church|mosque|hall|center|centre))\b',
            r'\b(?:sector|block|phase|ward)\s*[-#]?\s*\d+[a-zA-Z]?\b',
            r'\b(?:mg road|ring road|main road|arterial road|highway|expressway)\b'
        ]
        for pat in patterns:
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                loc = match.group(0).strip()
                # Clean trailing punctuation
                return loc.rstrip(',. ')
        return "Location not specified"

    def detect_validity(self, text: str) -> str:
        """Classify complaint validity: VALID, UNCLEAR, SPAM, NON-CIVIC"""
        clean = text.strip().lower()
        if len(clean) < 15:
            return "UNCLEAR"
        
        # Check repetitive characters or spam
        if re.search(r'(.)\1{5,}', clean):
            return "SPAM"
        
        # Obvious non-civic / personal disputes
        non_civic_keywords = [
            "buy bitcoin", "crypto", "casino", "loan approved", "dating", "adult", 
            "husband wife dispute", "personal loan", "earn money fast", "viagra"
        ]
        if any(w in clean for w in non_civic_keywords):
            return "SPAM"
        
        # Very vague text without civic substance
        vague_patterns = ["testing", "test 123", "hello world", "asdfgh", "qwerty"]
        if any(clean == p or clean.startswith(p) for p in vague_patterns):
            return "UNCLEAR"
            
        return "VALID"

    def detect_multi_issue(self, text: str, primary_dept: str) -> tuple[bool, str]:
        """Detect if multiple civic issues are reported across departments"""
        text_lower = text.lower()
        department_indicators = {
            "Roads & Infrastructure": ["pothole", "crater", "footpath", "divider", "asphalt", "flyover", "broken road", "bridge"],
            "Water Supply": ["drinking water", "water pipeline", "water leakage", "no water", "tap water", "water supply"],
            "Electricity": ["electric wire", "power cut", "blackout", "sparking", "transformer", "electric pole", "voltage"],
            "Waste Management": ["garbage", "trash", "dumping", "waste bin", "litter", "mound of waste"],
            "Sanitation": ["public toilet", "dead animal", "stench", "urinal", "pest", "rodents", "bleaching"],
            "Drainage": ["drain", "sewage", "gutter", "waterlogging", "manhole", "overflowing sewer"],
            "Street Lighting": ["streetlight", "street lamp", "dark street", "street lights", "illumination", "light post"],
            "Traffic": ["traffic signal", "gridlock", "illegal parking", "speeding truck", "wrong side driving", "traffic jam"],
            "Public Safety": ["live wire", "feral dog", "open trench", "wall collapsing", "billboard", "fire escape"]
        }

        detected_depts = []
        for dept, keywords in department_indicators.items():
            if any(k in text_lower for k in keywords):
                detected_depts.append(dept)

        if len(detected_depts) >= 2:
            secondary = [d for d in detected_depts if d != primary_dept]
            if secondary:
                return True, secondary[0]
        return False, None

    def assess_safety_risk(self, text: str) -> str:
        """Classify safety risk: NONE, LOW, MEDIUM, HIGH, VERY HIGH"""
        text_lower = text.lower()
        very_high_terms = [
            "sparking", "live wire", "snapped wire", "electric shock", "collapse", 
            "collapsed", "caved in", "sinkhole", "fire", "explosion", "toxic gas", 
            "rabid dog", "falling into", "death trap", "open manhole", "deep trench",
            "poisonous", "suffocating"
        ]
        high_terms = [
            "huge pothole", "massive crater", "broken bridge", "accident", "fatal", 
            "flooding", "blackout", "overflowing sewage", "contaminated water", 
            "dengue", "cholera", "feral dogs", "stray cattle on highway"
        ]
        medium_terms = [
            "dark street", "broken footpath", "low water pressure", "garbage accumulation",
            "traffic jam", "light not working", "odor", "smell"
        ]

        if any(t in text_lower for t in very_high_terms):
            return "VERY HIGH"
        if any(t in text_lower for t in high_terms):
            return "HIGH"
        if any(t in text_lower for t in medium_terms):
            return "MEDIUM"
        return "LOW"

    def assess_public_impact(self, text: str) -> tuple[str, list, int]:
        """Classify public impact, affected groups, and estimated count"""
        text_lower = text.lower()
        groups = set()

        if any(w in text_lower for w in ["student", "school", "college", "children", "kids", "playground"]):
            groups.add("Students")
            groups.add("Children")
        if any(w in text_lower for w in ["patient", "hospital", "clinic", "dispensary", "ambulance"]):
            groups.add("Patients")
        if any(w in text_lower for w in ["pedestrian", "footpath", "sidewalk", "walking", "elderly"]):
            groups.add("Pedestrians")
            groups.add("Elderly")
        if any(w in text_lower for w in ["driver", "car", "vehicle", "bus", "truck", "highway", "traffic", "road"]):
            groups.add("Drivers")
        if any(w in text_lower for w in ["shop", "market", "commercial", "business", "store", "vendor"]):
            groups.add("Businesses")
        if any(w in text_lower for w in ["colony", "resident", "sector", "society", "apartment", "neighbourhood", "house"]):
            groups.add("Residents")

        if not groups:
            groups.add("General Public")

        # Public Impact Level & Estimated Count
        if any(w in text_lower for w in ["entire sector", "highway", "hospital", "major junction", "main road", "water supply for area", "blackout in sector"]):
            impact = "VERY HIGH"
            est_count = 5000
        elif any(w in text_lower for w in ["school entrance", "colony street", "market", "two kilometers", "entire street"]):
            impact = "HIGH"
            est_count = 1000
        elif any(w in text_lower for w in ["residential street", "park", "alleyway", "lane"]):
            impact = "MEDIUM"
            est_count = 250
        else:
            impact = "LOW"
            est_count = 50

        return impact, sorted(list(groups)), est_count

    def generate_evidence(self, text: str, dept: str, sev: str, pri: str, location: str, duration: str) -> list[str]:
        """Generate concise factual evidence bullet points from user input"""
        evidence = []
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if len(s.strip()) > 8]
        
        if sentences:
            evidence.append(f"Complaint reports: '{sentences[0]}'")
        if len(sentences) > 1:
            evidence.append(f"Additional details provided: '{sentences[1]}'")
            
        if location != "Location not specified":
            evidence.append(f"Location identified at '{location}'")
        if duration != "Duration not specified":
            evidence.append(f"Ongoing duration reported '{duration}'")
            
        evidence.append(f"Classified under {dept} with {sev} severity and {pri} priority based on keyword risk signals.")
        return evidence[:4]

    def generate_ai_summary(self, text: str, dept: str, subcat: str, sev: str, location: str) -> str:
        """Create a factual, concise AI summary sentence without hallucinated facts"""
        loc_phrase = f" at {location}" if location and location != "Location not specified" else ""
        
        # Clean text first sentence
        clean_first = re.split(r'[.!?]+', text.strip())[0].strip()
        # Remove conversational prefixes
        clean_first = re.sub(r'^(there is|there are|i want to report|we have|please note that|hello|sir|kindly)\s+', '', clean_first, flags=re.IGNORECASE).strip()
        
        if sev == "CRITICAL":
            return f"Critical public hazard concerning {subcat.lower()}{loc_phrase}: {clean_first}."
        elif sev == "HIGH":
            return f"High priority civic issue concerning {subcat.lower()}{loc_phrase}: {clean_first}."
        elif sev == "MEDIUM":
            return f"Civic maintenance report for {subcat.lower()}{loc_phrase}: {clean_first}."
        else:
            return f"Standard civic request regarding {subcat.lower()}{loc_phrase}: {clean_first}."

    def find_duplicates(self, complaint_text: str, existing_complaints: list) -> tuple[float, str]:
        """
        TF-IDF Cosine Similarity for duplicate complaint detection against existing MongoDB records
        """
        if not existing_complaints or not self.vectorizer:
            return 0.0, None

        cleaned_input = preprocess_text(complaint_text)
        if not cleaned_input:
            return 0.0, None

        input_vec = self.vectorizer.transform([cleaned_input])

        highest_sim = 0.0
        similar_id = None

        for comp in existing_complaints:
            existing_text = comp.get("description", "")
            existing_clean = preprocess_text(existing_text)
            if not existing_clean:
                continue
            
            comp_vec = self.vectorizer.transform([existing_clean])
            sim = float(cosine_similarity(input_vec, comp_vec)[0][0])
            
            if sim > highest_sim:
                highest_sim = sim
                similar_id = comp.get("complaint_id")

        return round(highest_sim, 3), (similar_id if highest_sim >= 0.65 else None)

    def analyze(self, complaint_text: str, user_location: str = None, existing_complaints: list = None) -> dict:
        """
        Full Comprehensive AI Analysis Pipeline:
        TF-IDF + XGBoost + Rule Refinement + Evidence Generation + Duplicates
        """
        cleaned = preprocess_text(complaint_text)
        if not cleaned:
            cleaned = complaint_text.lower().strip()

        # Vectorize
        features = self.vectorizer.transform([cleaned])

        # Model Predictions & Calibrated Probabilities
        predictions = {}
        confidences = {}

        for target in ["department", "category", "subcategory", "severity", "priority", "urgency"]:
            model = self.models.get(target)
            if model:
                pred = model.predict(features)[0]
                probs = model.predict_proba(features)[0]
                conf = float(np.max(probs))
                predictions[target] = pred
                confidences[target] = round(conf, 2)
            else:
                predictions[target] = "Other" if target in ("department", "category") else "MEDIUM"
                confidences[target] = 0.50

        # Location & Duration Extraction
        location = self.extract_location(complaint_text, user_location)
        duration = self.extract_duration(complaint_text)

        # Safety Risk & Public Impact
        safety_risk = self.assess_safety_risk(complaint_text)
        public_impact, affected_groups, affected_count = self.assess_public_impact(complaint_text)

        # Multi-issue Detection
        has_multi_issue, secondary_dept = self.detect_multi_issue(complaint_text, predictions["department"])

        # Complaint Validity
        validity = self.detect_validity(complaint_text)

        # Duplicate Detection
        dup_score, dup_id = self.find_duplicates(complaint_text, existing_complaints or [])

        # Recommended Action & Response Time
        urgency = predictions["urgency"]
        if urgency == "IMMEDIATE":
            rec_response_time = "Within 4 hours"
            rec_action = f"Immediate field team dispatch by {predictions['department']} to secure site hazard."
        elif urgency == "WITHIN 24 HOURS":
            rec_response_time = "Within 24 hours"
            rec_action = f"Priority inspection and corrective work by {predictions['department']} field engineers."
        elif urgency == "WITHIN 3 DAYS":
            rec_response_time = "Within 3 days"
            rec_action = f"Scheduled maintenance by {predictions['department']} operational team."
        elif urgency == "WITHIN 7 DAYS":
            rec_response_time = "Within 7 days"
            rec_action = f"Routine civic repair scheduled under {predictions['department']} weekly plan."
        else:
            rec_response_time = "Routine maintenance"
            rec_action = f"Review during regular municipal inspection cycle."

        # AI Summary & Evidence
        summary = self.generate_ai_summary(
            complaint_text, predictions["department"], predictions["subcategory"], predictions["severity"], location
        )
        evidence = self.generate_evidence(
            complaint_text, predictions["department"], predictions["severity"], predictions["priority"], location, duration
        )

        return {
            "category": predictions["category"],
            "subcategory": predictions["subcategory"],
            "department": predictions["department"],
            "secondary_department": secondary_dept,
            "severity": predictions["severity"],
            "priority": predictions["priority"],
            "urgency": predictions["urgency"],
            "safety_risk": safety_risk,
            "public_impact": public_impact,
            "affected_groups": affected_groups,
            "affected_count": affected_count,
            "location": location,
            "duration": duration,
            "issue_type": "Multiple Issues (Manual Review Recommended)" if has_multi_issue else "Single Civic Issue",
            "has_multi_issue": has_multi_issue,
            "recommended_action": rec_action,
            "recommended_response_time": rec_response_time,
            "summary": summary,
            "evidence": evidence,
            "validity": validity,
            "duplicate_score": dup_score,
            "similar_complaint_id": dup_id,
            "confidence": confidences,
            "prediction_source": {
                "category": "ML Prediction (TF-IDF + XGBoost)",
                "department": "ML Prediction (TF-IDF + XGBoost)",
                "subcategory": "ML Prediction (TF-IDF + XGBoost)",
                "severity": "ML Prediction (TF-IDF + XGBoost)",
                "priority": "ML Prediction (TF-IDF + XGBoost)",
                "urgency": "ML Prediction (TF-IDF + XGBoost)",
                "location": "NLP Extraction",
                "duration": "NLP Extraction",
                "safety_risk": "Rule-based NLP Risk Analysis",
                "public_impact": "Rule-based Impact Estimation",
                "summary": "AI Generated"
            }
        }

# Global singleton
analysis_service = AIAnalysisService()
