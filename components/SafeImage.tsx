'use client'

import Image from 'next/image'
import { useState, useEffect, useMemo } from 'react'
import { isFirebaseStorageUrl, isBase64Url } from '@/lib/imageUtils'

const STORAGE_ENV_ENABLED =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_ENABLED === 'true'
    : false

const DEFAULT_PLACEHOLDER = '/demo/placeholder-feature.svg'

interface SafeImageProps {
  src: string | undefined | null
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  sizes?: string
  placeholder?: string
  allowStorage?: boolean
  [key: string]: any
}

/**
 * Safe Image component that handles Firebase Storage URLs gracefully
 * Prevents CORS errors by checking if Storage is available before loading
 * If Storage URL and Storage is not set up, uses placeholder immediately
 */
export default function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  placeholder = DEFAULT_PLACEHOLDER,
  allowStorage = STORAGE_ENV_ENABLED,
  ...props
}: SafeImageProps) {
  const [storageStatus, setStorageStatus] = useState<'unknown' | 'working' | 'failed'>(() => {
    if (typeof window === 'undefined') return 'unknown'
    const status =
      localStorage.getItem('firebase-storage-status') ||
      sessionStorage.getItem('firebase-storage-status')
    if (status === 'failed' || status === 'working') {
      return status
    }
    return 'unknown'
  })

  // Determine the safe image source
  const safeSrc = useMemo(() => {
    if (!src) return placeholder
    
    // If it's a Storage URL
    if (isFirebaseStorageUrl(src)) {
      // Only try Storage if explicitly allowed and we haven't marked it as failed
      if (!allowStorage) {
        return placeholder
      }
      if (storageStatus === 'failed') {
        return placeholder
      }
      return src
    }
    
    return src
  }, [src, placeholder, storageStatus, allowStorage])

  const [imageSrc, setImageSrc] = useState<string>(safeSrc)

  useEffect(() => {
    setImageSrc(safeSrc)
  }, [safeSrc])

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget
    // Prevent infinite loop - if we're already showing placeholder, stop
    if (target.src.includes(placeholder) || target.src.endsWith(placeholder)) {
      return
    }
    
    // If this is a Storage URL and we get an error, mark Storage as not working
    // This prevents future CORS preflight requests
    if (isFirebaseStorageUrl(target.src)) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('firebase-storage-status', 'failed')
        localStorage.setItem('firebase-storage-status', 'failed')
      }
      setStorageStatus('failed')
      console.warn('Firebase Storage appears to be unavailable, using placeholder for all Storage URLs')
      setImageSrc(placeholder)
      return
    }
    
    // For other errors, also use placeholder
    setImageSrc(placeholder)
  }

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget
    if (isFirebaseStorageUrl(target.src)) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('firebase-storage-status', 'working')
        localStorage.setItem('firebase-storage-status', 'working')
      }
      setStorageStatus('working')
    }
  }

  // For Storage URLs and base64, use native img tag to avoid Next.js optimization
  // which can cause CORS preflight requests
  const isStorageOrBase64 = isFirebaseStorageUrl(imageSrc) || isBase64Url(imageSrc)
  
  if (isStorageOrBase64) {
    // Use native img tag for Storage URLs to avoid Next.js optimization issues
    const imgProps: React.ImgHTMLAttributes<HTMLImageElement> = {
      src: imageSrc,
      alt,
      className,
      onError: handleError,
      onLoad: handleLoad,
      loading: 'lazy',
      ...(sizes ? { sizes } : {}),
      ...(fill ? {
        style: { width: '100%', height: '100%', objectFit: 'cover' }
      } : {
        width: width || undefined,
        height: height || undefined,
        style: { maxWidth: '100%', height: 'auto' }
      }),
      ...props,
    }
    
    if (fill) {
      return (
        <img
          {...imgProps}
          style={{ ...imgProps.style, position: 'absolute', inset: 0 }}
        />
      )
    }
    
    return <img {...imgProps} />
  }

  // For local URLs, use Next.js Image component for optimization
  const imageProps: any = {
    src: imageSrc,
    alt,
    className,
    onError: handleError,
    ...props,
  }

  if (fill) {
    imageProps.fill = true
    if (sizes) imageProps.sizes = sizes
  } else {
    if (width) imageProps.width = width
    if (height) imageProps.height = height
  }

  return <Image {...imageProps} />
}

