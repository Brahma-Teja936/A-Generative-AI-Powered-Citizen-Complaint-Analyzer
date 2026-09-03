from predict_utils import predict_complaint

complaint = "There is a huge pothole on the road causing accidents."

result = predict_complaint(complaint)

print("\nPrediction Result:\n")

for key, value in result.items():
    print(f"{key}: {value}")