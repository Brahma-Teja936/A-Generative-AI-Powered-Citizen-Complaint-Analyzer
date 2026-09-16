import re
import string

def preprocess_text(text: str) -> str:
    """
    Standardize, clean, and preprocess complaint text for TF-IDF vectorizer.
    Supports English, Telugu, and Hindi character sequences.
    """
    if not text:
        return ""
    
    text = str(text).lower()
    # Normalize excessive newlines and whitespace
    text = re.sub(r'[\r\n\t]+', ' ', text)
    # Remove standard punctuation while keeping words
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = re.sub(r'\s+', ' ', text)
    return text.strip()
