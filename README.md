# CashGuard - Currency Validation Tool

A production-ready Next.js web application for currency validation and bill scanning, powered by Google Gemini AI and Firebase. Built with TypeScript, Tailwind CSS, and a professional green/blue financial theme.

## 🚀 Features

- 📱 **Mobile-Responsive Design** - Works seamlessly on all devices
- 📷 **Camera Scanner** - Scan bills using your device's camera with mobile-optimized experience
- ✅ **Dual AI Validation** - Get instant results using TWO AI models:
  - 🧠 **Gemini AI** (via AI Studio) - Detailed security feature analysis
  - 🤖 **Bill Classifier** (Custom Vertex AI) - Real/Fake classification
- 🔐 **Firebase Authentication** - Secure Google Sign-In integration
- 📊 **Scan History** - Keep track of all your previous scans in Firestore
- 🎨 **Professional UI** - Beautiful green/blue financial theme with smooth transitions
- 📈 **Google Analytics 4** - Track page views, validation attempts, and user engagement
- ⚡ **Performance Monitoring** - Firebase Performance Monitoring integration
- 🔒 **Secure Storage** - Images stored in Firebase Storage with security rules
- 📱 **Offline Support** - Service worker for offline functionality
- 🎯 **Toast Notifications** - Real-time feedback with react-hot-toast
- 🖼️ **Image Compression** - Automatic image compression before upload
- ☁️ **Cloud Run Ready** - Fully containerized for serverless deployment

## 🎯 Hackathon Category: AI Studio - Idea to Code

This project demonstrates:
- **Google AI Studio Integration** - Uses Gemini Vision API for currency validation
- **Cloud Run Deployment** - Serverless containerized deployment
- **Applet Architecture** - Self-contained API functions
- **Rapid Prototyping** - From idea to production using AI Studio

See [`docs/AI_STUDIO_INTEGRATION.md`](docs/AI_STUDIO_INTEGRATION.md) for details on how we used AI Studio to "vibe code" this application.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Google AI Studio account (for Gemini API key)
- Firebase project (for hosting, Firestore, Storage, Auth, Analytics, Performance)

