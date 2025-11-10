# Firebase Setup for Cloud Run

This guide explains how to configure Firebase for your Cloud Run deployment to fix the "auth/unauthorized-domain" error.

## Problem

When deploying to Cloud Run, you may encounter this error:
```
Firebase: Error (auth/unauthorized-domain)
```

This happens because Firebase Authentication requires the Cloud Run domain to be added to the authorized domains list.

## Solution

### Option 1: Automatic (Recommended)

Use the provided script to automatically add the domain:

```bash
# Make sure you're authenticated with gcloud
gcloud auth login

# Run the script
node scripts/add-firebase-domain-api.js
```

This script will:
1. Get your Cloud Run service URL
2. Extract the domain
3. Add it to Firebase authorized domains using the Firebase Management API

### Option 2: Manual

1. **Get your Cloud Run domain:**
   ```bash
   gcloud run services describe cashguard --region us-central1 --format="value(status.url)"
   ```
   This will output something like: `https://cashguard-xxxxx-uc.a.run.app`

2. **Extract the domain:**
   From the URL above, extract the domain: `cashguard-xxxxx-uc.a.run.app`

3. **Add domain to Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to **Authentication** → **Settings** (gear icon)
   - Scroll down to **Authorized domains**
   - Click **Add domain**
   - Enter your Cloud Run domain: `cashguard-xxxxx-uc.a.run.app`
   - Click **Add**

4. **Wait for propagation:**
   - Changes may take a few seconds to propagate
   - Try accessing your Cloud Run app again

### Option 3: Using the Helper Script

The helper script provides instructions:

```bash
./scripts/add-firebase-domain.sh
```

This script will:
- Get your Cloud Run service URL
- Display the exact domain to add
- Provide step-by-step instructions

## Verification

After adding the domain:

1. **Check authorized domains:**
   - Go to Firebase Console → Authentication → Settings
   - Verify your Cloud Run domain is listed

2. **Test authentication:**
   - Visit your Cloud Run URL
   - Try signing in with Google
   - Authentication should work without errors

## Important Notes

### Domain Changes

If you redeploy Cloud Run and get a new URL:
- Cloud Run URLs are stable and don't change unless you delete and recreate the service
- If the URL does change, you'll need to add the new domain to Firebase

### Multiple Environments

If you have multiple Cloud Run services (staging, production):
- Add each domain to Firebase authorized domains
- Or use a custom domain for all environments

### Custom Domains

If you're using a custom domain:
1. Configure your custom domain in Cloud Run
2. Add the custom domain to Firebase authorized domains
3. Update your DNS records as needed

## Troubleshooting

### Error: "auth/unauthorized-domain"

**Cause:** Domain not added to Firebase authorized domains

**Solution:**
1. Verify the domain is added in Firebase Console
2. Wait a few seconds for propagation
3. Clear browser cache and try again
4. Check that you're using the correct domain (no typos)

### Error: "API request failed"

**Cause:** Authentication or permissions issue

**Solution:**
1. Make sure you're logged in: `gcloud auth login`
2. Verify you have the correct project: `gcloud config set project YOUR_PROJECT_ID`
3. Check that you have Firebase Admin permissions
4. Try the manual method instead

### Domain Not Appearing

**Cause:** Propagation delay or cache issue

**Solution:**
1. Wait 1-2 minutes for changes to propagate
2. Refresh the Firebase Console page
3. Clear browser cache
4. Try accessing the app again

## Firebase Configuration

Make sure your Firebase configuration is correct:

### Environment Variables (Cloud Run)

Your Cloud Run service should have these environment variables set from Secret Manager:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### Verify Configuration

Check your Cloud Run service configuration:

```bash
gcloud run services describe cashguard --region us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

## Additional Resources

- [Firebase Authentication Settings](https://console.firebase.google.com/project/_/authentication/settings)
- [Firebase Authorized Domains Documentation](https://firebase.google.com/docs/auth/web/redirect-best-practices)
- [Cloud Run Custom Domains](https://cloud.google.com/run/docs/mapping-custom-domains)

## Quick Reference

```bash
# Get Cloud Run URL
gcloud run services describe cashguard --region us-central1 --format="value(status.url)"

# Add domain automatically
node scripts/add-firebase-domain-api.js

# Get instructions
./scripts/add-firebase-domain.sh
```

---

**Last Updated:** 2024-11-10
**Status:** ✅ Working



