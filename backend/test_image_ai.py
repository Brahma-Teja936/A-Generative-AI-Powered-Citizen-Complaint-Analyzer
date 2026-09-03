from image_utils import predict_image_category
from vision_analysis import analyze_image
from llm_utils import generate_image_ai_response


# =====================================================
# Image Path
# =====================================================

image_path = "test_road.jpg"


# =====================================================
# STEP 1 — CLIP
# =====================================================

print("\nRunning CLIP...")

category_result = predict_image_category(image_path)


# =====================================================
# STEP 2 — Florence-2
# =====================================================

print("\nRunning Florence-2...")

image_description = analyze_image(image_path)


# =====================================================
# STEP 3 — Prepare Image Prediction
# =====================================================

prediction = {

    "Category": category_result["category"],

    "Department": category_result["department"],

    "Confidence": category_result["confidence"],

    "Image_Description": image_description

}


# =====================================================
# STEP 4 — Groq
# =====================================================

print("\nSending information to Groq...")

ai_response = generate_image_ai_response(prediction)


# =====================================================
# FINAL RESULT
# =====================================================

print("\n")
print("==============================================")
print("        COMPLETE AI IMAGE ANALYSIS")
print("==============================================")

print("\nCategory:")
print(prediction["Category"])

print("\nDepartment:")
print(prediction["Department"])

print("\nConfidence:")
print(prediction["Confidence"])

print("\nImage Description:")
print(prediction["Image_Description"])

print("\nAI Analysis:")
print("----------------------------------------------")

for key, value in ai_response.items():

    print(f"{key}:")
    print(value)
    print()


print("==============================================")