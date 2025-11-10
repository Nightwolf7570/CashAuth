# 📍 Where to Add Authorized Domains in Firebase

## Direct Link (Fastest Way)

**Click this link to go directly to the authorized domains section:**
https://console.firebase.google.com/project/cashguardian7570/authentication/settings

## Step-by-Step Instructions

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/
2. Sign in with your Google account
3. Select your project: **cashguardian7570**

### Step 2: Navigate to Authentication Settings
1. In the left sidebar, click on **"Authentication"**
2. Click on the **"Settings"** tab (or gear icon ⚙️ at the top)
3. You should see a page titled **"Users"** with tabs at the top

### Step 3: Find Authorized Domains Section
1. Scroll down on the Settings page
2. Look for the section called **"Authorized domains"**
3. You'll see a list of domains that are currently authorized
4. By default, you'll see:
   - `localhost` (for local development)
   - `your-project.firebaseapp.com` (Firebase hosting)
   - `your-project.web.app` (Firebase hosting)

### Step 4: Add Your Cloud Run Domain
1. Click the **"Add domain"** button
2. A dialog box will appear
3. Enter your Cloud Run domain: `cashguard-htbelgb55q-uc.a.run.app`
4. Click **"Add"**

### Step 5: Verify
1. You should see your domain added to the list
2. Wait 10-30 seconds for the change to propagate
3. Refresh your Cloud Run app and try signing in

## Visual Guide

```
Firebase Console
├── Project: cashguardian7570
├── Left Sidebar
│   └── Authentication ← Click here
│       └── Settings tab ← Click here
│           └── Scroll down
│               └── "Authorized domains" section ← Here!
│                   └── "Add domain" button ← Click this
│                       └── Enter: cashguard-htbelgb55q-uc.a.run.app
```

## Exact URL Path

**Full URL:**
```
https://console.firebase.google.com/project/cashguardian7570/authentication/settings
```

**Path Structure:**
```
console.firebase.google.com
  /project/{PROJECT_ID}
    /authentication
      /settings
```

## What You'll See

### Before Adding Domain:
```
Authorized domains
─────────────────
✓ localhost
✓ cashguardian7570.firebaseapp.com
✓ cashguardian7570.web.app

[Add domain] button
```

### After Adding Domain:
```
Authorized domains
─────────────────
✓ localhost
✓ cashguardian7570.firebaseapp.com
✓ cashguardian7570.web.app
✓ cashguard-htbelgb55q-uc.a.run.app  ← Your new domain

[Add domain] button
```

## Quick Access Methods

### Method 1: Direct Link (Recommended)
Click: https://console.firebase.google.com/project/cashguardian7570/authentication/settings

### Method 2: From Firebase Home
1. Go to: https://console.firebase.google.com/
2. Select project: cashguardian7570
3. Click: Authentication → Settings
4. Scroll to: Authorized domains

### Method 3: Using the Helper Script
```bash
npm run firebase:domain-help
```

## Your Domain to Add

```
cashguard-htbelgb55q-uc.a.run.app
```

## Troubleshooting

### Can't Find the Settings Tab?
- Make sure you're in the **Authentication** section
- Look for a gear icon ⚙️ or "Settings" tab at the top
- It might be labeled as "Settings" or "Project settings"

### Don't See "Authorized domains"?
- Scroll down on the Settings page
- It's usually near the bottom of the page
- Look for a section with a list of domains

### Add Domain Button Not Working?
- Make sure you have the correct permissions
- You need to be an owner or have Editor role
- Try refreshing the page

### Domain Already Exists?
- Check if the domain is already in the list
- If it's there, you're all set!
- Just wait for propagation and test

## After Adding the Domain

1. **Wait 10-30 seconds** for changes to propagate
2. **Clear browser cache** (optional but recommended)
3. **Refresh your Cloud Run app**
4. **Try signing in** - it should work now!

## Verification

To verify the domain was added:
1. Go back to the authorized domains section
2. Look for `cashguard-htbelgb55q-uc.a.run.app` in the list
3. It should have a checkmark ✓ next to it

## Need Help?

If you're still having trouble:
1. Check the browser console for error messages
2. Verify you're using the correct Firebase project
3. Make sure the domain spelling is correct
4. Wait a bit longer for propagation (can take up to 2 minutes)

---

**Direct Link:** https://console.firebase.google.com/project/cashguardian7570/authentication/settings
**Domain to Add:** `cashguard-htbelgb55q-uc.a.run.app`

✅ **Once added, authentication will work on your Cloud Run app!**



