from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True
from transformers import AutoProcessor, Florence2ForConditionalGeneration
import torch


# =====================================================
# Florence-2 Configuration
# =====================================================

MODEL_NAME = "florence-community/Florence-2-base"

device = torch.device("cpu")

print("Loading Florence-2 image analysis model...")


# =====================================================
# Load Processor
# =====================================================

processor = AutoProcessor.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
)


# =====================================================
# Load Model
# =====================================================

model = Florence2ForConditionalGeneration.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float32,
    low_cpu_mem_usage=True
)

model.to(device)

model.eval()

print("✓ Florence-2 loaded successfully")


# =====================================================
# Analyze Image
# =====================================================

def analyze_image(image_path):

    # ---------------------------------------------
    # Open image
    # ---------------------------------------------

    image = Image.open(image_path).convert("RGB")


    # ---------------------------------------------
    # Florence task
    # ---------------------------------------------

    task_prompt = "<DETAILED_CAPTION>"


    # ---------------------------------------------
    # Prepare inputs
    # ---------------------------------------------

    inputs = processor(
        text=task_prompt,
        images=image,
        return_tensors="pt"
    )


    # ---------------------------------------------
    # Move tensors to CPU
    # ---------------------------------------------

    inputs = {
        key: value.to(device)
        for key, value in inputs.items()
        if hasattr(value, "to")
    }


    # ---------------------------------------------
    # Generate description
    # ---------------------------------------------

    with torch.no_grad():

        generated_ids = model.generate(
            **inputs,
            max_new_tokens=100
        )


    # ---------------------------------------------
    # Decode
    # ---------------------------------------------

    generated_text = processor.batch_decode(
        generated_ids,
        skip_special_tokens=False
    )[0]


    # ---------------------------------------------
    # Post-process
    # ---------------------------------------------

    result = processor.post_process_generation(
        generated_text,
        task=task_prompt,
        image_size=image.size
    )


    # ---------------------------------------------
    # Extract description
    # ---------------------------------------------

    description = result.get(
        "<DETAILED_CAPTION>",
        ""
    )


    return description


# =====================================================
# Test
# =====================================================

if __name__ == "__main__":

    image_path = "test_road.jpg"

    description = analyze_image(image_path)

    print("\nImage Description")
    print("-----------------")

    print(description)