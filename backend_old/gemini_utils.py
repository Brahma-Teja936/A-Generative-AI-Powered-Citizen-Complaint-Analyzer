import os
from dotenv import load_dotenv
from google import genai


# Load environment variables
load_dotenv()


# Get API Key
API_KEY = os.getenv("GEMINI_API_KEY")


# Create Gemini client
client = genai.Client(
    api_key=API_KEY
)



def generate_ai_response(
        complaint,
        category,
        department,
        priority,
        severity,
        sentiment
):

    prompt = f"""
You are an AI citizen complaint analyzer.

Complaint:
{complaint}


Machine Learning Analysis:

Category:
{category}

Department:
{department}

Priority:
{priority}

Severity:
{severity}

Sentiment:
{sentiment}


Generate:

1. Complaint Summary
2. Recommended Action for Department
3. Citizen Response Message

Return a professional response.
"""


    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )


    return response.text