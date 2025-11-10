#!/bin/bash
# Add Cloud Run domain to Firebase Authorized Domains
# This fixes the "auth/unauthorized-domain" error

set -e

echo "🔧 Adding Cloud Run Domain to Firebase Authorized Domains"
echo "=========================================================="
echo ""

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No GCP project selected"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "✅ Using GCP Project: $PROJECT_ID"
echo ""

# Get Cloud Run service URL
SERVICE_NAME="cashguard"
REGION="us-central1"

echo "📡 Getting Cloud Run service URL..."
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
    --region "${REGION}" \
    --project "${PROJECT_ID}" \
    --format="value(status.url)" 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo "❌ Error: Could not get Cloud Run service URL"
    echo "   Make sure the service is deployed: ./scripts/deploy-cloudrun.sh"
    exit 1
fi

echo "✅ Cloud Run URL: ${SERVICE_URL}"
echo ""

# Extract domain from URL
DOMAIN=$(echo "${SERVICE_URL}" | sed -e 's|^[^/]*//||' -e 's|/.*$||')
echo "🌐 Domain to authorize: ${DOMAIN}"
echo ""

# Get Firebase project ID (may be different from GCP project)
FIREBASE_PROJECT_ID="${PROJECT_ID}"

echo "📋 Instructions to add domain to Firebase:"
echo "=========================================="
echo ""
echo "1. Go to Firebase Console:"
echo "   https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/settings"
echo ""
echo "2. Scroll down to 'Authorized domains' section"
echo ""
echo "3. Click 'Add domain' button"
echo ""
echo "4. Enter the following domain:"
echo "   ${DOMAIN}"
echo ""
echo "5. Click 'Add'"
echo ""
echo "6. Wait a few seconds for the change to propagate"
echo ""
echo "✅ After adding the domain, Firebase authentication should work on Cloud Run!"
echo ""
echo "📝 Note: You can also add these domains programmatically using:"
echo "   - Firebase Admin SDK (requires service account)"
echo "   - Firebase REST API"
echo "   - gcloud CLI (if available)"
echo ""

# Check if firebase-tools is installed and try to add domain automatically
if command -v firebase &> /dev/null; then
    echo "🔍 Firebase CLI detected. Checking if we can add domain automatically..."
    echo "   (This feature may not be available in all Firebase CLI versions)"
    echo ""
    # Note: Firebase CLI doesn't have a direct command to add authorized domains
    # This would require using the Firebase Management API
fi

echo "✨ Done! Follow the instructions above to add the domain."



