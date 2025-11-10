'use client'

import { useState, useEffect } from 'react'
import { X, ZoomIn, ZoomOut } from 'lucide-react'
import { getFirebaseStorage } from '@/lib/firebase'
import { ref, getDownloadURL } from 'firebase/storage'
import Image from 'next/image'

interface EducationModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SecurityFeature {
  name: string
  description: string
  imagePath: string
  tips: string[]
}

const securityFeatures: SecurityFeature[] = [
  {
    name: 'Watermark',
    description:
      'A watermark is a faint image that can be seen when you hold the bill up to light. It is created during the paper-making process and matches the portrait on the bill.',
    imagePath: 'watermark.svg',
    tips: [
      'Hold the bill up to light to see the watermark',
      'The watermark should match the portrait on the bill',
      'Should be visible from both sides',
      'Counterfeits often print watermarks, which look flat',
    ],
  },
  {
    name: 'Security Thread',
    description:
      'A thin vertical strip embedded in the paper. When held to light, you can see text and denomination printed on it.',
    imagePath: 'security-thread.svg',
    tips: [
      'Visible when held up to light',
      'Should show denomination and "USA" text',
      'Thread glows under UV light',
      'Should be embedded, not printed on surface',
    ],
  },
  {
    name: 'Color-Shifting Ink',
    description:
      'The numeral in the lower right corner changes color when you tilt the bill. This is difficult to replicate.',
    imagePath: 'color-shifting-ink.svg',
    tips: [
      'Tilt the bill to see color change',
      'Copper-to-green or black-to-green shift',
      'Color change should be smooth and clear',
      "Fake bills may use regular ink that doesn't shift",
    ],
  },
  {
    name: 'Raised Printing',
    description:
      'Authentic bills have raised printing that you can feel with your finger, especially on the portrait area.',
    imagePath: 'raised-printing.svg',
    tips: [
      'Run your finger across the portrait',
      'Should feel slightly raised or textured',
      'Counterfeits feel flat and smooth',
      'The effect is most noticeable on older bills',
    ],
  },
  {
    name: 'Microprinting',
    description:
      'Tiny text that appears in various places on authentic bills. It should be crisp and readable under magnification.',
    imagePath: 'microprinting.svg',
    tips: [
      'Use a magnifying glass to read',
      'Should be sharp and clear',
      'Appears in borders and portrait areas',
      'Counterfeits often have blurry microprinting',
    ],
  },
]

export default function EducationModal({ isOpen, onClose }: EducationModalProps) {
  const [selectedFeature, setSelectedFeature] = useState<number>(0)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isLoadingImage, setIsLoadingImage] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setIsZoomed(false)
      setImageUrl(null)
      return
    }

    // Load image from public folder (education images should be in public/education/)
    const loadImage = async () => {
      setIsLoadingImage(true)
      try {
        const feature = securityFeatures[selectedFeature]
        const publicPath = `/education/${feature.imagePath}`
        const response = await fetch(publicPath)
        if (response.ok) {
          setImageUrl(publicPath)
        } else {
          // Fallback: try Firebase Storage if public image doesn't exist
          const storageInstance = getFirebaseStorage()
          if (storageInstance) {
            try {
              const imageRef = ref(storageInstance, feature.imagePath)
              const url = await getDownloadURL(imageRef)
              setImageUrl(url)
            } catch (storageError) {
              console.warn('Could not load image from Storage, using placeholder:', storageError)
              setImageUrl('/demo/placeholder-feature.svg')
            }
          } else {
            // No Storage available, use placeholder
            setImageUrl('/demo/placeholder-feature.svg')
          }
        }
      } catch (error) {
        console.warn('Could not load image, using placeholder:', error)
        setImageUrl('/demo/placeholder-feature.svg')
      } finally {
        setIsLoadingImage(false)
      }
    }

    loadImage()
  }, [isOpen, selectedFeature])

  if (!isOpen) return null

  const currentFeature = securityFeatures[selectedFeature]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Security Features Guide</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feature List */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
              <div className="space-y-2">
                {securityFeatures.map((feature, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedFeature(index)}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      selectedFeature === index
                        ? 'bg-primary-100 border-2 border-primary-600'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-medium text-gray-900">{feature.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Details */}
            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{currentFeature.name}</h3>
              <p className="text-gray-700 mb-6">{currentFeature.description}</p>

              {/* Image with Zoom */}
              <div className="relative mb-6">
                {isLoadingImage ? (
                  <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Loading image...</p>
                  </div>
                ) : (
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                    <div className="relative w-full h-64">
                      <Image
                        src={imageUrl || '/demo/placeholder-feature.svg'}
                        alt={currentFeature.name}
                        fill
                        className={`object-contain transition-transform duration-300 cursor-zoom-in ${
                          isZoomed ? 'scale-150 origin-center' : ''
                        }`}
                        sizes="(min-width: 1024px) 512px, 100vw"
                        onClick={() => setIsZoomed(!isZoomed)}
                        onError={(event) => {
                          const target = event.currentTarget
                          target.onerror = null
                          target.src = '/demo/placeholder-feature.svg'
                        }}
                      />
                    </div>
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button
                        onClick={() => setIsZoomed(!isZoomed)}
                        className="bg-white/80 hover:bg-white p-2 rounded-lg shadow-lg transition-colors"
                        title={isZoomed ? 'Zoom out' : 'Zoom in'}
                      >
                        {isZoomed ? (
                          <ZoomOut className="w-5 h-5 text-gray-700" />
                        ) : (
                          <ZoomIn className="w-5 h-5 text-gray-700" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Manual Verification Tips</h4>
                <ul className="space-y-2">
                  {currentFeature.tips.map((tip, index) => (
                    <li key={index} className="flex items-start text-blue-800">
                      <span className="mr-2 text-blue-600">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
