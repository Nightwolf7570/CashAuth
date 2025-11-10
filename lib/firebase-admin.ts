import admin from 'firebase-admin'

let cachedAdminApp: admin.app.App | null = null
let missingCredentialsWarned = false

const REQUIRED_ENV_VARS = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY']

const hasRequiredCredentials = (): boolean =>
  REQUIRED_ENV_VARS.every((key) => Boolean(process.env[key]))

export const getAdminApp = (): admin.app.App | null => {
  if (cachedAdminApp) {
    return cachedAdminApp
  }

  if (admin.apps.length > 0) {
    cachedAdminApp = admin.app()
    return cachedAdminApp
  }

  if (!hasRequiredCredentials()) {
    if (!missingCredentialsWarned) {
      console.warn(
        'Firebase Admin credentials are not fully configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to enable server-side features.',
      )
      missingCredentialsWarned = true
    }
    return null
  }

  try {
    cachedAdminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
    cachedAdminApp = null
  }

  return cachedAdminApp
}

export const getAdminDb = () => {
  const app = getAdminApp()
  return app ? admin.firestore(app) : null
}

export const getAdminStorage = () => {
  const app = getAdminApp()
  return app ? admin.storage(app) : null
}

export default admin


