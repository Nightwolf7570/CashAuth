import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import {
  getFirestore,
  Firestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  QueryConstraint,
  Query,
  DocumentData,
  getDoc,
} from 'firebase/firestore'
import {
  getStorage,
  FirebaseStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  uploadBytes,
} from 'firebase/storage'
import { getPerformance } from 'firebase/performance'

interface FirebaseConfig {
  apiKey?: string
  authDomain?: string
  projectId?: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
  measurementId?: string
}

declare global {
  interface Window {
    __FIREBASE_CONFIG__?: FirebaseConfig
  }
}

function readRuntimeFirebaseConfig(): FirebaseConfig {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    return window.__FIREBASE_CONFIG__ || {}
  } catch (error) {
    console.warn('Unable to read runtime Firebase config:', error)
    return {}
  }
}

function resolveFirebaseConfig(): FirebaseConfig {
  const runtimeConfig = readRuntimeFirebaseConfig()

  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || runtimeConfig.apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || runtimeConfig.authDomain,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || runtimeConfig.projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || runtimeConfig.storageBucket,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || runtimeConfig.messagingSenderId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || runtimeConfig.appId,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || runtimeConfig.measurementId,
  }
}

// SECURITY: No hardcoded Firebase configuration
// All Firebase configuration must come from environment variables
// This ensures API keys are not exposed in source code
const envFirebaseConfig: FirebaseConfig = resolveFirebaseConfig()

// Validate that required Firebase configuration is present
const requiredFirebaseKeys: (keyof FirebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'appId']
const missingKeys = requiredFirebaseKeys.filter((key) => !envFirebaseConfig[key])

if (missingKeys.length > 0 && typeof window !== 'undefined') {
  console.error(
    `Firebase configuration missing. Please set the following environment variables: ${missingKeys
      .map((key) => `NEXT_PUBLIC_FIREBASE_${key.toUpperCase().replace(/([A-Z])/g, '_$1')}`)
      .join(', ')}`
  )
}

// Firebase configuration - all values must come from environment variables
// In production (Cloud Run), these are injected from Secret Manager
const firebaseConfig: Required<FirebaseConfig> = {
  apiKey: envFirebaseConfig.apiKey || '',
  authDomain: envFirebaseConfig.authDomain || '',
  projectId: envFirebaseConfig.projectId || '',
  storageBucket: envFirebaseConfig.storageBucket || '',
  messagingSenderId: envFirebaseConfig.messagingSenderId || '',
  appId: envFirebaseConfig.appId || '',
  measurementId: envFirebaseConfig.measurementId || '',
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null
let performance: ReturnType<typeof getPerformance> | null = null
let configWarningShown = false
let storageWarningShown = false
let messagingWarningShown = false
const STORAGE_ENV_ENABLED =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_ENABLED === 'true'
    : false
let storageStatusCache: 'unknown' | 'working' | 'failed' = STORAGE_ENV_ENABLED ? 'unknown' : 'failed'

const REQUIRED_CONFIG_KEYS: (keyof FirebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'appId']

function warnIfUsingFallbackConfig(): void {
  if (configWarningShown) {
    return
  }

  const missingEnvKeys = REQUIRED_CONFIG_KEYS.filter((key) => !envFirebaseConfig[key])

  if (missingEnvKeys.length > 0) {
    console.warn(
      `Firebase environment variables missing (${missingEnvKeys.join(
        ', ',
      )}). Using fallback credentials for client features.`,
    )
  }

  configWarningShown = true
}

function ensureStorageConfigured(): void {
  if (!envFirebaseConfig.storageBucket && !storageWarningShown) {
    console.warn(
      'Firebase storage bucket is not configured. File uploads and education assets will use fallback storage.',
    )
    storageWarningShown = true
  }

  if (!envFirebaseConfig.messagingSenderId && !messagingWarningShown) {
    console.warn(
      'Firebase messaging sender ID is not configured. Cloud messaging features are disabled in this environment.',
    )
    messagingWarningShown = true
  }
}

function initializeFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') {
    return null
  }

  warnIfUsingFallbackConfig()
  ensureStorageConfigured()

  if (app) {
    return app
  }

  try {
    const existingApps = getApps()
    app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig)
    return app
  } catch (error) {
    console.error('Failed to initialize Firebase app:', error)
    app = null
    return null
  }
}

