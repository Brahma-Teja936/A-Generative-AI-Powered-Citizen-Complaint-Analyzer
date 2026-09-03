from image_utils import predict_image_category


image_path = "test_road.jpg"


result = predict_image_category(image_path)


print("\nPrediction Result")
print("-----------------")

print("Category:", result["category"])

print("Department:", result["department"])

print("Confidence:", result["confidence"])