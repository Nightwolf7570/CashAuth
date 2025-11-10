# Cloud Run Deployment Guide

This guide walks you through deploying CashGuard to Google Cloud Run - a fully managed serverless platform for containerized applications.

## 📋 Prerequisites

Before deploying to Cloud Run, ensure you have:

- ✅ Google Cloud Platform account
- ✅ GCP project created
- ✅ gcloud CLI installed ([Install Guide](https://cloud.google.com/sdk/docs/install))
- ✅ Docker installed (optional, for local testing)
- ✅ Firebase project configured
- ✅ Google AI Studio API key (Gemini)

## 🎯 Why Cloud Run?

Cloud Run is perfect for this project because it:
- **Scales automatically** from 0 to N instances based on traffic
- **Pay only for what you use** (no cost when idle)
- **Handles HTTPS** and certificates automatically
- **Integrates seamlessly** with Google Cloud services
- **Supports containerized** Next.js applications perfectly

## 🚀 Quick Start (One Command Deploy)

### Option 1: Automated Deployment Script

```bash
# 1. Setup (first time only)
./scripts/setup-cloudrun.sh

# 2. Deploy
./scripts/deploy-cloudrun.sh
```

### Option 2: Manual Step-by-Step

Follow the detailed steps below for more control.

---

## 📖 Detailed Deployment Steps

### Step 1: Initial Setup

#### 1.1 Install and Configure gcloud CLI

```bash
# Install gcloud (macOS)
brew install --cask google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install

# Initialize gcloud
gcloud init

# Login to your Google account
gcloud auth login

# Set your GCP project
gcloud config set project YOUR_PROJECT_ID
```

#### 1.2 Enable Required APIs

```bash
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    containerregistry.googleapis.com \
    artifactregistry.googleapis.com
```

### Step 2: Configure Environment Variables

#### 2.1 Create Secrets in Secret Manager

Cloud Run uses Google Secret Manager for sensitive environment variables.

**Automatic Setup (Recommended):**
```bash
# This script reads your .env.local and creates secrets
npm run cloudrun:setup
```

**Manual Setup:**
```bash
# Create each secret manually
echo -n "YOUR_FIREBASE_API_KEY" | gcloud secrets create firebase-api-key --data-file=-
echo -n "YOUR_PROJECT.firebaseapp.com" | gcloud secrets create firebase-auth-domain --data-file=-
echo -n "YOUR_PROJECT_ID" | gcloud secrets create firebase-project-id --data-file=-
echo -n "YOUR_PROJECT.appspot.com" | gcloud secrets create firebase-storage-bucket --data-file=-
echo -n "YOUR_SENDER_ID" | gcloud secrets create firebase-messaging-sender-id --data-file=-
echo -n "YOUR_APP_ID" | gcloud secrets create firebase-app-id --data-file=-
echo -n "G-XXXXXXXXXX" | gcloud secrets create firebase-measurement-id --data-file=-
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
```

#### 2.2 Grant Secret Access

```bash
# Get the Cloud Run service account
PROJECT_ID=$(gcloud config get-value project)
SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"

# Grant access to all secrets
for secret in firebase-api-key firebase-auth-domain firebase-project-id firebase-storage-bucket firebase-messaging-sender-id firebase-app-id firebase-measurement-id gemini-api-key; do
    gcloud secrets add-iam-policy-binding $secret \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="roles/secretmanager.secretAccessor"
done
```

### Step 3: Build the Container

#### 3.1 Update Project ID in Scripts

Edit `package.json` and replace `PROJECT_ID` with your actual GCP project ID:

```json
{
  "scripts": {
    "cloudrun:build": "gcloud builds submit --tag gcr.io/YOUR_ACTUAL_PROJECT_ID/cashguard",
    "cloudrun:deploy": "gcloud run deploy cashguard --image gcr.io/YOUR_ACTUAL_PROJECT_ID/cashguard ..."
  }
}
```

#### 3.2 Build Using Cloud Build

```bash
# Build the container image in the cloud (recommended)
npm run cloudrun:build

# Or build locally with Docker (optional)
npm run docker:build
```

**Note:** Cloud Build is recommended as it's faster and doesn't require local Docker installation.

### Step 4: Deploy to Cloud Run

#### 4.1 Deploy the Service

```bash
# Deploy using npm script
npm run cloudrun:deploy

# Or deploy manually with full configuration
gcloud run deploy cashguard \
    --image gcr.io/YOUR_PROJECT_ID/cashguard \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 10 \
    --memory 1Gi \
    --cpu 2 \
    --timeout 300 \
    --set-secrets "NEXT_PUBLIC_FIREBASE_API_KEY=firebase-api-key:latest,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=firebase-auth-domain:latest,NEXT_PUBLIC_FIREBASE_PROJECT_ID=firebase-project-id:latest,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=firebase-storage-bucket:latest,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=firebase-messaging-sender-id:latest,NEXT_PUBLIC_FIREBASE_APP_ID=firebase-app-id:latest,NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=firebase-measurement-id:latest,GEMINI_API_KEY=gemini-api-key:latest"
```

#### 4.2 Get Your Service URL

After deployment completes, you'll see your service URL:

```
Service [cashguard] revision [cashguard-00001-abc] has been deployed and is serving 100 percent of traffic.
Service URL: https://cashguard-xxxxx-uc.a.run.app
```

### Step 5: Configure Firebase Authentication

Update your Firebase project to allow the Cloud Run domain:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Add your Cloud Run domain (e.g., `cashguard-xxxxx-uc.a.run.app`)

### Step 6: Update Firestore and Storage Rules

Your Cloud Run URL needs to be authorized in Firebase rules.

**Firestore Rules** (`firestore.rules`):
- Rules are already user-based, no changes needed

**Storage Rules** (`storage.rules`):
- Rules are already user-based, no changes needed

Deploy the rules if you haven't already:
```bash
firebase deploy --only firestore:rules,storage:rules
```

---

## 🧪 Testing Your Deployment

### Test Locally with Docker

Before deploying to Cloud Run, test locally:

```bash
# Build the Docker image
npm run docker:build

# Run locally (requires .env.local)
npm run docker:run

# Open in browser
open http://localhost:8080
```

### Test Cloud Run Deployment

```bash
# View logs
gcloud run logs read cashguard --region us-central1

# Test the service
curl https://YOUR_SERVICE_URL.run.app

# View in browser
open https://YOUR_SERVICE_URL.run.app
```

---

## 📊 Monitoring and Debugging

### View Logs

```bash
# Real-time logs
gcloud run logs tail cashguard --region us-central1

# Recent logs
gcloud run logs read cashguard --region us-central1 --limit 100

# View in Cloud Console
https://console.cloud.google.com/logs
```

### View Metrics

Access Cloud Run metrics in the console:
```
https://console.cloud.google.com/run/detail/us-central1/cashguard/metrics
```

Metrics include:
- Request count
- Request latency
- Container instance count
- CPU and memory utilization
- Error rate

### Common Issues

#### Issue: "Permission denied" when accessing secrets

**Solution:**
```bash
# Grant the Cloud Run service account access
gcloud secrets add-iam-policy-binding SECRET_NAME \
    --member="serviceAccount:YOUR_PROJECT_ID@appspot.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

#### Issue: "Container failed to start"

**Solution:**
- Check logs: `gcloud run logs read cashguard`
- Verify environment variables are set
- Test locally with Docker first

#### Issue: "502 Bad Gateway"

**Solution:**
- Container is listening on wrong port (should be 8080)
- Container takes too long to start (increase timeout)
- Check container logs for startup errors

---

## 💰 Cost Optimization

Cloud Run pricing is based on:
- CPU and memory allocated
- Request count
- Request duration

### Cost-Saving Tips

1. **Set minimum instances to 0** (already configured)
   - No cost when idle
   - Cold starts on first request (~2-3 seconds)

2. **Configure appropriate CPU throttling** (already configured)
   - CPU only allocated during requests
   - Reduces costs significantly

3. **Set reasonable limits**
   ```bash
   --min-instances 0
   --max-instances 10  # Adjust based on expected traffic
   --cpu 2
   --memory 1Gi
   ```

4. **Monitor usage**
   ```bash
   # View billing
   https://console.cloud.google.com/billing
   ```

### Estimated Costs (as of 2024)

For typical usage:
- **Free tier:** 2 million requests/month, 360,000 GB-seconds memory, 180,000 vCPU-seconds
- **Beyond free tier:** ~$0.40 per million requests + compute time
- **Idle cost:** $0 (with min-instances: 0)

---

## 🔄 Continuous Deployment

### Option 1: Cloud Build Triggers

Set up automatic deployment from GitHub:

1. Connect repository to Cloud Build
2. Create trigger on push to main branch
3. Use `cloudbuild.yaml` configuration

**Create `cloudbuild.yaml`:**
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/cashguard', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/cashguard']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args:
      - 'gcloud'
      - 'run'
      - 'deploy'
      - 'cashguard'
      - '--image'
      - 'gcr.io/$PROJECT_ID/cashguard'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
timeout: 1200s
```

### Option 2: GitHub Actions

Use GitHub Actions for CI/CD. Create `.github/workflows/deploy.yml`.

---

## 🔒 Security Best Practices

1. **Use Secret Manager** for all sensitive data ✅
2. **Enable authentication** if not a public app
3. **Set up VPC connectors** for private resources
4. **Use custom domains** with SSL certificates
5. **Enable Cloud Armor** for DDoS protection
6. **Implement rate limiting** in your API routes
7. **Regular security audits**

---

## 🌐 Custom Domain Setup

### Add Custom Domain

```bash
# Map custom domain
gcloud run domain-mappings create \
    --service cashguard \
    --domain your-domain.com \
    --region us-central1

# Get DNS records to configure
gcloud run domain-mappings describe \
    --domain your-domain.com \
    --region us-central1
```

### Configure DNS

Add the provided DNS records to your domain registrar:
- Type: A or CNAME
- Name: @ or www
- Value: (provided by Cloud Run)

---

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Next.js on Cloud Run](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)

---

## ✅ Deployment Checklist

- [ ] gcloud CLI installed and authenticated
- [ ] GCP project created and selected
- [ ] Required APIs enabled
- [ ] Secrets created in Secret Manager
- [ ] Dockerfile configured
- [ ] next.config.js set to 'standalone' output
- [ ] Container built successfully
- [ ] Service deployed to Cloud Run
- [ ] Firebase authorized domains updated
- [ ] Custom domain configured (optional)
- [ ] Monitoring and alerts set up
- [ ] Cost alerts configured

---

**Congratulations! Your CashGuard application is now running on Google Cloud Run! 🎉**

For questions or issues, check the logs and monitoring dashboards, or refer to the troubleshooting section above.