function ensureAuth(): Auth | null {
  if (auth) {
    return auth
  }

  const firebaseApp = initializeFirebaseApp()
  if (!firebaseApp) {
    return null
  }

  try {
    auth = getAuth(firebaseApp)
    return auth
  } catch (error) {
    console.error('Failed to initialize Firebase Auth:', error)
    auth = null
    return null
  }
}

export function ensureFirestore(): Firestore | null {
  if (db) {
    return db
  }

  const firebaseApp = initializeFirebaseApp()
  if (!firebaseApp) {
    return null
  }

  try {
    db = getFirestore(firebaseApp)
    return db
  } catch (error) {
    console.error('Failed to initialize Firestore:', error)
    db = null
    return null
  }
}

export function ensureStorage(): FirebaseStorage | null {
  if (storage) {
    return storage
  }

  const firebaseApp = initializeFirebaseApp()
  if (!firebaseApp) {
    return null
  }

  try {
    storage = getStorage(firebaseApp)
    return storage
  } catch (error) {
    console.warn('Failed to initialize Firebase Storage:', error)
    storage = null
    return null
  }
}

function ensurePerformance(): ReturnType<typeof getPerformance> | null {
  if (performance) {
    return performance
  }

  const firebaseApp = initializeFirebaseApp()
  if (!firebaseApp) {
    return null
  }

  try {
    performance = getPerformance(firebaseApp)
    return performance
  } catch (error) {
    console.warn('Performance monitoring initialization failed:', error)
    performance = null
    return null
  }
}

function readStoredStorageStatus(): 'unknown' | 'working' | 'failed' {
  if (typeof window === 'undefined') {
    return storageStatusCache
  }
  try {
    const status =
      localStorage.getItem('firebase-storage-status') ||
      sessionStorage.getItem('firebase-storage-status')
    if (status === 'failed' || status === 'working') {
      return status
    }
  } catch (error) {
    // Ignore storage access errors
  }
  return 'unknown'
}

function isStorageEnabled(): boolean {
  if (storageStatusCache === 'failed') {
    return false
  }
  const storedStatus = readStoredStorageStatus()
  if (storedStatus === 'failed') {
    storageStatusCache = 'failed'
    return false
  }
  if (storedStatus === 'working') {
    storageStatusCache = 'working'
  }
  return true
}

function setStorageStatus(status: 'failed' | 'working') {
  storageStatusCache = status
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('firebase-storage-status', status)
      sessionStorage.setItem('firebase-storage-status', status)
    } catch (error) {
      // Ignore storage access errors
    }
  }
}

export function getFirebaseApp(): FirebaseApp | null {
  return initializeFirebaseApp()
}

export function getFirebaseAuth(): Auth | null {
  return ensureAuth()
}

export function getFirestoreDb(): Firestore | null {
  return ensureFirestore()
}

export function getFirebaseStorage(): FirebaseStorage | null {
  return ensureStorage()
}

export function getFirebasePerformance(): ReturnType<typeof getPerformance> | null {
  return ensurePerformance()
}

export function isFirebaseConfigured(): boolean {
  return REQUIRED_CONFIG_KEYS.every((key) => !!firebaseConfig[key])
}

// Interfaces
export interface ScanSecurityFeature {
  name: string
  status: string
  confidence: number
  notes?: string
}

export interface ScanResult {
  id?: string
  userId: string
  imageUrl: string
  denomination: string | number
  currency: string
  validity: string
  confidence: number
  features?: string[]
  notes?: string
  timestamp: Date | Timestamp
  overallConfidence?: number
  printQualityScore?: number
  printQuality?: string
  resultLabel?: 'REAL' | 'LIKELY REAL' | 'UNCERTAIN' | 'LIKELY FAKE'
  redFlags?: string[]
  overallAssessment?: string
  paperTexture?: string
  securityFeatures?: ScanSecurityFeature[]
  geminiConfidence?: number
  geminiValidity?: string
  vertexConfidence?: number | null
  vertexValidity?: string | null
}

