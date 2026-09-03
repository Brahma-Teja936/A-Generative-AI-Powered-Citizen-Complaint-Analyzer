'''import os
import json
from dotenv import load_dotenv
from groq import Groq


# ==========================================================
# Load Environment Variables
# ==========================================================

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY not found in .env file")


client = Groq(api_key=api_key)

print("✓ Groq Client Loaded Successfully")


# ==========================================================
# Generate AI Response
# ==========================================================

def generate_ai_response(prediction):

    prompt = f"""
You are an AI assistant for a Citizen Complaint Management System.

Analyze the complaint and provide a response.

Complaint:
{prediction['Complaint']}

Category:
{prediction['Category']}

Department:
{prediction['Department']}

Priority:
{prediction['Priority']}

Severity:
{prediction['Severity']}

Sentiment:
{prediction['Sentiment']}


Return ONLY valid JSON.

The JSON format must be:

{{
    "summary": "Short complaint summary",
    "recommended_action": "Action department should take",
    "citizen_response": "Professional reply to citizen"
}}

Do not add markdown.
Do not add ```.
Only return JSON.
"""


    response = client.chat.completions.create(

        model="llama-3.3-70b-versatile",

        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],

        temperature=0.3,

        max_tokens=400
    )


    ai_text = response.choices[0].message.content


    # Convert string JSON into Python dictionary

    try:

        ai_json = json.loads(ai_text)

    except json.JSONDecodeError:

        ai_json = {
            "summary": ai_text,
            "recommended_action": "",
            "citizen_response": ""
        }


    return ai_json'''
import os
import json

from dotenv import load_dotenv
from groq import Groq


# ==========================================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================================

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError(
        "GROQ_API_KEY not found in .env file"
    )


# ==========================================================
# GROQ CLIENT
# ==========================================================

client = Groq(api_key=api_key)

print("✓ Groq Client Loaded Successfully")


# ==========================================================
# GROQ MODEL
# ==========================================================

GROQ_MODEL = "openai/gpt-oss-120b"


# ==========================================================
# HELPER FUNCTION
# ==========================================================

def extract_json(text):
    """
    Convert Groq response text into a Python dictionary.
    Handles cases where the model accidentally adds extra text.
    """

    text = text.strip()

    # ------------------------------------------------------
    # Try normal JSON
    # ------------------------------------------------------

    try:
        return json.loads(text)

    except json.JSONDecodeError:
        pass


    # ------------------------------------------------------
    # Try extracting JSON between { and }
    # ------------------------------------------------------

    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1:

        json_text = text[start:end + 1]

        try:
            return json.loads(json_text)

        except json.JSONDecodeError:
            pass


    # ------------------------------------------------------
    # If JSON parsing fails
    # ------------------------------------------------------

    return None


# ==========================================================
# TEXT COMPLAINT AI ANALYSIS
# ==========================================================

def generate_ai_response(prediction):

    prompt = f"""
You are an AI assistant for a Citizen Complaint Management System.

Analyze the following citizen complaint and provide a professional
response.

Complaint:
{prediction['Complaint']}

Category:
{prediction['Category']}

Department:
{prediction['Department']}

Priority:
{prediction['Priority']}

Severity:
{prediction['Severity']}

Sentiment:
{prediction['Sentiment']}


Generate:

1. A short summary of the complaint.
2. The recommended action for the responsible department.
3. A professional response to the citizen.


Return ONLY valid JSON.

Use exactly this structure:

{{
    "summary": "Short complaint summary",
    "recommended_action": "Action department should take",
    "citizen_response": "Professional response to citizen"
}}

Do not add markdown.
Do not add ```.
Do not add explanations outside the JSON.
"""


    # ------------------------------------------------------
    # Call Groq
    # ------------------------------------------------------

    response = client.chat.completions.create(

        model=GROQ_MODEL,

        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],

        temperature=0.2,

        max_tokens=400
    )


    ai_text = response.choices[0].message.content.strip()


    # ------------------------------------------------------
    # Convert response to JSON
    # ------------------------------------------------------

    ai_json = extract_json(ai_text)


    if ai_json is None:

        ai_json = {

            "summary": ai_text,

            "recommended_action": "",

            "citizen_response": ""

        }


    return ai_json


# ==========================================================
# IMAGE COMPLAINT AI ANALYSIS
# ==========================================================

def generate_image_ai_response(prediction):

    prompt = f"""
You are an AI assistant for a Citizen Complaint Management System.

You are analyzing a citizen complaint from an uploaded image.

The image has already been analyzed by computer vision models.

The computer vision results are:

Category:
{prediction['Category']}

Department:
{prediction['Department']}

Vision Model Confidence:
{prediction['Confidence']}

Image Description:
{prediction['Image_Description']}


Based on the image description and detected category:

1. Identify the visible problem.
2. Determine the priority.
3. Determine the severity.
4. Write a short complaint summary.
5. Recommend an appropriate action for the responsible department.
6. Write a professional response to the citizen.


Priority MUST be exactly one of:

Low
Medium
High
Critical


Severity MUST be exactly one of:

Minor
Moderate
Major
Critical


Important:

Do not invent information that cannot reasonably be inferred
from the image description.

If the image shows road damage such as cracks, potholes,
broken surfaces, or damaged pavement, identify the problem
accordingly.

If the image shows sanitation problems such as garbage,
waste accumulation, or overflowing bins, identify the problem
accordingly.

If the image shows drainage or sewer problems such as
waterlogging, blocked drains, or damaged drainage structures,
identify the problem accordingly.

If the image shows damaged street lights or lighting
infrastructure, identify the problem accordingly.

If the image shows problems involving parks, trees, or public
green spaces, identify the problem accordingly.

If the image shows water supply infrastructure problems,
identify the problem accordingly.

If the image shows building damage or maintenance problems,
identify the problem accordingly.


Return ONLY valid JSON.

Use exactly this structure:

{{
    "problem": "Description of the visible problem",

    "priority": "Low/Medium/High/Critical",

    "severity": "Minor/Moderate/Major/Critical",

    "summary": "Short summary of the complaint",

    "recommended_action": "Action that the responsible department should take",

    "citizen_response": "Professional response to the citizen"
}}

Do not add markdown.
Do not add ```.
Do not add explanations outside the JSON.
"""


    # ------------------------------------------------------
    # Call Groq
    # ------------------------------------------------------

    response = client.chat.completions.create(

        model=GROQ_MODEL,

        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],

        temperature=0.2,

        max_tokens=500
    )


    ai_text = response.choices[0].message.content.strip()


    # ------------------------------------------------------
    # Convert response to JSON
    # ------------------------------------------------------

    ai_json = extract_json(ai_text)


    # ------------------------------------------------------
    # Fallback
    # ------------------------------------------------------

    if ai_json is None:

        ai_json = {

            "problem": "",

            "priority": "",

            "severity": "",

            "summary": ai_text,

            "recommended_action": "",

            "citizen_response": ""

        }


    return ai_json