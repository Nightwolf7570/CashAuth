# 🚀 Cloud Run Quick Start Guide

Deploy CashGuard to Google Cloud Run in 3 simple steps!

## Prerequisites

- Google Cloud Platform account
- gcloud CLI installed: `brew install --cask google-cloud-sdk`
- `.env.local` file with your API keys (see `docs/API_KEYS_SETUP.md`)

## 🎯 Three-Step Deployment

### Step 1: Set Your GCP Project

```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID (replace with your actual project ID)
gcloud config set project YOUR_PROJECT_ID
```

### Step 2: Setup Secrets & Environment

```bash
# This automatically creates secrets from your .env.local file
./scripts/setup-cloudrun.sh
```

This script will:
- ✅ Enable required Google Cloud APIs
- ✅ Create secrets in Secret Manager
- ✅ Configure IAM permissions

### Step 3: Build & Deploy

```bash
# One command to build and deploy!
./scripts/deploy-cloudrun.sh
```

This script will:
- 🔨 Build your Docker container using Cloud Build
- 🚢 Deploy to Cloud Run with optimized configuration
- 🌐 Provide you with a live URL

## ✨ That's It!

Your app will be live at: `https://cashguard-xxxxx-uc.a.run.app`

## 📋 Important: Update Firebase

After deployment, add your Cloud Run URL to Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Authentication** → **Settings** → **Authorized domains**
3. Add your Cloud Run domain (without https://)

## 🎨 Custom Configuration

### Update Project ID in package.json

Before deploying, replace `PROJECT_ID` in `package.json`:

```json
{
  "scripts": {
    "cloudrun:build": "gcloud builds submit --tag gcr.io/YOUR_ACTUAL_PROJECT_ID/cashguard",
    "cloudrun:deploy": "gcloud run deploy cashguard --image gcr.io/YOUR_ACTUAL_PROJECT_ID/cashguard ..."
  }
}
```

### Customize Deployment Region

Edit `scripts/deploy-cloudrun.sh` to change region:

```bash
REGION="us-central1"  # Change to your preferred region
# Options: us-central1, us-east1, europe-west1, asia-east1, etc.
```

## 📊 Monitoring Your Deployment

### View Logs

```bash
# Real-time logs
gcloud run logs tail cashguard --region us-central1

# Recent logs
gcloud run logs read cashguard --region us-central1 --limit 50
```

### View Metrics

Access your Cloud Run dashboard:
```
https://console.cloud.google.com/run
```

## 🧪 Test Locally First (Optional)

```bash
# Build Docker image locally
npm run docker:build

# Run locally on port 8080
npm run docker:run

# Test in browser
open http://localhost:8080
```

## 💰 Cost Information

**Cloud Run Free Tier:**
- 2 million requests/month
- 360,000 GB-seconds memory
- 180,000 vCPU-seconds

**Beyond free tier:** ~$0.40 per million requests

**With `min-instances: 0` (default):** $0 cost when idle!

## 🔧 Troubleshooting

### Issue: "Permission denied" errors

**Solution:** Ensure you're logged in and have owner/editor role:
```bash
gcloud auth login
gcloud auth application-default login
```

### Issue: Build fails

**Solution:** Check that Dockerfile and next.config.js are correct:
```bash
# Verify standalone output is enabled
grep "output.*standalone" next.config.js
```

### Issue: Deployment succeeds but app doesn't load

**Solution:** 
1. Check logs: `gcloud run logs read cashguard`
2. Verify secrets are set correctly
3. Check Firebase authorized domains

## 📚 Detailed Documentation

For more details, see:
- **Full Guide:** [`docs/CLOUD_RUN_DEPLOYMENT.md`](docs/CLOUD_RUN_DEPLOYMENT.md)
- **AI Studio:** [`docs/AI_STUDIO_INTEGRATION.md`](docs/AI_STUDIO_INTEGRATION.md)
- **Firebase Setup:** [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md)

## 🎯 Hackathon Requirements

This project meets Google AI Studio hackathon requirements:

✅ **Coded with Google AI Studio** - Uses Gemini API for currency validation  
✅ **Deployed to Cloud Run** - Containerized Next.js app  
✅ **Applet Function** - Serverless API routes architecture  

See [`docs/AI_STUDIO_INTEGRATION.md`](docs/AI_STUDIO_INTEGRATION.md) for details.

## 🆘 Need Help?

- **Cloud Run Issues:** See [Cloud Run Troubleshooting](https://cloud.google.com/run/docs/troubleshooting)
- **Firebase Issues:** See [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md)
- **API Key Issues:** See [`docs/API_KEYS_SETUP.md`](docs/API_KEYS_SETUP.md)

---

**Happy deploying! 🎉**







