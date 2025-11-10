# API Keys Setup Guide

You need **2 sets of API keys** to run this application:

## 1. Firebase Configuration (REQUIRED)

**Purpose:** Storage, database, authentication, and hosting

### Where to get Firebase keys:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or select existing)
3. Go to **Project Settings** (gear icon) → **Your apps**
4. Click the **Web** icon (`</>`) to add a web app
5. Register your app with a nickname (e.g., "CashGuard")
6. Copy the configuration object

You'll get values like:
```
apiKey: "AIzaSy..."
authDomain: "my-project.firebaseapp.com"
projectId: "my-project"
storageBucket: "my-project.appspot.com"
messagingSenderId: "123456789"
appId: "1:123456789:web:abc123"
```

**Also enable these Firebase services:**
- ✅ **Authentication** → Enable Google Sign-In
- ✅ **Firestore Database** → Create database
- ✅ **Storage** → Get started
- ✅ **Analytics** (optional) → Get Measurement ID (G-XXXXXXXXXX)

### Add to `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=my-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=my-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=my-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 2. Gemini API Key (REQUIRED)

**Purpose:** AI-powered currency validation

### Where to get Gemini API key:

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click **"Get API Key"** in the left sidebar
4. Click **"Create API Key"** 
5. Copy the API key (starts with `AIza...`)

**Note:** Free tier includes generous quotas for development/testing

### Add to `.env.local`:
```env
GEMINI_API_KEY=AIzaSy...
```

**Alternative:** Users can also enter their own Gemini API key in the Settings page (stored in browser localStorage)

---

## Quick Setup Checklist

- [ ] Created `.env.local` file in project root
- [ ] Added all Firebase configuration variables (7 variables)
- [ ] Added `GEMINI_API_KEY`
- [ ] Enabled Firebase Authentication (Google Sign-In)
- [ ] Enabled Firebase Firestore Database
- [ ] Enabled Firebase Storage
- [ ] Optional: Enabled Firebase Analytics

---

## Testing Your Keys

After adding keys, test the setup:

```bash
npm run dev
```

Then:
1. **Test Firebase:** Try signing in (should connect to Firebase Auth)
2. **Test Gemini:** Go to Settings page → Enter Gemini API key → Try scanning a bill

---

## Security Notes

- ✅ `.env.local` is automatically ignored by Git (won't be committed)
- ✅ Firebase client keys are safe to expose (they're public keys)
- ⚠️ **Never commit** your `.env.local` file to version control
- ⚠️ For production, add keys in your hosting platform's environment variables

---

## Troubleshooting

**Firebase errors:**
- Verify all Firebase variables are correct
- Check Firebase Console → Project Settings → Your apps
- Ensure services are enabled (Auth, Firestore, Storage)

**Gemini API errors:**
- Verify API key is correct (starts with `AIza...`)
- Check quota limits in Google AI Studio
- Try the Settings page to enter key manually (for testing)
