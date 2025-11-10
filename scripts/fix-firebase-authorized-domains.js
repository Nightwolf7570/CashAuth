#!/usr/bin/env node
/**
 * Fix Firebase Authorized Domains for Cloud Run
 * 
 * This script adds the Cloud Run domain to Firebase authorized domains
 * to fix the "auth/unauthorized-domain" error.
 */

const { initializeApp, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

// Get Cloud Run service URL
const PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT
const SERVICE_NAME = process.env.SERVICE_NAME || 'cashguard'
const REGION = process.env.REGION || 'us-central1'

if (!PROJECT_ID) {
  console.error('❌ Error: GCP_PROJECT_ID or GOOGLE_CLOUD_PROJECT environment variable not set')
  console.error('   Run: export GCP_PROJECT_ID=your-project-id')
  process.exit(1)
}

// Get Firebase Admin credentials from environment
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || PROJECT_ID
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY

if (!FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error('❌ Error: Firebase Admin credentials not found')
  console.error('   Required environment variables:')
  console.error('   - FIREBASE_CLIENT_EMAIL or GOOGLE_CLIENT_EMAIL')
  console.error('   - FIREBASE_PRIVATE_KEY or GOOGLE_PRIVATE_KEY')
  console.error('')
  console.error('   Or use Application Default Credentials:')
  console.error('   gcloud auth application-default login')
  process.exit(1)
}

async function getCloudRunUrl() {
  const { execSync } = require('child_process')
  try {
    const url = execSync(
      `gcloud run services describe ${SERVICE_NAME} --region ${REGION} --project ${PROJECT_ID} --format="value(status.url)"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    ).trim()
    return url
  } catch (error) {
    console.error('❌ Error getting Cloud Run URL:', error.message)
    console.error('   Make sure gcloud CLI is installed and configured')
    process.exit(1)
  }
}

async function addAuthorizedDomain(domain) {
  try {
    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    })

    const auth = getAuth(app)

    // Get current authorized domains
    const config = await auth.listProviders()
    
    // Note: Firebase Admin SDK doesn't directly support modifying authorized domains
    // This needs to be done via Firebase Console or REST API
    
    console.log('ℹ️  Firebase Admin SDK cannot directly modify authorized domains.')
    console.log('   Please add the domain manually in Firebase Console:')
    console.log('')
    console.log('   1. Go to: https://console.firebase.google.com/project/' + FIREBASE_PROJECT_ID + '/authentication/settings')
    console.log('   2. Scroll to "Authorized domains"')
    console.log('   3. Click "Add domain"')
    console.log('   4. Add: ' + domain)
    console.log('')
    console.log('   Domain to add: ' + domain)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

async function main() {
  console.log('🔧 Fixing Firebase Authorized Domains for Cloud Run')
  console.log('==================================================')
  console.log('')

  // Get Cloud Run URL
  console.log('📡 Getting Cloud Run service URL...')
  const serviceUrl = await getCloudRunUrl()
  console.log('✅ Cloud Run URL: ' + serviceUrl)
  console.log('')

  // Extract domain from URL
  const domain = new URL(serviceUrl).hostname
  console.log('🌐 Domain to authorize: ' + domain)
  console.log('')

  // Add to authorized domains
  await addAuthorizedDomain(domain)
}

main().catch(console.error)



