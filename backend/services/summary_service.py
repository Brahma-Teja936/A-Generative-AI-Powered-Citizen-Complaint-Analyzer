import os
import re
from config import Config

def generate_fallback_summary(complaint_text: str, department: str, severity: str) -> str:
    """
    Intelligent algorithmic fallback summary generator when external LLM API is unavailable.
    Creates a concise, professional, action-oriented civic summary.
    """
    text = complaint_text.strip()
    # Normalize extra punctuation and spaces
    clean_text = re.sub(r'[!?,.]+', '.', text)
    sentences = [s.strip() for s in clean_text.split('.') if s.strip()]
    first_sentence = sentences[0] if sentences else text

    # Remove conversational prefixes
    first_sentence = re.sub(r'^(there is|there are|we have|i noticed|please note that|hello|hi|sir)\s+', '', first_sentence, flags=re.IGNORECASE)
    first_sentence = first_sentence.strip()
    if first_sentence:
        first_sentence = first_sentence[0].upper() + first_sentence[1:]

    # Prefix with severity context
    if severity == "CRITICAL":
        prefix = "Critical public safety hazard: "
    elif severity == "HIGH":
        prefix = "High-priority civic issue: "
    elif severity == "MEDIUM":
        prefix = "Moderate civic concern: "
    else:
        prefix = "Civic maintenance report: "

    summary = f"{prefix}{first_sentence} categorized under {department} for immediate department review."
    return summary

def generate_summary(complaint_text: str, department: str, severity: str, priority: str) -> str:
    """
    Generates a concise professional summary.
    Attempts external LLM (Groq) if configured; falls back gracefully to deterministic generator.
    """
    groq_api_key = Config.GROQ_API_KEY

    if groq_api_key and groq_api_key.strip():
        try:
            from groq import Groq
            client = Groq(api_key=groq_api_key)
            prompt = f"""
You are a civic service dispatcher. Write a single concise professional summary sentence (maximum 25 words) summarizing this citizen complaint for municipal action.

Complaint: "{complaint_text}"
Department: {department}
Severity: {severity}
Priority: {priority}

Rules:
- Do NOT repeat the instructions.
- Do NOT use markdown or quotes.
- Return ONLY the single summary sentence.
"""
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=60,
                temperature=0.2,
                timeout=5.0
            )
            content = response.choices[0].message.content.strip()
            # Strip quotes or extra markdown if any
            content = content.replace('"', '').replace("```", "").strip()
            if content:
                return content
        except Exception as e:
            print(f"[INFO] Groq summary generation failed or timed out ({e}), using fallback generator.")

    # Rule-based fallback summary
    return generate_fallback_summary(complaint_text, department, severity)
