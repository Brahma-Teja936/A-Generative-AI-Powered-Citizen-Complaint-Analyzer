from gemini_utils import generate_ai_response


result = generate_ai_response(
    "There is a huge pothole on the road causing accidents",
    "Street Condition",
    "Road Department",
    "High",
    "Critical",
    "Negative"
)


print(result)