# 🤖 Training Your Bill Classifier (Vertex AI)

Your app is ready to use a custom Vertex AI model, but you need to train and deploy it first.

## ✅ Vertex AI API is Enabled

Good news! The Vertex AI API is now enabled on your project.

---

## 🎯 Option 1: Train a New Model (Recommended)

### Step 1: Prepare Your Dataset

You already have the dataset preparation script:

```bash
cd /Users/Welcome123/Desktop/CashAuth/tools
python3 create_vertex_import_file.py
```

This script requires:
- Dataset images stored in Google Cloud Storage
- COCO JSON annotation files
- Images labeled as "real" or "fake"

### Step 2: Upload Data to Cloud Storage

```bash
# Create a GCS bucket for your dataset
gsutil mb -l us-central1 gs://YOUR_PROJECT_ID-bill-dataset

# Upload your images
gsutil -m cp -r /path/to/your/images/* gs://YOUR_PROJECT_ID-bill-dataset/

# Upload the CSV file created by the script
gsutil cp tools/vertex_ai_import.csv gs://YOUR_PROJECT_ID-bill-dataset/
```

### Step 3: Create Dataset in Vertex AI

1. Go to [Vertex AI Datasets](https://console.cloud.google.com/vertex-ai/datasets)
2. Click "**+ CREATE DATASET**"
3. Dataset name: `bill-classifier-dataset`
4. Data type: **Image**
5. Objective: **Single-label classification**
6. Region: **us-central1**
7. Click "CREATE"

### Step 4: Import Data

1. Select "**Import data from Cloud Storage**"
2. Enter your CSV file path: `gs://YOUR_PROJECT_ID-bill-dataset/vertex_ai_import.csv`
3. Click "CONTINUE"
4. Wait for import to complete (can take 10-30 minutes)

### Step 5: Train the Model

1. On your dataset page, click "**TRAIN NEW MODEL**"
2. Training method: **AutoML**
3. Model name: `bill-classifier-v1`
4. Continue through the wizard:
   - **Objective:** Single-label classification
   - **Model details:** Use defaults
   - **Training options:** 
     - Budget: Start with 1-4 node hours (costs ~$3-12)
     - Early stopping: Enabled
5. Click "**START TRAINING**"

**Training time:** 1-3 hours depending on dataset size

### Step 6: Deploy the Model

After training completes:

1. Go to [Vertex AI Models](https://console.cloud.google.com/vertex-ai/models)
2. Click on your `bill-classifier-v1` model
3. Click "**DEPLOY & TEST**" tab
4. Click "**DEPLOY TO ENDPOINT**"
5. Settings:
   - Endpoint name: `bill-classifier-endpoint`
   - Location: **us-central1**
   - Machine type: **n1-standard-2** (or smaller for testing)
   - Min replicas: **1**
   - Max replicas: **1** (increase for production)
6. Click "**DEPLOY**"

**Deployment time:** 10-20 minutes

### Step 7: Get Your Endpoint ID

Once deployed, get your endpoint ID:

```bash
gcloud ai endpoints list --region=us-central1
```

Copy the endpoint ID (long number like `1234567890123456789`)

### Step 8: Configure Your App

Run the setup script:

```bash
npm run vertexai:setup
```

Or manually:

```bash
# Create secret with your endpoint ID
echo -n "YOUR_ENDPOINT_ID" | gcloud secrets create gcp-endpoint-id \
    --data-file=- \
    --replication-policy="automatic"

# Grant permissions
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding gcp-endpoint-id \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/aiplatform.user"
```

### Step 9: Deploy to Cloud Run

```bash
./scripts/deploy-cloudrun.sh
```

### Step 10: Test It!

Visit your app and scan a bill. You should now see **two AI predictions**:
- **Gemini AI:** Detailed analysis with security features
- **Bill Classifier:** Your custom model's real/fake prediction

---

## 🎯 Option 2: Use Gemini AI Only (Quick Start)

If you don't have time to train a model right now, your app **already works** with Gemini AI only!

The code automatically falls back to Gemini if Vertex AI isn't configured:

```typescript
// Your app runs both in parallel
const [vertexResult, geminiResult] = await Promise.all([
  getVertexAIPrediction(base64Data),  // Returns null if not configured
  getGeminiAnalysis(apiKey, base64Data) // Always works
])

// If Vertex AI is not configured, only Gemini results are shown
```

**Current status:** ✅ Your app is live and working with Gemini AI

**To use Gemini only permanently:**
```bash
gcloud run services update cashguard \
    --region us-central1 \
    --set-env-vars "ENABLE_VERTEX_AI=false"
```

---

## 🎯 Option 3: Use a Pre-trained Model

If you have a pre-trained model from another project:

1. **Export the model** from your old project
2. **Import to your current project:**
   ```bash
   gcloud ai models upload \
       --region=us-central1 \
       --display-name=bill-classifier-v1 \
       --artifact-uri=gs://YOUR_MODEL_BUCKET/model/ \
       --container-image-uri=us-docker.pkg.dev/vertex-ai/prediction/tf2-cpu.2-8:latest
   ```
3. **Deploy it** (see Step 6 above)
4. **Configure your app** (see Steps 7-9 above)

---

## 📊 Cost Estimates

### Training Costs (One-time)
- Dataset storage: ~$0.02/GB/month
- Training (AutoML): ~$3-12 per model (1-4 node hours)
- Total for initial setup: **~$5-15**

### Inference Costs (Ongoing)
- Vertex AI endpoint: ~$0.50/hour when running
- Predictions: ~$1.50 per 1,000 predictions
- With min 1 replica: **~$360/month** (always on)

### Cost Optimization Tips:
1. **Scale to zero when not in use:**
   ```bash
   gcloud ai endpoints undeploy-model YOUR_ENDPOINT_ID \
       --region=us-central1 \
       --deployed-model-id=DEPLOYED_MODEL_ID
   ```

2. **Use Gemini AI only** - Much cheaper and already very accurate

3. **Deploy Vertex AI only for high-value use cases**

---

## 🔍 Check Current Status

```bash
# Check if API is enabled
gcloud services list --enabled | grep aiplatform

# List datasets
gcloud ai datasets list --region=us-central1

# List models
gcloud ai models list --region=us-central1

# List endpoints
gcloud ai endpoints list --region=us-central1

# Check app logs
gcloud run logs read cashguard --region us-central1 --limit 50 | grep -i vertex
```

---

## 🎓 For Your Hackathon Submission

### If you train the model:
- ✅ Mention custom Vertex AI model training
- ✅ Show dual AI validation in demo
- ✅ Include training metrics/accuracy
- ✅ Explain ensemble approach

### If you use Gemini only:
- ✅ Still mention the Vertex AI integration code
- ✅ Explain it's ready for custom models
- ✅ Focus on AI Studio usage with Gemini
- ✅ Show the flexible architecture

**Both approaches are valid for the hackathon!**

---

## 🚀 Quick Summary

**Right now:**
- ✅ Vertex AI API: **ENABLED**
- ✅ Gemini AI: **WORKING**
- ⏳ Vertex AI Model: **NOT DEPLOYED** (optional)

**Your app works perfectly with Gemini AI alone!**

To add Vertex AI:
1. Prepare dataset with `tools/create_vertex_import_file.py`
2. Train model in Vertex AI Console
3. Deploy model to endpoint
4. Run `npm run vertexai:setup`
5. Deploy with `./scripts/deploy-cloudrun.sh`

**Need help?** See [VERTEX_AI_SETUP.md](./VERTEX_AI_SETUP.md) for detailed configuration instructions.



