#!/bin/bash
# Setup Custom Domain for Cloud Run
# This script helps you map a custom domain to your Cloud Run service

set -e

echo "🌐 Setting up Custom Domain for Cloud Run"
echo "=========================================="
echo ""

PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="cashguard"
REGION="us-central1"

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No GCP project selected"
    exit 1
fi

echo "✅ Project: $PROJECT_ID"
echo "✅ Service: $SERVICE_NAME"
echo "✅ Region: $REGION"
echo ""

# Get current service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)" 2>/dev/null)
echo "Current URL: $SERVICE_URL"
echo ""

echo "📋 Steps to set up a custom domain:"
echo "===================================="
echo ""
echo "Option 1: Use Cloud Run Domain Mapping (Recommended)"
echo "----------------------------------------------------"
echo "1. Get a domain from a registrar (Google Domains, Namecheap, etc.)"
echo "2. Map domain to Cloud Run:"
echo "   gcloud run domain-mappings create --service $SERVICE_NAME --domain yourdomain.com --region $REGION"
echo "3. Follow DNS instructions provided by gcloud"
echo "4. Add domain to Firebase authorized domains"
echo ""
echo "Option 2: Use Firebase Hosting (Alternative)"
echo "---------------------------------------------"
echo "1. Get a domain"
echo "2. Set up Firebase Hosting"
echo "3. Configure rewrites to proxy to Cloud Run"
echo "4. Add custom domain in Firebase Hosting"
echo ""
echo "📝 Quick Commands:"
echo "------------------"
echo "# Map domain to Cloud Run:"
echo "gcloud run domain-mappings create --service $SERVICE_NAME --domain YOUR_DOMAIN --region $REGION"
echo ""
echo "# List domain mappings:"
echo "gcloud run domain-mappings list --region $REGION"
echo ""
echo "# Get DNS records:"
echo "gcloud run domain-mappings describe YOUR_DOMAIN --region $REGION"
echo ""

