/**
 * Helper functions for Firestore collections: currencies and validations
 */

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  Timestamp 
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Currency document structure
 * @typedef {Object} Currency
 * @property {number} denomination - 1, 5, 10, 20, 50, 100
 * @property {string} country - "USD", "EUR", etc.
 * @property {Array<{name: string, description: string, typicalLocation: string}>} securityFeatures
 * @property {string} referenceImageUrl - Firebase Storage URL
 * @property {Timestamp} createdAt - Firebase timestamp
 */

/**
 * Validation document structure
 * @typedef {Object} Validation
 * @property {Timestamp} timestamp - Firebase timestamp
 * @property {string} billImageUrl - Firebase Storage URL
 * @property {number} denominationDetected
 * @property {string} result - "REAL", "FAKE", "UNCERTAIN"
 * @property {number} confidenceScore - 0-100
 * @property {Array<Object>} featuresDetected
 * @property {string} [userId] - Optional user ID
 */

/**
 * Get currency reference by denomination and country
 * @param {number} denomination 
 * @param {string} country 
 * @returns {Promise<Currency | null>}
 */
export async function getCurrencyReference(denomination, country) {
  try {
    const q = query(
      collection(db, 'currencies'),
      where('denomination', '==', denomination),
      where('country', '==', country),
      limit(1)
    )
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) {
      return null
    }
    const doc = querySnapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    }
  } catch (error) {
    console.error('Error getting currency reference:', error)
    throw error
  }
}

/**
 * Get all currencies for a country
 * @param {string} country 
 * @returns {Promise<Array<Currency>>}
 */
export async function getCurrenciesByCountry(country) {
  try {
    const q = query(
      collection(db, 'currencies'),
      where('country', '==', country),
      orderBy('denomination', 'asc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    }))
  } catch (error) {
    console.error('Error getting currencies by country:', error)
    throw error
  }
}

/**
 * Add a new currency reference
 * @param {Omit<Currency, 'createdAt'>} currencyData 
 * @returns {Promise<string>} Document ID
 */
export async function addCurrencyReference(currencyData) {
  try {
    const docRef = await addDoc(collection(db, 'currencies'), {
      ...currencyData,
      createdAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding currency reference:', error)
    throw error
  }
}

/**
 * Save a validation result
 * @param {Omit<Validation, 'timestamp'>} validationData 
 * @returns {Promise<string>} Document ID
 */
export async function saveValidation(validationData) {
  try {
    const docRef = await addDoc(collection(db, 'validations'), {
      ...validationData,
      timestamp: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving validation:', error)
    throw error
  }
}

/**
 * Get validation history for a user
 * @param {string} userId 
 * @param {number} maxResults 
 * @returns {Promise<Array<Validation>>}
 */
export async function getValidationHistory(userId, maxResults = 50) {
  try {
    const q = query(
      collection(db, 'validations'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
    }))
  } catch (error) {
    console.error('Error getting validation history:', error)
    throw error
  }
}

/**
 * Get all validations (for admin/debugging)
 * @param {number} maxResults 
 * @returns {Promise<Array<Validation>>}
 */
export async function getAllValidations(maxResults = 100) {
  try {
    const q = query(
      collection(db, 'validations'),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
    }))
  } catch (error) {
    console.error('Error getting all validations:', error)
    throw error
  }
}


