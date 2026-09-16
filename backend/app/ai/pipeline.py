import datetime
from backend.app.extensions import Database
from backend.app.ml.predictor import MLPredictor
from backend.app.ai.translator import translate_to_english
from backend.app.ai.groq_client import GroqService
from backend.app.ai.duplicate_detector import check_duplicate_complaints

def run_ai_complaint_pipeline(raw_text: str, complaint_id: str = None, location: dict = None) -> dict:
    """
    Complete AI Analysis Pipeline:
    1. Language Detection & English Translation (Original text preserved immutably)
    2. ML Classification (TF-IDF + XGBoost) across 6 targets
    3. Generative AI Contextual Enrichment (Groq LLM with fallback)
    4. Duplicate Complaint Similarity Analysis
    5. Emergency & Risk Identification
    6. Prediction persistence to model_predictions collection
    """
    # Step 1: Multilingual Translation
    trans_result = translate_to_english(raw_text, GroqService.call_text)
    processed_text = trans_result.get("translated_text_en") or raw_text

    # Step 2: TF-IDF + XGBoost Classification
    predictor = MLPredictor.get_instance()
    ml_res = predictor.predict(processed_text)

    # Step 3: Groq LLM Analysis (or heuristic fallback)
    llm_res = GroqService.analyze_complaint(processed_text, ml_res)

    # Step 4: Duplicate Detection
    coords = location.get("coordinates") if isinstance(location, dict) else None
    duplicates = check_duplicate_complaints(
        complaint_text=processed_text,
        location_coords=coords,
        category=ml_res.get("category")
    )

    # Step 5: Emergency Flag
    severity = ml_res.get("severity", "MEDIUM")
    urgency = ml_res.get("urgency", "WITHIN 3 DAYS")
    is_emergency = (severity == "CRITICAL") or (urgency == "IMMEDIATE") or (llm_res.get("safety_risk") == "CRITICAL")

    # Combine structured report
    ai_report = {
        "complaint_category": ml_res.get("category"),
        "subcategory": ml_res.get("subcategory"),
        "primary_department": ml_res.get("department"),
        "secondary_department": llm_res.get("secondary_department"),
        "multiple_issues_detected": llm_res.get("multiple_issues_detected", False),
        "multi_issue_explanation": llm_res.get("multi_issue_explanation"),
        "severity": severity,
        "priority": ml_res.get("priority"),
        "urgency": urgency,
        "safety_risk": llm_res.get("safety_risk", "LOW"),
        "public_impact": llm_res.get("public_impact", "LOW"),
        "potentially_affected_people": llm_res.get("affected_people_estimate", "Unknown"),
        "affected_groups": llm_res.get("affected_groups", "General Public"),
        "issue_type": ml_res.get("subcategory"),
        "recommended_action": llm_res.get("recommended_action"),
        "recommended_response_time": llm_res.get("recommended_response_time"),
        "ai_summary": llm_res.get("summary"),
        "ai_confidence": ml_res.get("confidence", 0.75),
        "per_target_confidence": ml_res.get("per_target_confidence", {}),
        "is_low_confidence": ml_res.get("is_low_confidence", False),
        "confidence_warning": ml_res.get("warning"),
        "complaint_validity": "VALID",
        "duplicate_score": duplicates[0]["similarity_score"] if duplicates else 0.0,
        "possible_duplicates": duplicates,
        "escalation_risk": "HIGH" if is_emergency else "LOW",
        "citizen_impact": llm_res.get("citizen_impact"),
        "infrastructure_impact": llm_res.get("infrastructure_impact"),
        "health_risk": llm_res.get("health_risk"),
        "environmental_risk": llm_res.get("environmental_risk"),
        "sentiment": llm_res.get("sentiment", "NEUTRAL"),
        "is_critical_emergency": is_emergency,
        "model_version": ml_res.get("model_version"),
        "prediction_source": ml_res.get("prediction_source")
    }

    # Step 6: Persist into model_predictions collection if complaint_id is provided
    db = Database.get_db()
    if db is not None and complaint_id:
        try:
            db.model_predictions.insert_one({
                "complaint_id": complaint_id,
                "model_name": "XGBoost + Groq Multi-Agent Pipeline",
                "model_version": ml_res.get("model_version"),
                "prediction": ai_report,
                "confidence": ml_res.get("confidence"),
                "created_at": datetime.datetime.now(datetime.timezone.utc)
            })
        except Exception as e:
            print(f"[CivicAI Model Predictions Log Error] {e}")

    return {
        "translation": trans_result,
        "ai_report": ai_report
    }
