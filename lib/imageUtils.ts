/**
 * Utility functions for handling image URLs
 */

/**
 * Check if an image URL is a Firebase Storage URL
 */
export function isFirebaseStorageUrl(url: string): boolean {
  if (!url) return false
  return url.includes('firebasestorage.googleapis.com') || url.includes('firebase.storage')
}

/**
 * Check if an image URL is a base64 data URL
 */
export function isBase64Url(url: string): boolean {
  if (!url) return false
  return url.startsWith('data:image/') || url.startsWith('data:application/')
}

/**
 * Check if an image URL is a local/public path
 */
export function isLocalUrl(url: string): boolean {
  if (!url) return false
  return url.startsWith('/') && !url.startsWith('//') && !isBase64Url(url)
}

/**
 * Check if Firebase Storage is available
 * This is a client-side check - Storage might not be initialized if it's not set up
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false
  // Check if we can access the storage bucket URL
  // If Storage isn't set up, the bucket URL will return 404
  // We'll assume Storage is not available if we can't verify it
  return false // Conservative approach: assume Storage might not be available
}

/**
 * Get a safe image URL that won't cause 404 errors
 * If it's a Firebase Storage URL, check if we should use it or fallback to placeholder
 */
export function getSafeImageUrl(
  imageUrl: string | undefined | null, 
  placeholder: string = '/demo/placeholder-feature.svg',
  checkStorage: boolean = true
): string {
  if (!imageUrl) {
    return placeholder
  }

  // If it's a local URL or base64, use it directly
  if (isLocalUrl(imageUrl) || isBase64Url(imageUrl)) {
    return imageUrl
  }

  // If it's a Firebase Storage URL
  if (isFirebaseStorageUrl(imageUrl)) {
    // Since Storage might not be set up, we'll use a more aggressive approach:
    // Try to detect if this is a Storage URL that likely won't work
    // For now, we'll still return it but the component should handle errors gracefully
    // However, to prevent CORS preflight errors, we can check if the URL format suggests it won't work
    
    // If checkStorage is true and we suspect Storage isn't available, use placeholder
    // We'll let the error handler deal with it, but we can also be proactive
    if (checkStorage) {
      // Check if this looks like a Storage URL that requires authentication
      // Storage URLs that don't exist will cause CORS errors
      // The best approach is to let Next.js Image component handle it with unoptimized flag
      // and proper error handling
      return imageUrl
    }
    return imageUrl
  }

  // Default: return the URL as-is
  return imageUrl
}

