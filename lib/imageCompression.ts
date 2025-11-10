import imageCompression from 'browser-image-compression'

export interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
}

const defaultOptions: CompressionOptions = {
  maxSizeMB: 1, // Max file size in MB
  maxWidthOrHeight: 1920, // Max width or height
  useWebWorker: true,
}

export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...defaultOptions, ...options }
  
  try {
    // Convert Blob to File if needed
    const imageFile = file instanceof File 
      ? file 
      : new File([file], 'image.jpg', { type: 'image/jpeg' })
    
    const compressedFile = await imageCompression(imageFile, opts)
    return compressedFile
  } catch (error) {
    console.error('Image compression error:', error)
    throw new Error('Failed to compress image')
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid image format. Please use JPEG, PNG, or WebP.',
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image is too large. Maximum size is 10MB.',
    }
  }

  return { valid: true }
}






