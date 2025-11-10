#!/bin/bash
# Setup script for Cloud Run deployment
# This script configures Secret Manager and prepares Cloud Run environment

set -e

echo "🚀 CashGuard Cloud Run Setup Script"
echo "===================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Please install: https://cloud.google.com/sdk/docs/install"
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

# Enable required APIs
echo "📦 Enabling required Google Cloud APIs..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    containerregistry.googleapis.com \
    artifactregistry.googleapis.com

echo "✅ APIs enabled"
echo ""

# Create secrets from .env.local if it exists
if [ -f .env.local ]; then
    echo "🔐 Creating secrets in Secret Manager..."
    
    # Read .env.local and create secrets
    while IFS='=' read -r key value; do
        # Skip empty lines and comments
        [[ -z "$key" || "$key" =~ ^#.* ]] && continue
        
        # Remove any quotes from value
        value=$(echo "$value" | sed 's/^["'\'']//' | sed 's/["'\'']$//')
        
        # Convert to lowercase for secret name
        secret_name=$(echo "$key" | tr '[:upper:]' '[:lower:]' | tr '_' '-')
        
        # Check if secret already exists
        if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" &> /dev/null; then
            echo "  ↻ Updating secret: $secret_name"
            echo -n "$value" | gcloud secrets versions add "$secret_name" --data-file=-
        else
            echo "  + Creating secret: $secret_name"
            echo -n "$value" | gcloud secrets create "$secret_name" --data-file=- --replication-policy="automatic"
        fi
    done < .env.local
    
    echo "✅ Secrets created/updated in Secret Manager"
else
    echo "⚠️  Warning: .env.local not found"
    echo "   You'll need to manually create secrets in Secret Manager"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update package.json scripts with your PROJECT_ID"
echo "  2. Run: npm run cloudrun:build"
echo "  3. Run: npm run cloudrun:deploy"
echo ""
echo "Or use the all-in-one script: ./scripts/deploy-cloudrun.sh"







