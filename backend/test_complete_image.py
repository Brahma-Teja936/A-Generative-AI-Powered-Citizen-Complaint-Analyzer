from image_utils import predict_image_category
from vision_analysis import analyze_image


# ==========================================
# Image Path
# ==========================================

image_path = "test_road.jpg"


# ==========================================
# CLIP Category Prediction
# ==========================================

category_result = predict_image_category(image_path)


# ==========================================
# Florence-2 Image Understanding
# ==========================================

image_description = analyze_image(image_path)


# ==========================================
# Complete Result
# ==========================================

print("\n====================================")
print("      COMPLETE IMAGE ANALYSIS")
print("====================================")

print("\nCategory:")
print(category_result["category"])

print("\nDepartment:")
print(category_result["department"])

print("\nConfidence:")
print(category_result["confidence"])

print("\nImage Description:")
print(image_description)

print("\n====================================")