# Gemini Project Context: CashGuard

This document provides a comprehensive overview of the CashGuard project, its structure, and key operational commands to facilitate efficient development and interaction with the Gemini CLI.

## Project Overview

CashGuard is a full-stack web application for currency validation. It allows users to scan currency bills using their device's camera, and it uses the Google Gemini AI model to analyze the image and determine the bill's authenticity.

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Next.js API Routes
- **AI:** Google Gemini AI for image analysis
- **Services:**
    - **Firebase Authentication:** For user sign-in (Google).
    - **Firestore:** To store user scan history.
    - **Firebase Storage:** To store uploaded bill images.
    - **Google Analytics 4:** For tracking user engagement and events.
    - **Firebase Performance Monitoring:** To track application performance.
- **Key Features:**
    - Mobile-responsive camera interface for scanning bills.
    - Real-time validation results.
    - Secure user accounts and data storage.
    - Demo mode with pre-loaded images.
    - Client-side image compression before upload.
    - Offline support via a service worker.

## Project Structure

```
/
├── app/                    # Next.js App Router directory
│   ├── api/validate/       # API endpoint for Gemini validation
│   ├── scanner/            # Bill scanning page
│   ├── results/            # Scan results page
│   ├── history/            # User's scan history page
│   ├── layout.tsx          # Root application layout
│   └── page.tsx            # Home page
├── components/             # Reusable React components (Auth, Header, etc.)
├── lib/                    # Core logic and utilities
│   ├── firebase.ts         # Firebase SDK initialization and config
│   ├── firestore.ts        # Firestore database operations
│   ├── analytics.ts        # Google Analytics tracking functions
│   └── imageCompression.ts # Client-side image compression logic
├── public/                 # Static assets (e.g., service worker `sw.js`)
├── firebase.json           # Firebase project configuration
├── firestore.rules         # Security rules for Firestore
├── storage.rules           # Security rules for Firebase Storage
├── next.config.js          # Next.js configuration
└── package.json            # Project dependencies and scripts
```

## Building and Running

The project uses `npm` as its package manager.

### Development

To run the local development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Build

To create a production-ready build:

```bash
npm run build
```

To start the production server after building:

```bash
npm start
```

### Linting

To check for code quality and style issues:

```bash
npm run lint
```

### Deployment

The project is configured for deployment to Firebase. This command builds the app and deploys hosting, Firestore rules, and Storage rules.

```bash
npm run firebase:deploy
```

## Development Conventions

- **Environment Variables:** All API keys and Firebase configuration details must be stored in a `.env.local` file at the project root. Refer to `SETUP_CHECKLIST.md` for the required variables.
- **API:** The core validation logic is handled by the `POST /api/validate` endpoint, which communicates with the Gemini API. This endpoint is rate-limited.
- **Firebase:** Client-side Firebase initialization happens in `lib/firebase.ts`. The configuration is loaded from environment variables prefixed with `NEXT_PUBLIC_`.
- **Security:** User data is protected by Firebase Security Rules. `firestore.rules` ensures users can only access their own scan history, and `storage.rules` restricts image access to the uploading user.
- **Styling:** The UI is built with Tailwind CSS. Color definitions (`primary`, `secondary`) are configured in `tailwind.config.ts`.
- **State Management:** The application primarily uses React's built-in state management (`useState`, `useEffect`). For cross-page state, it uses `sessionStorage` (e.g., for demo results).

## Vertex AI Model Training

To complement the Gemini API, the project also uses a custom-trained model on Google Cloud's Vertex AI for classifying currency as "real" or "fake".

### Data Preparation

The source dataset is stored in Google Cloud Storage and uses the COCO JSON format for annotations. A custom Python script, `tools/create_vertex_import_file.py`, was created to prepare this data for Vertex AI.

- **Purpose**: The script reads the `_annotations.coco.json` files from the `train/`, `valid/`, and `test/` directories in the GCS bucket.
- **Logic**:
    - It maps detailed categories (e.g., "Genuine fifty dollars") to simplified labels (`real` or `fake`).
    - It verifies that each image referenced in the annotations actually exists in GCS, skipping any missing files to prevent import errors.
    - It handles duplicate annotations for a single image.
- **Output**: It generates a single `vertex_ai_import.csv` file with the format `SET,GCS_URI,LABEL`.
- **Location**: See `/tools/README.md` for usage instructions and requirements.

### Model Training

The `tools/vertex_ai_import.csv` file is uploaded to GCS and used to create a new **Image Classification** dataset in Vertex AI.

- **Training Method**: AutoML
- **Objective**: Single-label classification
- **Deployment**: The model is trained as a **Cloud** model, which provides an API endpoint for online predictions, suitable for the web application's backend.
