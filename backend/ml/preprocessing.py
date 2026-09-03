import re
import string

# Standard English stopwords list for civic complaints
STOPWORDS = {
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've",
    "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his',
    'himself', 'she', "she's", 'her', 'hers', 'herself', 'it', "it's", 'its', 'itself',
    'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom',
    'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did',
    'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
    'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up',
    'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will',
    'just', 'don', "don't", 'should', "should've", 'now', 'd', 'll', 'm', 'o', 're',
    've', 'y', 'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven',
    'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren', 'won',
    'wouldn', 'please', 'sir', 'madam', 'kindly', 'regards', 'request'
}

def preprocess_text(text: str) -> str:
    """
    Consistent text preprocessing pipeline:
    1. Convert to lowercase
    2. Remove URLs and email addresses
    3. Remove punctuation and special characters
    4. Normalize whitespace
    5. Filter out stopwords
    6. Return clean normalized text
    """
    if not text or not isinstance(text, str):
        return ""
    
    # 1. Lowercase
    text = text.lower()
    
    # 2. Remove URLs and emails
    text = re.sub(r'https?://\S+|www\.\S+', ' ', text)
    text = re.sub(r'\S+@\S+', ' ', text)
    
    # 3. Remove punctuation and special symbols
    text = re.sub(r'[' + re.escape(string.punctuation) + r']', ' ', text)
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    
    # 4. Normalize whitespace
    tokens = text.split()
    
    # 5. Filter stopwords & short tokens
    cleaned_tokens = [
        token for token in tokens
        if token not in STOPWORDS and len(token) > 1
    ]
    
    return " ".join(cleaned_tokens)
