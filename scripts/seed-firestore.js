/**
 * Seed script to add initial currency reference data to Firestore
 * Run with: node scripts/seed-firestore.js
 */

import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { join } from 'path'

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json'

let credential
try {
  // Try to load from service account file
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
  credential = admin.credential.cert(serviceAccount)
} catch (error) {
  // Fall back to environment variables
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  })
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential,
  })
}

const db = admin.firestore()

async function seedCurrencyData() {
  try {
    console.log('Starting to seed Firestore with USD $20 bill reference...')

    // USD $20 bill reference document
    const currencyRef = {
      denomination: 20,
      country: 'USD',
      securityFeatures: [
        {
          name: 'watermark',
          description: 'Portrait watermark visible when held up to light',
          typicalLocation: 'Right side of the bill, visible from both sides',
        },
        {
          name: 'security_thread',
          description: 'Embedded security thread that glows blue under UV light',
          typicalLocation: 'Vertical line running through the bill',
        },
        {
          name: 'color_shifting_ink',
          description: 'Number 20 in the lower right corner shifts from copper to green when tilted',
          typicalLocation: 'Lower right corner of the front',
        },
        {
          name: 'microprinting',
          description: 'Tiny text "USA20" repeated in the security thread area',
          typicalLocation: 'Around the security thread and borders',
        },
      ],
      referenceImageUrl: '', // Will be set when reference image is uploaded
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    // Add document to currencies collection
    const docRef = await db.collection('currencies').add(currencyRef)
    console.log(`✅ Successfully added USD $20 bill reference with ID: ${docRef.id}`)
    
    // Get the created document to show the actual data
    const createdDoc = await docRef.get()
    const data = createdDoc.data()
    console.log('Currency data:', {
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
    })

    // Close the connection
    await admin.app().delete()
    console.log('✅ Seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding Firestore:', error)
    await admin.app().delete()
    process.exit(1)
  }
}

// Run the seed function
seedCurrencyData()
