from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# ==========================================================
# Load FLAN-T5 Model (Only Once)
# ==========================================================

print("=" * 60)
print("Loading FLAN-T5 Model...")
print("=" * 60)

MODEL_NAME = "google/flan-t5-base"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)

print("✓ FLAN-T5 Loaded Successfully")


# ==========================================================
# Generate AI Response
# ==========================================================

def generate_ai_response(
    complaint,
    category,
    department,
    priority,
    severity,
    sentiment
):

    prompt = f"""
You are an intelligent citizen complaint assistant.

A citizen has submitted the following complaint.

Complaint:
{complaint}

Machine Learning Predictions:

Category: {category}
Department: {department}
Priority: {priority}
Severity: {severity}
Sentiment: {sentiment}

Based on the above information:

1. Write a short complaint summary.

2. Recommend what action the department should take.

3. Write a professional response to the citizen.

Answer in the following format:

Complaint Summary:
...

Recommended Action:
...

Citizen Response:
...
"""

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=512
    )

    outputs = model.generate(
        **inputs,
        max_new_tokens=200,
        num_beams=5,
        early_stopping=True,
        no_repeat_ngram_size=2
    )

    response = tokenizer.decode(
        outputs[0],
        skip_special_tokens=True
    )

    return response