# Filename: prepare_coco_dataset.py

import json
import requests
import os
import zipfile
from io import BytesIO

# --- Configuration ---
# URL for COCO 2017 training annotations
ANNOTATIONS_URL = "http://images.cocodataset.org/annotations/annotations_trainval2017.zip"
ANNOTATIONS_FILE = "annotations/captions_train2017.json"

# GCS path to the public COCO 2017 training images
# The image filenames in the annotations are just numbers, so we format the full path.
GCS_IMAGE_BASE_URI = "gs://images.cocodataset.org/train2017/"

# Output JSONL filename
OUTPUT_FILE = "coco_train_for_gemini.jsonl"

# Number of examples to generate (use a smaller number for quick tests)
# Set to -1 to use all available captions.
NUM_EXAMPLES = 5000

def create_jsonl_dataset():
    """
    Downloads COCO annotations and creates a JSONL file for Vertex AI fine-tuning.
    """
    # --- 1. Download and extract annotations if not present ---
    if not os.path.exists(ANNOTATIONS_FILE):
        print("Downloading and extracting COCO 2017 annotations...")
        
        response = requests.get(ANNOTATIONS_URL, stream=True)
        response.raise_for_status()
        
        with zipfile.ZipFile(BytesIO(response.content)) as z:
            z.extractall()
        print("Annotations extracted.")

    # --- 2. Load the annotations JSON file ---
    print(f"Loading annotations from {ANNOTATIONS_FILE}...")
    with open(ANNOTATIONS_FILE, 'r') as f:
        data = json.load(f)

    # Create a mapping from image_id to filename
    image_id_to_filename = {image['id']: image['file_name'] for image in data['images']}
    
    # --- 3. Create the JSONL file ---
    print(f"Generating {OUTPUT_FILE} with {NUM_EXAMPLES if NUM_EXAMPLES != -1 else 'all'} examples...")
    count = 0
    with open(OUTPUT_FILE, 'w') as outfile:
        for annotation in data['annotations']:
            if NUM_EXAMPLES != -1 and count >= NUM_EXAMPLES:
                break

            image_id = annotation['image_id']
            caption = annotation['caption']
            filename = image_id_to_filename.get(image_id)

            if filename and caption:
                # The prompt can be generic or specific. For captioning, a generic one works well.
                prompt = "Describe this image in detail."
                
                # Construct the full GCS URI for the image
                image_uri = f"{GCS_IMAGE_BASE_URI}{filename}"

                # Create the JSON object for this line
                json_line = {
                    "input_text": prompt,
                    "image_uri": image_uri,
                    "output_text": caption
                }
                
                # Write the JSON object as a string on a new line
                outfile.write(json.dumps(json_line) + "\n")
                count += 1
    
    print(f"Successfully created {OUTPUT_FILE} with {count} lines.")

if __name__ == "__main__":
    create_jsonl_dataset()
