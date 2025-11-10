# Setup Checklist for Hackathon Demo

Use this checklist to ensure everything is configured before your demo.

## ✅ Pre-Demo Setup

### 1. Environment Variables
- [ ] Created `.env.local` file
- [ ] Added all Firebase configuration variables
- [ ] Added `GEMINI_API_KEY`
- [ ] Verified all variables are correct

### 2. Firebase Services
- [ ] Created Firebase project
- [ ] Enabled Authentication (Google Sign-In)
- [ ] Enabled Firestore Database
- [ ] Enabled Storage
- [ ] Enabled Analytics
- [ ] Enabled Performance Monitoring
- [ ] Deployed Firestore security rules
- [ ] Deployed Storage security rules

### 3. Google Services
- [ ] Obtained Gemini API key from Google AI Studio
- [ ] Verified API key works
- [ ] Checked API quota limits

### 4. Local Testing
- [ ] `npm install` completed successfully
- [ ] `npm run dev` starts without errors
- [ ] Can sign in with Google
- [ ] Camera access works
- [ ] Image capture works
- [ ] Validation API works
- [ ] History saves correctly

### 5. Deployment
- [ ] Chose deployment platform (Vercel recommended)
- [ ] Set environment variables in hosting platform
- [ ] Deployed successfully
- [ ] Tested on production URL
- [ ] HTTPS enabled (required for camera)

## 🎯 Demo Flow

1. **Home Page**
   - Show "Powered by Google Gemini" badge
   - Click "Scan Bill"

2. **Scanner Page**
   - Show camera interface
   - Capture bill image
   - Show loading states: "Compressing image...", "Analyzing with Gemini..."
   - Display results

3. **Results Page**
   - Show validation result
   - Display confidence score
   - Show detected features
   - Navigate to history

4. **History Page**
   - Show all previous scans
   - Demonstrate data persistence

## 🔧 Troubleshooting

### Camera Not Working
- Ensure HTTPS (required for camera access)
- Check browser permissions
- Try different browser (Chrome recommended)

### Authentication Issues
- Verify Firebase Auth is enabled
- Check authorized domains in Firebase Console
- Ensure Google Sign-In provider is enabled

### API Errors
- Verify `GEMINI_API_KEY` is set correctly
- Check API quota in Google AI Studio
- Verify rate limiting (10 req/min)

### Firestore Errors
- Ensure security rules are deployed
- Check user is authenticated
- Verify Firestore is enabled

## 📝 Notes for Demo

- **Highlight**: Real AI-powered validation using Google Gemini
- **Show**: Loading states and smooth transitions
- **Demonstrate**: Mobile-optimized camera experience
- **Explain**: Secure Firebase backend with authentication
- **Mention**: Analytics tracking and performance monitoring

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase (rules only)
firebase deploy --only firestore:rules,storage:rules
```

Good luck with your demo! 🎉






