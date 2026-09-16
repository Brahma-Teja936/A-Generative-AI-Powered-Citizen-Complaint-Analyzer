import json
import re
from backend.config import Config

try:
    from groq import Groq
except ImportError:
    Groq = None

class GroqService:
    _client = None

    @classmethod
    def get_client(cls):
        if cls._client is None and Config.GROQ_API_KEY and Groq is not None:
            try:
                cls._client = Groq(api_key=Config.GROQ_API_KEY)
            except Exception as e:
                print(f"[CivicAI Groq Warning] Client init failed: {e}")
                cls._client = None
        return cls._client

    @classmethod
    def call_text(cls, system_prompt: str, user_prompt: str) -> str:
        """Standard text generation call."""
        client = cls.get_client()
        if not client:
            return ""
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=Config.GROQ_MODEL,
                temperature=0.2,
                max_tokens=600
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"[CivicAI Groq Call Error] {e}")
            return ""

    @classmethod
    def analyze_complaint(cls, complaint_text: str, ml_prediction: dict) -> dict:
        """
        Enriches ML predictions with Groq Generative AI for:
        - Human-readable summary
        - Multi-issue detection
        - Secondary department
        - Safety risk, Public impact, Affected people count/groups
        - Recommended action & Recommended response time
        - Citizen, Infrastructure, Health, Environmental risks
        - Sentiment analysis
        """
        client = cls.get_client()
        if not client:
            return cls._fallback_enrichment(complaint_text, ml_prediction)

        system_prompt = (
            "You are CivicAI, an expert civic intelligence and municipal emergency analyzer. "
            "Analyze the citizen complaint and return a strictly valid JSON object without markdown fences or extra words. "
            "JSON fields required:\n"
            "{\n"
            '  "summary": "Brief 1-2 sentence executive summary of the issue.",\n'
            '  "secondary_department": "Secondary department name or null",\n'
            '  "multiple_issues_detected": true/false,\n'
            '  "multi_issue_explanation": "Explanation if multiple issues exist, or null",\n'
            '  "safety_risk": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",\n'
            '  "public_impact": "LOW"|"MODERATE"|"HIGH"|"CATASTROPHIC",\n'
            '  "affected_people_estimate": "Estimated number e.g. 50-200 residents",\n'
            '  "affected_groups": "Target groups e.g. Commuters, School children, Elderly",\n'
            '  "recommended_action": "Actionable step for municipal engineers or emergency crew",\n'
            '  "recommended_response_time": "Timeframe e.g. Immediate (within 2 hours) or 24 hours",\n'
            '  "citizen_impact": "Specific impact on citizens",\n'
            '  "infrastructure_impact": "Impact on public roads, grid, pipes",\n'
            '  "health_risk": "Public health consequences or diseases",\n'
            '  "environmental_risk": "Environmental harm or contamination",\n'
            '  "sentiment": "NEGATIVE"|"VERY_NEGATIVE"|"URGENT_DISTRESS"|"NEUTRAL"\n'
            "}"
        )

        user_prompt = (
            f"Citizen Complaint: \"{complaint_text}\"\n"
            f"ML Classification: Department: {ml_prediction.get('department')}, "
            f"Severity: {ml_prediction.get('severity')}, Priority: {ml_prediction.get('priority')}, "
            f"Urgency: {ml_prediction.get('urgency')}."
        )

        try:
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=Config.GROQ_MODEL,
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            raw_json = response.choices[0].message.content
            parsed = json.loads(raw_json)
            return parsed
        except Exception as e:
            print(f"[CivicAI Groq Analysis Fallback] {e}")
            return cls._fallback_enrichment(complaint_text, ml_prediction)

    @classmethod
    def _fallback_enrichment(cls, text: str, ml: dict) -> dict:
        """Deterministic NLP rule-based enrichment if Groq is unavailable."""
        t = text.lower()
        severity = ml.get("severity", "MEDIUM")
        dept = ml.get("department", "Roads & Infrastructure")

        # Multi-issue check
        multi_issue = False
        secondary = None
        multi_exp = None
        if ("and" in t or "also" in t or "as well as" in t) and (
            ("streetlight" in t and "pothole" in t) or 
            ("water" in t and "road" in t) or 
            ("garbage" in t and "drain" in t)
        ):
            multi_issue = True
            if "streetlight" in t and dept != "Electricity & Power":
                secondary = "Electricity & Power"
                multi_exp = "Secondary electrical/lighting issue reported alongside main complaint."
            elif "pothole" in t and dept != "Roads & Infrastructure":
                secondary = "Roads & Infrastructure"
                multi_exp = "Road damage reported alongside primary municipal issue."
            elif "water" in t and dept != "Water Supply & Sewerage":
                secondary = "Water Supply & Sewerage"
                multi_exp = "Water/sewerage complication reported."

        # Safety & impact derivation
        safety_risk = "CRITICAL" if severity == "CRITICAL" else ("HIGH" if severity == "HIGH" else "MEDIUM")
        public_impact = "CATASTROPHIC" if severity == "CRITICAL" else ("HIGH" if severity == "HIGH" else "MODERATE")

        action_map = {
            "Roads & Infrastructure": "Deploy road repair crew to inspect and patch damaged section.",
            "Water Supply & Sewerage": "Dispatch pipeline maintenance unit to isolate and repair leak/overflow.",
            "Electricity & Power": "Dispatch electrical line crew to isolate circuit and repair hazardous wiring.",
            "Public Health & Sanitation": "Send sanitation vehicle and disinfectant spraying unit.",
            "Fire & Emergency Services": "Deploy emergency first responder unit and cordon off hazard zone.",
            "Public Safety & Police": "Deploy civic safety officers and install hazard barricades.",
            "Town Planning & Parks": "Inspect site and issue municipal remediation notice."
        }

        return {
            "summary": f"{dept} issue: {text[:140]}..." if len(text) > 140 else text,
            "secondary_department": secondary,
            "multiple_issues_detected": multi_issue,
            "multi_issue_explanation": multi_exp,
            "safety_risk": safety_risk,
            "public_impact": public_impact,
            "affected_people_estimate": "100-500 local residents/commuters" if severity in ["HIGH", "CRITICAL"] else "10-50 citizens",
            "affected_groups": "Pedestrians, commuters, nearby households",
            "recommended_action": action_map.get(dept, "Dispatch municipal inspection team."),
            "recommended_response_time": "Immediate (within 2-4 hours)" if severity == "CRITICAL" else ("Within 24 hours" if severity == "HIGH" else "Within 3-5 business days"),
            "citizen_impact": "Direct inconvenience, safety hazard, and public access disruption.",
            "infrastructure_impact": f"Risk of degradation to municipal assets in {dept}.",
            "health_risk": "Risk of vector-borne illnesses, sanitation risks, or physical injury." if severity in ["HIGH", "CRITICAL"] else "Low immediate health risk.",
            "environmental_risk": "Local environmental pollution or resource wastage." if severity in ["HIGH", "CRITICAL"] else "Negligible environmental impact.",
            "sentiment": "URGENT_DISTRESS" if severity == "CRITICAL" else ("VERY_NEGATIVE" if severity == "HIGH" else "NEGATIVE")
        }