export interface ValidationResult {
  id: string
  imageUrl: string
  denomination: number
  currency: string
  securityFeatures: ScanSecurityFeature[]
  printQuality: string
  printQualityScore?: number
  paperTexture: string
  redFlags: string[]
  overallAssessment: string
  overallConfidence: number
  result: 'REAL' | 'LIKELY REAL' | 'UNCERTAIN' | 'LIKELY FAKE'
  timestamp: Timestamp | Date
  createdAt?: string
  geminiConfidence?: number
  geminiValidity?: string
  vertexConfidence?: number | null
  vertexValidity?: string | null
}

export interface SecurityFeature {
  name: string
  description: string
  typicalLocation?: string
}

export interface CurrencyReference {
  id?: string
  denomination: string
  country: string
  referenceImageUrl?: string
  securityFeatures?: SecurityFeature[]
  createdAt?: Date | Timestamp
}

export async function saveScanResult(
  userId: string,
  imageFile: File | Blob,
  validationResult: Omit<ScanResult, 'id' | 'userId' | 'imageUrl' | 'timestamp'>
): Promise<string> {
  const db = ensureFirestore()
  let storageInstance: FirebaseStorage | null = null
  let storageAttempted = false

  if (!db) {
    throw new Error('Firestore is not available')
  }

  const storageAllowed = isStorageEnabled()
  if (storageAllowed) {
    storageInstance = ensureStorage()
  }

  // If Storage is not available, convert image to base64 and store in Firestore
  let imageUrl: string
  if (!storageInstance) {
    if (storageAllowed) {
      setStorageStatus('failed')
    }
    console.warn('Firebase Storage is not available. Converting image to base64 for storage in Firestore.')
    // Convert blob to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(imageFile)
    })
    imageUrl = base64
  } else {
    try {
      console.log('Saving scan result for user:', userId)
      const imageRef = ref(
        storageInstance,
        `scans/${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.jpg`
      )

      const fileToUpload = imageFile
      storageAttempted = true
      console.log('Uploading image to storage...')
      await uploadBytes(imageRef, fileToUpload)
      imageUrl = await getDownloadURL(imageRef)
      console.log('Image uploaded successfully, URL:', imageUrl)
      setStorageStatus('working')
    } catch (storageError: any) {
      console.warn('Failed to upload to Storage, falling back to base64:', storageError)
      setStorageStatus('failed')
      // Fallback to base64 if Storage upload fails
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(imageFile)
      })
      imageUrl = base64
    }
  }

  try {

    const docData: Record<string, unknown> = {
      userId,
      imageUrl,
      timestamp: Timestamp.now(),
    }

    const {
      denomination,
      currency,
      validity,
      confidence,
      features,
      notes,
      overallConfidence,
      printQualityScore,
      printQuality,
      resultLabel,
      redFlags,
      overallAssessment,
      paperTexture,
      securityFeatures,
      geminiConfidence,
      geminiValidity,
      vertexConfidence,
      vertexValidity,
    } = validationResult

    if (denomination !== undefined) docData.denomination = denomination
    if (currency !== undefined) docData.currency = currency
    if (validity !== undefined) docData.validity = validity
    if (confidence !== undefined) docData.confidence = confidence
    if (features !== undefined) docData.features = features
    if (notes !== undefined) docData.notes = notes
    if (overallConfidence !== undefined) docData.overallConfidence = overallConfidence
    if (printQualityScore !== undefined) docData.printQualityScore = printQualityScore
    if (printQuality !== undefined) docData.printQuality = printQuality
    if (resultLabel !== undefined) docData.resultLabel = resultLabel
    if (redFlags !== undefined) docData.redFlags = redFlags
    if (overallAssessment !== undefined) docData.overallAssessment = overallAssessment
    if (paperTexture !== undefined) docData.paperTexture = paperTexture
    if (securityFeatures !== undefined) docData.securityFeatures = securityFeatures
    if (geminiConfidence !== undefined) docData.geminiConfidence = geminiConfidence
    if (geminiValidity !== undefined) docData.geminiValidity = geminiValidity
    if (vertexConfidence !== undefined) docData.vertexConfidence = vertexConfidence
    if (vertexValidity !== undefined) docData.vertexValidity = vertexValidity

    console.log('Saving document to Firestore with data:', { ...docData, imageUrl: imageUrl.substring(0, 50) + '...' })
    const docRef = await addDoc(collection(db, 'scans'), docData)
    console.log('Scan saved successfully with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    if (storageAttempted) {
      setStorageStatus('failed')
    }
    console.error('Error saving scan result:', error)
    throw error
  }
}

