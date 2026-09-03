from llm_utils import generate_ai_response

prediction = {
    "Complaint": "There is a huge pothole on the road causing accidents.",
    "Category": "Roads",
    "Department": "Roads & Buildings",
    "Priority": "Medium",
    "Severity": "High",
    "Sentiment": "Negative"
}

print("=" * 60)
print("Testing Groq LLM...")
print("=" * 60)

response = generate_ai_response(prediction)

print("\nAI Response:\n")
print(response)