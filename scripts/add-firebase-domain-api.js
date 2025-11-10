#!/usr/bin/env node
/**
 * Add Cloud Run domain to Firebase Authorized Domains using Firebase Management API
 * 
 * This script programmatically adds the Cloud Run domain to Firebase authorized domains
 * to fix the "auth/unauthorized-domain" error.
 */

const { execSync } = require('child_process')
const https = require('https')

// Get project configuration
function getProjectId() {
  try {
    return execSync('gcloud config get-value project', { encoding: 'utf-8', stdio: 'pipe' }).trim()
  } catch (error) {
    return process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || null
  }
}

const PROJECT_ID = getProjectId()
const SERVICE_NAME = process.env.SERVICE_NAME || 'cashguard'
const REGION = process.env.REGION || 'us-central1'

if (!PROJECT_ID) {
  console.error('❌ Error: Could not determine GCP project ID')
  console.error('   Run: gcloud config set project YOUR_PROJECT_ID')
  console.error('   Or set: export GCP_PROJECT_ID=your-project-id')
  process.exit(1)
}

async function getCloudRunUrl() {
  try {
    const url = execSync(
      `gcloud run services describe ${SERVICE_NAME} --region ${REGION} --project ${PROJECT_ID} --format="value(status.url)"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    ).trim()
    return url
  } catch (error) {
    console.error('❌ Error getting Cloud Run URL:', error.message)
    process.exit(1)
  }
}

async function getAccessToken() {
  try {
    const token = execSync(
      `gcloud auth print-access-token --project ${PROJECT_ID}`,
      { encoding: 'utf-8', stdio: 'pipe' }
    ).trim()
    return token
  } catch (error) {
    console.error('❌ Error getting access token:', error.message)
    console.error('   Run: gcloud auth login')
    process.exit(1)
  }
}

async function getAuthorizedDomains(projectId, accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v2/projects/${projectId}/config`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const config = JSON.parse(data)
            resolve(config.authorizedDomains || [])
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`))
          }
        } else {
          reject(new Error(`API request failed: ${res.statusCode} - ${data}`))
        }
      })
    })

    req.on('error', reject)
    req.end()
  })
}

async function updateAuthorizedDomains(projectId, accessToken, domains) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      authorizedDomains: domains,
    })

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v2/projects/${projectId}/config?updateMask=authorizedDomains`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data))
        } else {
          reject(new Error(`API request failed: ${res.statusCode} - ${data}`))
        }
      })
    })

    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

async function main() {
  console.log('🔧 Adding Cloud Run Domain to Firebase Authorized Domains')
  console.log('=========================================================')
  console.log('')

  // Get Cloud Run URL
  console.log('📡 Getting Cloud Run service URL...')
  const serviceUrl = await getCloudRunUrl()
  console.log('✅ Cloud Run URL: ' + serviceUrl)
  console.log('')

  // Extract domain
  const domain = new URL(serviceUrl).hostname
  console.log('🌐 Domain to authorize: ' + domain)
  console.log('')

  // Get access token
  console.log('🔑 Getting access token...')
  const accessToken = await getAccessToken()
  console.log('✅ Access token obtained')
  console.log('')

  // Get current authorized domains
  console.log('📋 Getting current authorized domains...')
  try {
    const currentDomains = await getAuthorizedDomains(PROJECT_ID, accessToken)
    console.log('✅ Current authorized domains: ' + currentDomains.join(', '))
    console.log('')

    // Check if domain already exists
    if (currentDomains.includes(domain)) {
      console.log('✅ Domain is already authorized!')
      console.log('   No changes needed.')
      return
    }

    // Add new domain
    const updatedDomains = [...currentDomains, domain]
    console.log('➕ Adding domain to authorized domains...')
    console.log('   New domains: ' + updatedDomains.join(', '))
    console.log('')

    // Update authorized domains
    await updateAuthorizedDomains(PROJECT_ID, accessToken, updatedDomains)
    console.log('✅ Successfully added domain to Firebase authorized domains!')
    console.log('')
    console.log('⏳ Please wait a few seconds for the change to propagate...')
    console.log('✅ Firebase authentication should now work on Cloud Run!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('')
    console.error('📝 Manual steps:')
    console.error('   1. Go to: https://console.firebase.google.com/project/' + PROJECT_ID + '/authentication/settings')
    console.error('   2. Scroll to "Authorized domains"')
    console.error('   3. Click "Add domain"')
    console.error('   4. Add: ' + domain)
    process.exit(1)
  }
}

main().catch(console.error)