export async function getScanHistory(userId: string, maxResults: number = 50): Promise<ScanResult[]> {
  const db = ensureFirestore()
  if (!db) {
    console.error('Firestore is not available - db is null')
    throw new Error('Firestore is not available. Please check Firebase configuration.')
  }

  if (!userId) {
    console.error('getScanHistory called without userId')
    throw new Error('User ID is required to fetch scan history')
  }

  console.log('Fetching scan history for user:', userId)

  try {
    // Try the indexed query first (requires composite index)
    const q = query(
      collection(db, 'scans'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    )

    const querySnapshot = await getDocs(q)
    console.log(`Found ${querySnapshot.docs.length} scans for user ${userId}`)
    
    if (querySnapshot.docs.length === 0) {
      console.log('No scans found in Firestore for user:', userId)
      return []
    }
    
    const scans = querySnapshot.docs.map((scanDoc) => {
      const data = scanDoc.data()
      const rawTimestamp = data.timestamp
      let timestamp: Date

      if (rawTimestamp instanceof Timestamp) {
        timestamp = rawTimestamp.toDate()
      } else if (rawTimestamp && typeof rawTimestamp.toDate === 'function') {
        timestamp = rawTimestamp.toDate()
      } else if (rawTimestamp) {
        timestamp = new Date(rawTimestamp)
      } else {
        timestamp = new Date()
      }

      const scanResult = {
        id: scanDoc.id,
        ...data,
        timestamp,
      } as ScanResult

    return scanResult
    })

    console.log(`Successfully loaded ${scans.length} scans`)
    return scans
  } catch (error: any) {
    console.error('Error in getScanHistory:', error)
    console.error('Error code:', error?.code)
    console.error('Error message:', error?.message)
    
    // If the error is about a missing index, try a fallback query
    if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
      console.warn('Composite index not found, using fallback query:', error.message)
      try {
        // Fallback: query by userId only, then sort in memory
        const fallbackQuery = query(
          collection(db, 'scans'),
          where('userId', '==', userId)
        )
        const querySnapshot = await getDocs(fallbackQuery)
        console.log(`Fallback query found ${querySnapshot.docs.length} documents`)
        
        const scans = querySnapshot.docs.map((scanDoc) => {
          const data = scanDoc.data()
          const rawTimestamp = data.timestamp
          let timestamp: Date

          if (rawTimestamp instanceof Timestamp) {
            timestamp = rawTimestamp.toDate()
          } else if (rawTimestamp && typeof rawTimestamp.toDate === 'function') {
            timestamp = rawTimestamp.toDate()
          } else if (rawTimestamp) {
            timestamp = new Date(rawTimestamp)
          } else {
            timestamp = new Date()
          }

          return {
            id: scanDoc.id,
            ...data,
            timestamp,
          } as ScanResult
        })

        // Sort by timestamp in descending order and limit
        scans.sort((a, b) => {
          const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0
          const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0
          return timeB - timeA
        })

        const limitedScans = scans.slice(0, maxResults)
        console.log(`Fallback query returned ${limitedScans.length} scans`)
        return limitedScans
      } catch (fallbackError: any) {
        console.error('Fallback query also failed:', fallbackError)
        console.error('Fallback error code:', fallbackError?.code)
        console.error('Fallback error message:', fallbackError?.message)
        
        // Provide more helpful error message
        if (fallbackError?.code === 'permission-denied') {
          throw new Error('Permission denied. Please ensure you are authenticated and Firestore rules allow read access.')
        } else if (fallbackError?.code === 'unavailable') {
          throw new Error('Firestore is unavailable. Please check your network connection and Firebase configuration.')
        }
        throw new Error(`Failed to fetch scan history: ${fallbackError?.message || 'Unknown error'}`)
      }
    }
    
    // Provide more helpful error messages
    if (error?.code === 'permission-denied') {
      throw new Error('Permission denied. Please ensure you are authenticated and Firestore rules allow read access.')
    } else if (error?.code === 'unavailable') {
      throw new Error('Firestore is unavailable. Please check your network connection and Firebase configuration.')
    }
    
    throw error
  }
}

