# CashGuard Project Structure

This document provides an overview of the project organization to help new developers navigate the codebase.

## 📂 Directory Structure

### `/app` - Next.js Application (App Router)
The main application using Next.js 14's app directory structure.

- **`/admin`** - Admin dashboard pages
- **`/api`** - API routes for server-side logic
  - `/admin` - Admin authentication and analytics APIs
  - `/validate` - Currency validation endpoint (Gemini AI)
- **`/scanner`** - Currency scanning interface
- **`/results`** - Validation results display
- **`/history`** - User's scan history
- **`/settings`** - User settings page
- **`layout.tsx`** - Root layout with headers, auth, and analytics
- **`page.tsx`** - Home/landing page
- **`globals.css`** - Global styles

### `/components` - React Components
Reusable UI components used throughout the application.

- `Auth.tsx` - Authentication component (Google Sign-In)
- `Header.tsx` - Navigation header
- `AnalyticsProvider.tsx` - Google Analytics wrapper
- `EducationModal.tsx` - Educational content about currency features
- `SafeImage.tsx` - Optimized image loading with fallbacks
- `ServiceWorkerRegistration.tsx` - PWA service worker registration

### `/lib` - Utility Libraries
Core application logic and helper functions.

- `firebase.ts` - Firebase client SDK initialization and config
- `firebase-admin.ts` - Firebase Admin SDK for server-side operations
- `collections.js` - Firestore collection names and references
- `performance.ts` - Firebase Performance Monitoring
- `imageCompression.ts` - Client-side image compression
- `imageUtils.ts` - Image processing utilities
- `toast.tsx` - Toast notification wrapper (react-hot-toast)
- `demo.ts` - Demo mode data and utilities

### `/docs` - Documentation
Project documentation and setup guides.

- `API_KEYS_SETUP.md` - How to obtain and configure API keys
- `FIREBASE_SETUP.md` - Firebase project configuration
- `FIREBASE_STORAGE_FIX.md` - Troubleshooting storage issues
- `GEMINI.md` - Gemini AI integration and Vertex AI details
- `SETUP_CHECKLIST.md` - Step-by-step setup checklist
- `VERIFY_SCAN_HISTORY.md` - Scan history verification guide

### `/scripts` - Node.js Scripts
Utility scripts for development and maintenance.

- `seed-firestore.js` - Seeds Firestore with initial data
- `verify-scan-history.js` - Verifies scan history data integrity

### `/tools` - Python ML/AI Tools
Python scripts for machine learning and data preparation.

- `create_vertex_import_file.py` - Prepares dataset for Vertex AI training
- `prepare_coco_dataset.py` - COCO dataset preparation for fine-tuning
- `README.md` - Documentation for Python tools
- `vertex_ai_import.csv` - Generated dataset file (gitignored)

### `/public` - Static Assets
Public files served directly by Next.js.

- **`/demo`** - Demo images for testing
  - Sample currency images (real, fake, uncertain)
  - Placeholder images
  - README with image sources
- **`/education`** - Educational SVG icons
  - Security feature illustrations (watermark, security thread, etc.)
- `sw.js` - Service worker for offline functionality

### Configuration Files (Root)

#### Firebase Configuration
- `firebase.json` - Firebase hosting and deployment config
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore composite indexes
- `storage.rules` - Firebase Storage security rules

#### Next.js Configuration
- `next.config.js` - Next.js configuration
- `next-env.d.ts` - Next.js TypeScript declarations
- `tsconfig.json` - TypeScript configuration

#### Build Tools
- `package.json` - Node.js dependencies and scripts
- `package-lock.json` - Locked dependency versions
- `postcss.config.js` - PostCSS configuration
- `tailwind.config.ts` - Tailwind CSS configuration

#### Version Control
- `.gitignore` - Git ignore patterns
  - Excludes: node_modules, .env files, build artifacts
  - Excludes: google-cloud-sdk, generated data files

## 🔧 Key Technologies

- **Frontend**: React 18, Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Firebase Functions
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Auth**: Firebase Authentication (Google Sign-In)
- **AI**: Google Gemini AI, Vertex AI
- **Analytics**: Google Analytics 4, Firebase Performance Monitoring
- **Notifications**: react-hot-toast
- **Icons**: Lucide React
- **PDF Export**: jsPDF, html2canvas

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Deploy to Firebase
npm run firebase:deploy
```

## 📝 Environment Variables

All sensitive configuration is stored in `.env.local` (not committed to git).

Required variables:
- `NEXT_PUBLIC_FIREBASE_*` - Firebase client configuration
- `GEMINI_API_KEY` - Google Gemini API key (server-side only)

See `docs/API_KEYS_SETUP.md` and `docs/FIREBASE_SETUP.md` for details.

## 🔒 Security

- **Authentication**: Required for scanner, history, and admin features
- **Firestore Rules**: Users can only access their own data
- **Storage Rules**: Users can only access images they uploaded
- **API Rate Limiting**: Validation endpoint has rate limits
- **Admin Access**: Protected by Firebase Admin SDK verification

## 📚 Additional Resources

- Main README: `/README.md`
- Setup Guide: `/docs/SETUP_CHECKLIST.md`
- API Documentation: `/README.md` → API Endpoints section
- Gemini Integration: `/docs/GEMINI.md`
- Python Tools: `/tools/README.md`

## 🤝 Contributing

When adding new files:
1. Place components in `/components`
2. Place utilities in `/lib`
3. Place pages in `/app`
4. Document in this file if adding new directories
5. Update `.gitignore` for any generated files

## 📦 Build Output

The following directories are generated during build (gitignored):
- `.next/` - Next.js build output
- `out/` - Static export output
- `node_modules/` - NPM dependencies

---

Last Updated: November 2025







