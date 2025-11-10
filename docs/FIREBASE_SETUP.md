# Firebase Setup Guide

This project uses Firebase for data storage, image storage, and authentication.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Client Configuration (for browser/client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin Configuration (for server-side operations)
# Option 1: Use service account JSON file path
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Option 2: Use environment variables (alternative to service account file)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

## Firestore Collections

### Collection: "currencies"
- `denomination` (number): 1, 5, 10, 20, 50, 100
- `country` (string): "USD", "EUR", etc.
- `securityFeatures` (array of objects):
  - `name` (string): watermark, security_thread, etc.
  - `description` (string)
  - `typicalLocation` (string)
- `referenceImageUrl` (string): Firebase Storage URL
- `createdAt` (timestamp)

### Collection: "validations"
- `timestamp` (Firebase timestamp)
- `billImageUrl` (string): Firebase Storage URL
- `denominationDetected` (number)
- `result` (string): "REAL", "FAKE", "UNCERTAIN"
- `confidenceScore` (number): 0-100
- `featuresDetected` (array of objects)
- `userId` (string, optional)

## Firebase Storage Structure

- `/bills/` - Scanned bill images
- `/references/` - Reference currency images

## Security Rules

Firestore and Storage rules are configured in:
- `firestore.rules` - Firestore database rules
- `storage.rules` - Firebase Storage rules

Currently, both collections allow read/write access for development. **Remember to update these rules for production use.**

## Seeding Data

To seed Firestore with the initial USD $20 bill reference:

```bash
npm run seed:firestore
```

This will add a USD $20 bill reference document with 4 security features:
1. Watermark
2. Security thread
3. Color shifting ink
4. Microprinting

## Firebase Configuration Files

- `/lib/firebase.js` - Client-side Firebase initialization (Firestore, Storage, Auth)
- `/lib/firebase-admin.js` - Server-side Firebase Admin SDK initialization
- `/scripts/seed-firestore.js` - Script to seed initial data