export async function getScanById(scanId: string): Promise<ScanResult | null> {
  const db = ensureFirestore()
  if (!db) {
    throw new Error('Firestore is not available')
  }

  try {
    const scanRef = doc(db, 'scans', scanId)
    const scanSnap = await getDoc(scanRef)

    if (!scanSnap.exists()) {
      return null
    }

    const data = scanSnap.data()
    const rawTimestamp = data.timestamp
    let timestamp: Date

    if (rawTimestamp instanceof Timestamp) {
      timestamp = rawTimestamp.toDate()
    } else if (rawTimestamp && typeof rawTimestamp.toDate === 'function') {
      timestamp = rawTimestamp.toDate()
    } else if (rawTimestamp) {
      timestamp = new Date(rawTimestamp)
    } else {
      timestamp = new Date()
    }

    return {
      id: scanSnap.id,
      ...data,
      timestamp,
    } as ScanResult
  } catch (error) {
    console.error('Error fetching scan by ID:', error)
    throw error
  }
}

export async function deleteScan(scanId: string): Promise<void> {
  const db = ensureFirestore()
  if (!db) {
    throw new Error('Firestore is not available')
  }

  try {
    await deleteDoc(doc(db, 'scans', scanId))
  } catch (error) {
    console.error('Error deleting scan:', error)
    throw error
  }
}

export async function saveValidationToHistory(userId: string, data: Omit<ValidationResult, 'id' | 'timestamp'>): Promise<string> {
  console.log('Saving to history for user:', userId, data)
  const db = ensureFirestore()
  if (!db) {
    throw new Error('Firestore is not available')
  }
  try {
    const docRef = await addDoc(collection(db, 'scans'), {
      userId,
      ...data,
      timestamp: Timestamp.now(),
      createdAt: new Date().toISOString(),
    })
    console.log('Saved to history with doc ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error saving validation to history:', error)
    throw error
  }
}

export async function getValidationById(id: string): Promise<ValidationResult | null> {
  const db = ensureFirestore()
  if (!db) {
    throw new Error('Firestore is not available')
  }
  try {
    const docRef = doc(db, 'validations', id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        timestamp: docSnap.data().timestamp?.toDate() || new Date(),
      } as ValidationResult
    }
    return null
  } catch (error) {
    console.error('Error getting validation:', error)
    throw error
  }
}

export async function getValidations(
  filter?: 'REAL' | 'LIKELY REAL' | 'UNCERTAIN' | 'LIKELY FAKE' | 'all',
  sortBy: 'newest' | 'oldest' = 'newest'
): Promise<ValidationResult[]> {
  const db = ensureFirestore()
  if (!db) {
    throw new Error('Firestore is not available')
  }
  try {
    let q: Query<DocumentData> = collection(db, 'validations')
    
    if (filter && filter !== 'all') {
      q = query(q, where('result', '==', filter))
    }
    
    q = query(q, orderBy('timestamp', sortBy === 'newest' ? 'desc' : 'asc'))
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as ValidationResult[]
  } catch (error) {
    console.error('Error getting validations:', error)
    throw error
  }
}

export function subscribeToValidations(
  callback: (validations: ValidationResult[]) => void,
  filter?: 'REAL' | 'LIKELY REAL' | 'UNCERTAIN' | 'LIKELY FAKE' | 'all',
  sortBy: 'newest' | 'oldest' = 'newest'
): () => void {
  const db = ensureFirestore()
  if (!db) {
    throw new Error('Firestore is not available')
  }
  let q: Query<DocumentData> = collection(db, 'validations')
  
  if (filter && filter !== 'all') {
    q = query(q, where('result', '==', filter))
  }
  
  q = query(q, orderBy('timestamp', sortBy === 'newest' ? 'desc' : 'asc'))
  
  return onSnapshot(
    q,
    (querySnapshot) => {
      const validations = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as ValidationResult[]
      callback(validations)
    },
    (error) => {
      console.error('Error in real-time subscription:', error)
    }
  )
}

