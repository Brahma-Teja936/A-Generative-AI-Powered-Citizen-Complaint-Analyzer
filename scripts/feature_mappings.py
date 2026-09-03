"""
feature_mappings.py

This file contains all mappings used to enrich the APCCD dataset.
"""

# ==========================================================
# Complaint Summary Mapping
# ==========================================================

SUMMARY_MAPPING = {

    "Roads": "Road damage or pothole reported.",

    "Water Supply": "Water supply issue reported.",

    "Sanitation": "Garbage or sanitation complaint reported.",

    "Street Lights": "Street light malfunction reported.",

    "Noise Pollution": "Noise disturbance complaint reported.",

    "Building Maintenance": "Building maintenance issue reported.",

    "Traffic & Parking": "Traffic or illegal parking complaint reported.",

    "Parks & Trees": "Park or tree maintenance complaint reported.",

    "Public Health": "Public health issue reported.",

    "Public Safety": "Public safety issue reported.",

    "Sewer & Drainage": "Drainage or sewer problem reported.",

    "Encroachment": "Illegal encroachment complaint reported.",

    "Animal Welfare": "Animal welfare complaint reported.",

    "Public Property": "Public property damage reported.",

    "Food Safety": "Food safety complaint reported."
}

# ==========================================================
# Sentiment Mapping
# ==========================================================

SENTIMENT_MAPPING = {

    "Roads": "Negative",

    "Water Supply": "Negative",

    "Sanitation": "Negative",

    "Street Lights": "Negative",

    "Noise Pollution": "Negative",

    "Building Maintenance": "Negative",

    "Traffic & Parking": "Negative",

    "Parks & Trees": "Neutral",

    "Public Health": "Negative",

    "Public Safety": "Negative",

    "Sewer & Drainage": "Negative",

    "Encroachment": "Negative",

    "Animal Welfare": "Neutral",

    "Public Property": "Neutral",

    "Food Safety": "Negative"
}

# ==========================================================
# Urgency Score Mapping
# ==========================================================

URGENCY_MAPPING = {

    "Roads": 7,

    "Water Supply": 10,

    "Sanitation": 8,

    "Street Lights": 6,

    "Noise Pollution": 5,

    "Building Maintenance": 7,

    "Traffic & Parking": 7,

    "Parks & Trees": 4,

    "Public Health": 9,

    "Public Safety": 10,

    "Sewer & Drainage": 9,

    "Encroachment": 6,

    "Animal Welfare": 5,

    "Public Property": 4,

    "Food Safety": 9
}

# ==========================================================
# Resolution Days Mapping
# ==========================================================

RESOLUTION_DAYS_MAPPING = {

    "Roads": 5,

    "Water Supply": 2,

    "Sanitation": 2,

    "Street Lights": 4,

    "Noise Pollution": 3,

    "Building Maintenance": 7,

    "Traffic & Parking": 3,

    "Parks & Trees": 6,

    "Public Health": 2,

    "Public Safety": 1,

    "Sewer & Drainage": 2,

    "Encroachment": 5,

    "Animal Welfare": 3,

    "Public Property": 7,

    "Food Safety": 1
}

# ==========================================================
# Emergency Mapping
# ==========================================================

EMERGENCY_MAPPING = {

    "Roads": "No",

    "Water Supply": "Yes",

    "Sanitation": "No",

    "Street Lights": "No",

    "Noise Pollution": "No",

    "Building Maintenance": "No",

    "Traffic & Parking": "No",

    "Parks & Trees": "No",

    "Public Health": "Yes",

    "Public Safety": "Yes",

    "Sewer & Drainage": "Yes",

    "Encroachment": "No",

    "Animal Welfare": "No",

    "Public Property": "No",

    "Food Safety": "Yes"
}

# ==========================================================
# Complaint Source
# ==========================================================

COMPLAINT_SOURCE = [

    "Citizen Portal",

    "Mobile App",

    "WhatsApp",

    "Call Center",

    "Municipal Office"
]