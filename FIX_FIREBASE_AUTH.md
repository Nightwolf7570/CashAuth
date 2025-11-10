# 🔧 Fix Firebase Authentication for Cloud Run

## Problem

You're seeing this error when trying to authenticate on your Cloud Run app:
```
Firebase: Error (auth/unauthorized-domain)
```

## Quick Fix (2 minutes)

### Step 1: Get Your Cloud Run Domain

Run this command to get your Cloud Run service URL:

```bash
gcloud run services describe cashguard --region us-central1 --format="value(status.url)"
```

**Your domain is:** `cashguard-fbosdw2qda-uc.a.run.app`

### Step 2: Add Domain to Firebase

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/project/cashauth-cffa4/authentication/settings

2. **Add Authorized Domain:**
   - Scroll down to **"Authorized domains"** section
   - Click **"Add domain"** button
   - Enter: `cashguard-fbosdw2qda-uc.a.run.app`
   - Click **"Add"**

3. **Wait for Propagation:**
   - Wait 10-30 seconds for the change to take effect
   - Refresh your Cloud Run app
   - Try signing in again

### Step 3: Verify

✅ Authentication should now work on your Cloud Run app!

## Alternative: Use the Helper Script

Run this command for step-by-step instructions:

```bash
npm run firebase:domain-help
```

Or:

```bash
./scripts/add-firebase-domain.sh
```

## Why This Happens

Firebase Authentication requires that domains be explicitly authorized for security reasons. When you deploy to Cloud Run, you get a new domain (like `cashguard-htbelgb55q-uc.a.run.app`) that needs to be added to Firebase's authorized domains list.

## Important Notes

- **Stable URLs:** Cloud Run URLs are stable and won't change unless you delete and recreate the service
- **Multiple Environments:** If you have staging/production, add each domain separately
- **Custom Domains:** If you use a custom domain, add that instead

## Troubleshooting

### Domain Already Added But Still Getting Error

1. **Wait longer:** Changes can take up to 1-2 minutes to propagate
2. **Clear browser cache:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check domain spelling:** Make sure there are no typos
4. **Verify in Console:** Check Firebase Console to confirm domain is listed

### Need to Add Multiple Domains

If you have multiple Cloud Run services:
1. Get each service URL
2. Add each domain to Firebase authorized domains
3. Wait for propagation

### Using Custom Domain

If you're using a custom domain:
1. Configure custom domain in Cloud Run
2. Add custom domain to Firebase authorized domains
3. Update DNS records as needed

## Quick Reference

```bash
# Get Cloud Run URL
gcloud run services describe cashguard --region us-central1 --format="value(status.url)"

# Get instructions
npm run firebase:domain-help

# Firebase Console (direct link)
https://console.firebase.google.com/project/cashauth-cffa4/authentication/settings
```

## Still Having Issues?

1. **Check Firebase Console:** Verify domain is in the list
2. **Check Browser Console:** Look for specific error messages
3. **Verify Environment Variables:** Make sure Firebase config is correct in Cloud Run
4. **Check Firebase Project:** Ensure you're using the correct Firebase project

---

**Your Cloud Run Domain:** `cashguard-fbosdw2qda-uc.a.run.app`
**Firebase Console:** https://console.firebase.google.com/project/cashauth-cffa4/authentication/settings

✅ **After adding the domain, authentication will work!**



