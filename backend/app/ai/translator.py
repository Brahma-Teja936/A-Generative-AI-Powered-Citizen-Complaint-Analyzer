import re
from langdetect import detect
from backend.config import Config

# Simple common Telugu & Hindi script unicode ranges
TELUGU_RANGE = (0x0C00, 0x0C7F)
DEVANAGARI_RANGE = (0x0900, 0x097F)

def contains_script(text: str, script_range) -> bool:
    return any(script_range[0] <= ord(char) <= script_range[1] for char in text)

def detect_language(text: str) -> str:
    """
    Detects language of complaint text: 'en', 'te', 'hi', or detected ISO code.
    """
    if not text or len(text.strip()) == 0:
        return "en"

    # Fast script heuristics
    if contains_script(text, TELUGU_RANGE):
        return "te"
    if contains_script(text, DEVANAGARI_RANGE):
        return "hi"

    try:
        lang = detect(text)
        if lang in ["te", "tel"]:
            return "te"
        elif lang in ["hi", "hin", "mr"]:
            return "hi"
        elif lang in ["en"]:
            return "en"
        return lang
    except Exception:
        return "en"

def translate_to_english(text: str, groq_client_func=None) -> dict:
    """
    Translates non-English civic complaints to English while strictly preserving the original text.
    Returns:
        {
            "original_text": text,
            "original_language": lang,
            "translated_text_en": translation,
            "translation_status": "SUCCESS" | "UNAVAILABLE",
            "translation_source": "GROQ_LLM" | "DIRECT" | "NONE"
        }
    """
    if not text:
        return {
            "original_text": "",
            "original_language": "en",
            "translated_text_en": "",
            "translation_status": "SUCCESS",
            "translation_source": "DIRECT"
        }

    lang = detect_language(text)

    # If already English, no translation necessary
    if lang == "en":
        return {
            "original_text": text,
            "original_language": "en",
            "translated_text_en": text,
            "translation_status": "SUCCESS",
            "translation_source": "DIRECT"
        }

    # If Groq is configured and callable, use high quality LLM translation
    if groq_client_func and Config.GROQ_API_KEY:
        try:
            translation = groq_client_func(
                system_prompt="You are a civic translation assistant. Translate the following civic complaint into clear English. Output ONLY the English translation with no other text.",
                user_prompt=text
            )
            if translation and len(translation.strip()) > 0:
                return {
                    "original_text": text,
                    "original_language": lang,
                    "translated_text_en": translation.strip(),
                    "translation_status": "SUCCESS",
                    "translation_source": "GROQ_LLM"
                }
        except Exception as e:
            print(f"[CivicAI Translator Warning] Groq translation failed ({e}). Preserving original.")

    # Fallback if external translation fails or offline
    return {
        "original_text": text,
        "original_language": lang,
        "translated_text_en": text,
        "translation_status": "UNAVAILABLE",
        "translation_source": "NONE"
    }