export async function addCurrencyReference(currency: Omit<CurrencyReference, 'id'>): Promise<string> {
  const firestore = ensureFirestore()
  if (typeof window === 'undefined' || !firestore) {
    throw new Error('Firestore is only available in the browser')
  }
  const docRef = await addDoc(collection(firestore, 'currencyReferences'), {
    ...currency,
    createdAt: new Date()
  })
  return docRef.id
}

export async function getCurrencyReferences(): Promise<CurrencyReference[]> {
  const firestore = ensureFirestore()
  if (typeof window === 'undefined' || !firestore) {
    throw new Error('Firestore is only available in the browser')
  }
  const q = query(collection(firestore, 'currencyReferences'))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as CurrencyReference))
}

export async function updateCurrencyReference(id: string, currency: Partial<CurrencyReference>): Promise<void> {
  const firestore = ensureFirestore()
  if (typeof window === 'undefined' || !firestore) {
    throw new Error('Firestore is only available in the browser')
  }
  const docRef = doc(firestore, 'currencyReferences', id)
  await updateDoc(docRef, currency)
}

export async function deleteCurrencyReference(id: string): Promise<void> {
  const firestore = ensureFirestore()
  if (typeof window === 'undefined' || !firestore) {
    throw new Error('Firestore is only available in the browser')
  }
  const docRef = doc(firestore, 'currencyReferences', id)
  await deleteDoc(docRef)
}


// Storage Functions
export async function uploadImageToStorage(file: File | Blob, path: string): Promise<string> {
  const storageInstance = ensureStorage()
  if (typeof window === 'undefined' || !storageInstance) {
    throw new Error('Storage is only available in the browser')
  }
  const storageRef = ref(storageInstance, path)
  const uploadTask = uploadBytesResumable(storageRef, file)
  
  await new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Progress tracking can be added here
      },
      (error) => reject(error),
      () => resolve(null)
    )
  })

  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
  return downloadURL
}

export async function uploadBase64ToStorage(base64: string, path: string): Promise<string> {
  if (!isStorageEnabled()) {
    setStorageStatus('failed')
    console.warn('Firebase Storage not enabled; skipping upload for', path)
    return ''
  }
  const storage = ensureStorage()
  try {
    if (typeof window === 'undefined') {
      throw new Error('Storage is only available in the browser');
    }
    if (!storage) {
      // If Storage is not available, return a placeholder or throw a more helpful error
      console.warn('Firebase Storage is not available. Please set up Firebase Storage in the Firebase Console.');
      throw new Error('Firebase Storage is not available. Please set up Firebase Storage in the Firebase Console.');
    }
    if (!base64) {
      throw new Error('Image data is required');
    }
    if (!path) {
      throw new Error('Storage path is required');
    }

    const base64Data = base64.includes(',')
      ? base64.split(',')[1]
      : base64;

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, blob);

    const downloadURL = await getDownloadURL(storageRef);
    setStorageStatus('working')
    return downloadURL;
  } catch (error: any) {
    console.error(`Error uploading to ${path}:`, error);
    // Don't throw error for demo images - they can use local paths
    if (path.startsWith('demo/')) {
      console.warn('Demo image upload failed, using local path instead');
      setStorageStatus('failed')
      return ''; // Return empty string to indicate failure, caller should use local path
    }
    setStorageStatus('failed')
    throw new Error(`Failed to upload image: ${error?.message || 'Unknown error'}`);
  }
}

export async function uploadBillImage(imageBase64: string, validationId: string) {
  return uploadBase64ToStorage(imageBase64, `bills/${validationId}.jpg`);
}

export async function uploadReferenceImage(imageBase64: string, denomination: string) {
  return uploadBase64ToStorage(imageBase64, `references/${denomination}.jpg`);
}