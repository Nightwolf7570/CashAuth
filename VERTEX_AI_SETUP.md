# 🤖 Vertex AI Bill Classifier Setup

Your CashGuard app includes a **custom-trained Vertex AI model** (Bill Classifier) that works alongside Gemini AI to provide dual AI validation.

## 📋 What You Need

To enable the Vertex AI Bill Classifier on Cloud Run, you need your **Vertex AI Endpoint ID**.

---

## 🔍 Find Your Vertex AI Endpoint ID

### Option 1: Google Cloud Console

1. Go to [Vertex AI Endpoints](https://console.cloud.google.com/vertex-ai/endpoints)
2. Select your project
3. Find your Bill Classifier model endpoint
4. Copy the **Endpoint ID** (it's a long number like `1234567890123456789`)

### Option 2: gcloud CLI

```bash
# List all endpoints in your project
gcloud ai endpoints list --region=us-central1

# Output will show:
# ENDPOINT_ID: 1234567890123456789
# DISPLAY_NAME: bill_classifier_endpoint
```

---

## ⚙️ Configure Cloud Run

### Step 1: Create Secret in Secret Manager

```bash
# Replace YOUR_ENDPOINT_ID with your actual endpoint ID
echo -n "YOUR_ENDPOINT_ID" | gcloud secrets create gcp-endpoint-id \
    --data-file=- \
    --replication-policy="automatic"
```

If the secret already exists, update it:

```bash
echo -n "YOUR_ENDPOINT_ID" | gcloud secrets versions add gcp-endpoint-id --data-file=-
```

### Step 2: Grant Cloud Run Access to Secret

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Grant access
gcloud secrets add-iam-policy-binding gcp-endpoint-id \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### Step 3: Deploy to Cloud Run

```bash
./scripts/deploy-cloudrun.sh
```

The script has been updated to automatically include:
- `GCP_PROJECT` - Your GCP project ID (auto-set)
- `GCP_LOCATION` - Region (auto-set to us-central1)
- `GCP_ENDPOINT_ID` - Your Vertex AI endpoint (from Secret Manager)

---

## ✅ Verify It Works

After deployment, test your app:

1. Go to your Cloud Run URL: `https://cashguard-htbelgb55q-uc.a.run.app`
2. Sign in and scan a bill
3. Check the results page - you should now see **TWO** AI validations:
   - **Gemini AI** (detailed analysis)
   - **Bill Classifier** (Vertex AI) (real/fake classification)

### Check Logs

```bash
gcloud run logs read cashguard --region us-central1 --limit 50
```

Look for:
- ✅ **Success:** `"vertexConfidence": 95, "vertexValidity": "Valid"`
- ❌ **Missing config:** `"Vertex AI environment variables are not set"`
- ❌ **Wrong endpoint:** `"Vertex AI endpoint not found"`

---

## 🔧 Troubleshooting

### Error: "Vertex AI environment variables are not set"

**Cause:** The `GCP_ENDPOINT_ID` secret is not configured.

**Fix:**
```bash
# Create the secret (see Step 1 above)
echo -n "YOUR_ENDPOINT_ID" | gcloud secrets create gcp-endpoint-id --data-file=- --replication-policy="automatic"

# Redeploy
./scripts/deploy-cloudrun.sh
```

### Error: "Vertex AI endpoint not found"

**Cause:** The endpoint ID is incorrect or doesn't exist.

**Fix:**
```bash
# Verify your endpoint exists
gcloud ai endpoints list --region=us-central1

# Update the secret with correct ID
echo -n "CORRECT_ENDPOINT_ID" | gcloud secrets versions add gcp-endpoint-id --data-file=-

# Redeploy
./scripts/deploy-cloudrun.sh
```

### Error: "Permission denied"

**Cause:** Cloud Run service account doesn't have access to call Vertex AI.

**Fix:**
```bash
# Get project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Grant Vertex AI User role
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/aiplatform.user"
```

### Disable Vertex AI Temporarily

If you want to use only Gemini AI:

```bash
gcloud run services update cashguard \
    --region us-central1 \
    --set-env-vars "ENABLE_VERTEX_AI=false"
```

---

## 📊 How It Works

The validation endpoint (`/api/validate`) runs **both AI models in parallel**:

```typescript
// Both predictions run simultaneously
const [vertexResult, geminiResult] = await Promise.all([
  getVertexAIPrediction(base64Data),  // Your custom Bill Classifier
  getGeminiAnalysis(apiKey, base64Data) // Gemini Vision AI
])

// Results combined:
{
  "geminiValidity": "Valid",
  "geminiConfidence": 85,
  "vertexValidity": "Valid",  // From your trained model
  "vertexConfidence": 92,     // From your trained model
  "denomination": "$20",
  "features": [...]
}
```

**Benefits:**
- 🎯 **Dual validation** - Two AI opinions for higher confidence
- 🚀 **Fast** - Parallel execution, no extra latency
- 🧠 **Smart** - Your custom model + Gemini's vision capabilities

---

## 🎓 For Hackathon Submission

This demonstrates:
- ✅ Custom ML model training on Vertex AI
- ✅ Integration with AI Studio (Gemini)
- ✅ Production deployment on Cloud Run
- ✅ Advanced AI architecture (ensemble/dual validation)

**Add to your submission:**
- Mention the custom-trained Vertex AI Bill Classifier model
- Explain the dual AI validation approach
- Show both predictions in your demo video
- Include screenshots of Vertex AI endpoint in Cloud Console

---

## 📝 Quick Setup Checklist

- [ ] Find your Vertex AI Endpoint ID
- [ ] Create `gcp-endpoint-id` secret in Secret Manager
- [ ] Grant Cloud Run service account access to the secret
- [ ] Grant `roles/aiplatform.user` to Cloud Run service account
- [ ] Deploy with `./scripts/deploy-cloudrun.sh`
- [ ] Test and verify both AI predictions appear
- [ ] Check logs for any errors

---

## 💡 Tips

1. **Cost Optimization:** Vertex AI predictions cost more than Gemini. Consider using Vertex AI only for high-value transactions.

2. **Model Retraining:** Update your model periodically with new counterfeit examples to improve accuracy.

3. **Confidence Weighting:** You can average both AI confidences or use the higher/lower one based on your use case.

4. **Fallback:** The code gracefully handles Vertex AI failures - if it's not configured, Gemini AI continues to work.

---

Need help? Check the [Vertex AI documentation](https://cloud.google.com/vertex-ai/docs) or reach out!



