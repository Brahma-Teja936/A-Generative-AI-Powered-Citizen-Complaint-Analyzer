import requests
import json

image_path = "test_road.jpg"

url = "http://127.0.0.1:5000/predict-image"

with open(image_path, "rb") as image_file:

    files = {
        "image": image_file
    }

    response = requests.post(
        url,
        files=files
    )


print("\nStatus Code:")
print(response.status_code)

print("\nResponse:")
print(json.dumps(response.json(), indent=4))