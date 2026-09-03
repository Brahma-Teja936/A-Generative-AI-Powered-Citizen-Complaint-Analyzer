from llm_utils import generate_ai_response

response = generate_ai_response(
    complaint="There is a huge pothole on the main road causing accidents every day.",
    category="Street Condition",
    department="Road Department",
    priority="High",
    severity="Critical",
    sentiment="Negative"
)

print("\n" + "=" * 60)
print("GENERATED RESPONSE")
print("=" * 60)
print(response)