## 🛠️ Setup Instructions

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (you'll need it for environment variables)

### 2. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard:
   - Enter project name
   - Enable Google Analytics (optional but recommended)
   - Select or create an Analytics account

### 3. Enable Firebase Services

#### Enable Authentication:
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Google** sign-in provider
3. Add your domain to authorized domains if needed

#### Enable Firestore:
1. Go to **Firestore Database**
2. Click "Create database"
3. Start in **production mode** (we'll add security rules)
4. Choose your preferred location

#### Enable Storage:
1. Go to **Storage**
2. Click "Get started"
3. Start in **production mode** (we'll add security rules)
4. Use the default bucket location

#### Enable Analytics:
1. Analytics is automatically enabled when you create a Firebase project
2. Make note of your Measurement ID (G-XXXXXXXXXX)

#### Enable Performance Monitoring:
1. Go to **Performance** in Firebase Console
2. Click "Get started" (if not already enabled)
3. Follow the setup instructions

### 4. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`) to add a web app
4. Register app with a nickname (e.g., "CashGuard Web")
5. Copy the Firebase configuration object

You'll need these values:
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`
- `measurementId` (from Analytics settings)

### 5. Install Dependencies

```bash
npm install
```

### 6. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Gemini API Key (Server-side only)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 7. Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

### 8. Deploy Storage Security Rules

```bash
firebase deploy --only storage:rules
```

### 9. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚢 Deployment Options

### Option 1: Deploy to Google Cloud Run (✨ Recommended - Meets Hackathon Requirements)

Cloud Run provides fully managed serverless container deployment:

**Quick Start:**
```bash
# 1. Setup (one-time)
./scripts/setup-cloudrun.sh

# 2. Deploy
./scripts/deploy-cloudrun.sh
```

**Features:**
- ✅ Scales automatically (0 to N instances)
- ✅ Pay only for what you use ($0 when idle)
- ✅ Built-in HTTPS and CDN
- ✅ Integrates with Google AI Studio
- ✅ Meets hackathon requirements

**Full Guide:** See [`CLOUDRUN_QUICKSTART.md`](CLOUDRUN_QUICKSTART.md) or [`docs/CLOUD_RUN_DEPLOYMENT.md`](docs/CLOUD_RUN_DEPLOYMENT.md)

**⚠️ After Deployment:** If you see `auth/unauthorized-domain` error, see [`FIX_FIREBASE_AUTH.md`](FIX_FIREBASE_AUTH.md) for a quick fix.

### Option 2: Deploy to Vercel

Vercel provides seamless Next.js deployment with API routes:

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### Option 3: Deploy to Firebase Hosting with Functions

For Firebase Hosting with API routes, you need Firebase Functions:

#### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### 2. Login to Firebase

```bash
firebase login
```

#### 3. Initialize Firebase

```bash
firebase init
```

Select:
- ✅ Hosting
- ✅ Functions
- ✅ Firestore
- ✅ Storage

#### 4. Build Next.js

```bash
npm run build
```

#### 5. Set Environment Variables

For Firebase Functions, set environment variables:

```bash
firebase functions:config:set gemini.api_key="your_api_key_here"
```

Or use `.env` file in `functions/` directory.

#### 6. Deploy

```bash
firebase deploy
```

**Note:** For production, consider using Firebase Functions to handle API routes, or deploy Next.js to Vercel and configure Firebase services separately.

### Option 3: Standalone Next.js Server

You can also deploy Next.js as a standalone server to any Node.js hosting:

```bash
npm run build
npm start
```

## 📁 Project Structure

```
CashAuth/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   │   ├── admin/         # Admin API endpoints
│   │   └── validate/      # Gemini validation endpoint
│   ├── scanner/           # Scanner page
│   ├── results/           # Results page
│   ├── history/           # History page
│   ├── settings/          # Settings page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── Auth.tsx           # Authentication component
│   ├── Header.tsx         # Header component
│   ├── AnalyticsProvider.tsx # Analytics wrapper
│   ├── EducationModal.tsx # Educational content modal
│   └── SafeImage.tsx      # Safe image loading component
├── lib/                   # Utility libraries
│   ├── firebase.ts        # Firebase initialization
│   ├── firebase-admin.ts  # Firebase Admin SDK
│   ├── collections.js     # Firestore collections
│   ├── performance.ts     # Performance monitoring
│   ├── imageCompression.ts # Image compression
│   ├── imageUtils.ts      # Image utilities
│   └── toast.tsx          # Toast notifications
├── docs/                  # Project documentation
│   ├── API_KEYS_SETUP.md  # API keys setup guide
│   ├── FIREBASE_SETUP.md  # Firebase configuration
│   ├── FIREBASE_STORAGE_FIX.md # Storage troubleshooting
│   ├── GEMINI.md          # Gemini AI integration details
│   ├── SETUP_CHECKLIST.md # Setup checklist
│   └── VERIFY_SCAN_HISTORY.md # Scan history verification
├── scripts/               # Node.js utility scripts
│   ├── seed-firestore.js  # Database seeding
│   └── verify-scan-history.js # History verification
├── tools/                 # Python tools for ML/AI
│   ├── create_vertex_import_file.py # Vertex AI data prep
│   ├── prepare_coco_dataset.py # COCO dataset prep
│   └── README.md          # Tools documentation
├── public/                # Static assets
│   ├── demo/              # Demo images
│   ├── education/         # Educational SVG assets
│   └── sw.js              # Service worker
├── firebase.json          # Firebase configuration
├── firestore.rules        # Firestore security rules
├── storage.rules          # Storage security rules
├── firestore.indexes.json # Firestore indexes
└── README.md              # This file
```

## 🔒 Security Features

- **Firebase Authentication**: Required for all operations
- **Firestore Rules**: Users can only access their own scans
- **Storage Rules**: Users can only upload/access images in their own folder
- **Rate Limiting**: API endpoint has rate limiting (10 requests/minute)
- **Image Validation**: Validates image format and size before processing

## 📊 Analytics & Monitoring

### Google Analytics 4 Events Tracked:
- `page_view` - Page navigation
- `validation_attempt` - Validation attempts (success/failure)
- `validation_success` - Successful validations
- `validation_failure` - Failed validations with error details
- `user_engagement` - User interaction events

### Performance Monitoring:
- Image validation performance
- API response times
- Page load metrics

## 🎯 API Endpoints

### POST `/api/validate`
Validates a currency bill image using Google Gemini AI.

**Request:**
```json
{
  "imageBase64": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "denomination": "$20",
    "currency": "USD",
    "validity": "Valid",
    "confidence": 85,
    "features": ["Watermark detected", "Security thread verified"],
    "notes": "Additional observations"
  }
}
```

**Rate Limiting:** 10 requests per minute per IP address

## 🛠️ Technologies Used

- **Next.js 14** (App Router) - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Firebase** - Backend services
  - Authentication (Google Sign-In)
  - Firestore (Database)
  - Storage (Image storage)
  - Analytics (User tracking)
  - Performance Monitoring
- **Google Gemini AI** - Currency validation
- **react-hot-toast** - Notifications
- **browser-image-compression** - Image compression
- **Lucide React** - Icons

## 📝 Notes

- The app requires authentication to use scanner features
- Images are automatically compressed before upload to reduce storage costs
- All scans are stored in Firestore with user-specific access
- Service worker provides basic offline functionality
- Performance monitoring tracks validation API calls

## 🐛 Troubleshooting

### Camera Access Issues
- Ensure HTTPS (required for camera access)
- Check browser permissions
- Try a different browser

### Firebase Errors
- Verify environment variables are set correctly
- Check Firebase console for service status
- Ensure security rules are deployed

### Gemini API Errors
- Verify `GEMINI_API_KEY` is set correctly
- Check API quota limits in Google AI Studio
- Ensure image format is valid (JPEG, PNG, WebP)

## 📄 License

This project is built for hackathon demonstration purposes.

## 🙏 Acknowledgments

- Powered by Google Gemini AI
- Built with Firebase
- Icons by Lucide
