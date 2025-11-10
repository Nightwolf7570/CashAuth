#!/bin/bash
# Setup Vertex AI Bill Classifier for Cloud Run
# This script configures the Vertex AI endpoint secret

set -e

echo "🤖 Vertex AI Bill Classifier Setup"
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

# Get project number
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
echo "📋 Project Number: $PROJECT_NUMBER"
echo ""

# List available Vertex AI endpoints
echo "🔍 Finding Vertex AI endpoints in us-central1..."
ENDPOINTS=$(gcloud ai endpoints list --region=us-central1 --format="table(name,displayName)" 2>/dev/null || true)

if [ -z "$ENDPOINTS" ]; then
    echo "⚠️  No Vertex AI endpoints found in us-central1"
    echo ""
    echo "Options:"
    echo "  1. Train a model in Vertex AI: https://console.cloud.google.com/vertex-ai/models"
    echo "  2. Check a different region"
    echo "  3. Disable Vertex AI and use Gemini only"
    echo ""
    exit 0
else
    echo "📊 Available endpoints:"
    echo "$ENDPOINTS"
    echo ""
fi

# Prompt for endpoint ID
echo "Enter your Vertex AI Endpoint ID (just the number):"
echo "Example: 1234567890123456789"
read -p "Endpoint ID: " ENDPOINT_ID

if [ -z "$ENDPOINT_ID" ]; then
    echo "❌ Error: Endpoint ID is required"
    exit 1
fi

echo ""
echo "🔐 Creating secret in Secret Manager..."

# Check if secret exists
if gcloud secrets describe gcp-endpoint-id --project="$PROJECT_ID" &> /dev/null; then
    echo "  ↻ Updating existing secret: gcp-endpoint-id"
    echo -n "$ENDPOINT_ID" | gcloud secrets versions add gcp-endpoint-id --data-file=-
else
    echo "  + Creating new secret: gcp-endpoint-id"
    echo -n "$ENDPOINT_ID" | gcloud secrets create gcp-endpoint-id --data-file=- --replication-policy="automatic"
fi

echo "✅ Secret created/updated"
echo ""

# Grant Cloud Run service account access to secret
echo "🔑 Granting Cloud Run access to secret..."
gcloud secrets add-iam-policy-binding gcp-endpoint-id \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

echo "✅ IAM permissions granted"
echo ""

# Grant Vertex AI permissions to Cloud Run service account
echo "🔑 Granting Vertex AI access to Cloud Run service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/aiplatform.user" \
    --quiet

echo "✅ Vertex AI permissions granted"
echo ""

echo "🎉 Vertex AI Bill Classifier setup complete!"
echo ""
echo "Next steps:"
echo "  1. Deploy to Cloud Run: ./scripts/deploy-cloudrun.sh"
echo "  2. Test your app - both AI models will run in parallel"
echo "  3. Check results page for dual AI validation"
echo ""
echo "Configuration:"
echo "  • Endpoint ID: $ENDPOINT_ID"
echo "  • Region: us-central1"
echo "  • Project: $PROJECT_ID"
echo ""
echo "To disable Vertex AI later:"
echo "  gcloud run services update cashguard --region us-central1 --set-env-vars ENABLE_VERTEX_AI=false"



