from transformers import pipeline

# Pre-trained CLIP model
MODEL_NAME = "openai/clip-vit-base-patch32"

print("Loading CLIP model...")
classifier = pipeline(
    "zero-shot-image-classification",
    model=MODEL_NAME
)

# Your test image
image_path = r"D:\complaint\Complaint_Analyzer\test_images\garbage.webp"

# Visually identifiable APCCD categories
candidate_labels = [
    "a road damage problem",
    "a sanitation problem",
    "a sewer and drainage problem",
    "a street light problem",
    "a parks and trees problem",
    "a water supply problem",
    "a building maintenance problem"
]

print("Analyzing image...")

results = classifier(
    image_path,
    candidate_labels=candidate_labels
)

print("\nImage Classification Results")
print("--------------------------------")

for result in results:
    print(
        f"{result['label']}: "
        f"{result['score']:.4f}"
    )

print("\nPredicted Category:")
print(results[0]["label"])