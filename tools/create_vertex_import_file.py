
import json
import csv
import os
from google.cloud import storage

# --- Configuration ---
GCS_BUCKET_NAME = "usd-bills"
GCP_PROJECT_ID = "premium-country-477304-u6" # Explicitly set the project ID
# The script will look for _annotations.coco.json in train/, valid/, and test/ directories
SETS = ["train", "valid", "test"]
OUTPUT_CSV_FILE = "vertex_ai_import.csv"  # Generated in the tools/ directory

def create_import_file():
    """
    Connects to GCS, processes COCO annotation files for multiple sets,
    and generates a single CSV file for Vertex AI Image Classification import.
    """
    print("Starting script...")
    try:
        # Pass the project ID explicitly
        storage_client = storage.Client(project=GCP_PROJECT_ID)
        bucket = storage_client.bucket(GCS_BUCKET_NAME)
    except Exception as e:
        print(f"Error connecting to GCS. Ensure you are authenticated and project ID is correct.")
        print(f"You might need to run: gcloud auth application-default login")
        print(f"Full error: {e}")
        return

    # Open the output file once and write all rows
    with open(OUTPUT_CSV_FILE, 'w', newline='') as csvfile:
        csv_writer = csv.writer(csvfile)
        print(f"Opened {OUTPUT_CSV_FILE} for writing.")

        # Process each set (train, valid, test)
        for data_set in SETS:
            print(f"--- Processing set: {data_set} ---")
            
            # 1. Download the annotation file from GCS
            annotation_blob_path = f"{data_set}/_annotations.coco.json"
            blob = bucket.blob(annotation_blob_path)
            
            if not blob.exists():
                print(f"  [ERROR] Annotation file not found in GCS: gs://{GCS_BUCKET_NAME}/{annotation_blob_path}")
                continue

            try:
                print(f"  Downloading {annotation_blob_path}...")
                json_data_string = blob.download_as_text()
                coco_data = json.loads(json_data_string)
            except Exception as e:
                print(f"  [ERROR] Failed to download or parse JSON for set '{data_set}'. Error: {e}")
                continue

            # 2. Create mappings for categories and images
            # Maps category ID to a simplified label ('real' or 'fake')
            category_mapping = {}
            for cat in coco_data.get('categories', []):
                cat_id = cat.get('id')
                cat_name = cat.get('name', '').lower()
                if 'genuine' in cat_name:
                    category_mapping[cat_id] = 'real'
                elif 'counterfeit' in cat_name:
                    category_mapping[cat_id] = 'fake'
            
            if not category_mapping:
                print(f"  [WARNING] No 'Genuine' or 'Counterfeit' categories found for set '{data_set}'.")

            # Maps image ID to its filename
            image_id_to_filename = {img['id']: img['file_name'] for img in coco_data.get('images', [])}

            # 3. Process annotations and write to CSV
            annotations = coco_data.get('annotations', [])
            if not annotations:
                print(f"  [WARNING] No annotations found for set '{data_set}'.")
                continue

            processed_count = 0
            skipped_count = 0
            # Use a set to keep track of images we've already processed to avoid duplicates
            processed_images = set()

            for ann in annotations:
                image_id = ann.get('image_id')
                category_id = ann.get('category_id')

                label = category_mapping.get(category_id)
                filename = image_id_to_filename.get(image_id)

                # Skip if we don't have a valid label, filename, or if we've already processed this image
                if not (label and filename) or filename in processed_images:
                    continue

                # Check if the image file actually exists in GCS
                blob_path = f"{data_set}/{filename}"
                image_blob = bucket.blob(blob_path)

                if image_blob.exists():
                    # Construct the full GCS path to the image
                    gcs_uri = f"gs://{GCS_BUCKET_NAME}/{blob_path}"
                    
                    # The SET for Vertex AI needs to be uppercase (TRAINING, VALIDATION, TEST)
                    vertex_set = data_set.upper()
                    if data_set == "valid":
                        vertex_set = "VALIDATION"

                    # Write the row to the CSV file
                    csv_writer.writerow([vertex_set, gcs_uri, label])
                    processed_images.add(filename)
                    processed_count += 1
                else:
                    # The image file is missing in GCS
                    skipped_count += 1
            
            print(f"  Successfully processed and wrote {processed_count} annotations for the '{data_set}' set.")
            if skipped_count > 0:
                print(f"  Skipped {skipped_count} missing image files.")

    print(f"--- Script finished ---")
    print(f"Successfully created {OUTPUT_CSV_FILE}. You can now use this file to create a dataset in Vertex AI.")

if __name__ == "__main__":
    create_import_file()
