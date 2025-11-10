'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const shouldRegister =
      process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DISABLE_SW !== 'true'

    if (!shouldRegister) {
      // Ensure any previously registered service workers are removed in dev
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister().catch(() => {})
          })
        })
        .catch(() => {})
      return
    }

    // Cache-bust by versioning the SW URL
    const version = process.env.NEXT_PUBLIC_SW_VERSION || 'v1'
    const swUrl = `/sw.js?${version}`
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('Service Worker registered:', registration)
        // Prompt update if a new SW is found
        registration.update().catch(() => {})
      })
      .catch((error) => {
        console.warn('Service Worker registration failed:', error)
      })
  }, [])

  return null
}



