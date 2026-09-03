from transformers import pipeline


# =====================================================
# Load Pretrained CLIP Model
# =====================================================

MODEL_NAME = "openai/clip-vit-base-patch32"

print("Loading CLIP image model...")

classifier = pipeline(
    "zero-shot-image-classification",
    model=MODEL_NAME
)


# =====================================================
# Civic Complaint Categories
# =====================================================

LABEL_MAP = {
    "a photo of a road damage problem": "Roads",

    "a photo of a sanitation problem": "Sanitation",

    "a photo of a sewer and drainage problem": "Sewer & Drainage",

    "a photo of a street light problem": "Street Lights",

    "a photo of a parks and trees problem": "Parks & Trees",

    "a photo of a water supply problem": "Water Supply",

    "a photo of a building maintenance problem": "Building Maintenance"
}


# =====================================================
# Category → Department Mapping
# =====================================================

DEPARTMENT_MAP = {

    "Roads":
        "Roads & Infrastructure Department",

    "Sanitation":
        "Sanitation Department",

    "Sewer & Drainage":
        "Sewerage & Drainage Department",

    "Street Lights":
        "Electrical Department",

    "Parks & Trees":
        "Parks & Horticulture Department",

    "Water Supply":
        "Water Supply Department",

    "Building Maintenance":
        "Building Maintenance Department"
}


# =====================================================
# Image Category Prediction
# =====================================================

def predict_image_category(image_path):

    # Get all possible labels
    candidate_labels = list(LABEL_MAP.keys())


    # Run CLIP zero-shot classification
    results = classifier(
        image_path,
        candidate_labels=candidate_labels
    )


    # Highest scoring result
    best_result = results[0]


    # Convert CLIP label into our category
    category = LABEL_MAP[best_result["label"]]


    # Find responsible department
    department = DEPARTMENT_MAP[category]


    # Return prediction
    return {

        "category": category,

        "department": department,

        "confidence": round(
            float(best_result["score"]),
            4
        )
    }