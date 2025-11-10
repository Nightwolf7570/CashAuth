#!/bin/bash
# One-command deployment to Cloud Run
# This script builds and deploys CashGuard to Google Cloud Run

set -e

echo "🚀 Deploying CashGuard to Cloud Run"
echo "===================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No GCP project selected"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "✅ Using GCP Project: $PROJECT_ID"
echo ""

# Load Firebase client configuration from Secret Manager for build-time injection
echo "🔐 Loading Firebase client configuration..."
NEXT_PUBLIC_FIREBASE_API_KEY=$(gcloud secrets versions access latest --secret=next-public-firebase-api-key)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$(gcloud secrets versions access latest --secret=next-public-firebase-auth-domain)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$(gcloud secrets versions access latest --secret=next-public-firebase-project-id)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$(gcloud secrets versions access latest --secret=next-public-firebase-storage-bucket)
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$(gcloud secrets versions access latest --secret=next-public-firebase-messaging-sender-id)
NEXT_PUBLIC_FIREBASE_APP_ID=$(gcloud secrets versions access latest --secret=next-public-firebase-app-id)
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$(gcloud secrets versions access latest --secret=next-public-firebase-measurement-id)

if [ -z "$NEXT_PUBLIC_FIREBASE_API_KEY" ] || [ -z "$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" ] || [ -z "$NEXT_PUBLIC_FIREBASE_PROJECT_ID" ] || [ -z "$NEXT_PUBLIC_FIREBASE_APP_ID" ]; then
    echo "❌ Error: Missing Firebase client configuration secrets"
    exit 1
fi

# Build substitutions string for Cloud Build
SUBSTITUTIONS="_NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY},_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN},_NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID},_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET},_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID},_NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID},_NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=${NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}"

# Variables
SERVICE_NAME="cashguard"
REGION="us-central1"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Build the container
echo "🔨 Building container image..."
gcloud builds submit --config=cloudbuild.yaml --substitutions "$SUBSTITUTIONS" --timeout=20m

echo "✅ Container built: ${IMAGE}"
echo ""

# Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
    --image "${IMAGE}" \
    --platform managed \
    --region "${REGION}" \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 10 \
    --memory 1Gi \
    --cpu 2 \
    --timeout 300 \
    --set-env-vars "NODE_ENV=production,GCP_PROJECT=${PROJECT_ID},GCP_LOCATION=${REGION}" \
    --set-secrets "NEXT_PUBLIC_FIREBASE_API_KEY=next-public-firebase-api-key:latest,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=next-public-firebase-auth-domain:latest,NEXT_PUBLIC_FIREBASE_PROJECT_ID=next-public-firebase-project-id:latest,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=next-public-firebase-storage-bucket:latest,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=next-public-firebase-messaging-sender-id:latest,NEXT_PUBLIC_FIREBASE_APP_ID=next-public-firebase-app-id:latest,NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=next-public-firebase-measurement-id:latest,GEMINI_API_KEY=gemini-api-key:latest,GOOGLE_CLIENT_EMAIL=google-client-email:latest,GOOGLE_PRIVATE_KEY=google-private-key:latest,GA_PROPERTY_ID=ga-property-id:latest,GCP_ENDPOINT_ID=gcp-endpoint-id:latest"

echo ""
echo "🎉 Deployment complete!"
echo ""

# Get the service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --platform managed --region "${REGION}" --format 'value(status.url)')

echo "✅ Your application is live at:"
echo "   ${SERVICE_URL}"
echo ""
echo "📊 View logs:"
echo "   gcloud run logs read ${SERVICE_NAME} --region ${REGION}"
echo ""
echo "📈 View metrics:"
echo "   https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/metrics?project=${PROJECT_ID}"



