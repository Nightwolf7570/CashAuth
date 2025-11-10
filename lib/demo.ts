import { ValidationResult } from './firebase'

// Demo image paths - these should be in public/demo/
export const DEMO_IMAGES = {
  real20: '/demo/real-20-usd.jpg',
  fake20: '/demo/fake-20-usd.jpg',
  uncertain10: '/demo/uncertain-10-usd.jpg'
}

export function getDemoResult(type: 'real20' | 'fake20' | 'uncertain10'): ValidationResult {
  const baseId = `demo-${Date.now()}-${Math.random().toString(36).substring(7)}`
  const timestamp = new Date()

  switch (type) {
    case 'real20':
      return {
        id: baseId,
        imageUrl: DEMO_IMAGES.real20,
        denomination: 20,
        currency: 'USD',
        timestamp,
        result: 'REAL',
        overallConfidence: 95,
        printQuality: 'professional',
        paperTexture: 'genuine_appearance',
        redFlags: [],
        overallAssessment: 'All security features verified. High-quality printing detected. Bill appears genuine.',
        securityFeatures: [
          {
            name: 'watermark',
            status: 'present',
            confidence: 95,
            notes: 'Portrait watermark clearly visible'
          },
          {
            name: 'security_thread',
            status: 'present',
            confidence: 98,
            notes: 'Thread verified and glows under UV'
          },
          {
            name: 'color_shifting_ink',
            status: 'present',
            confidence: 97,
            notes: 'Ink shifts from copper to green'
          },
          {
            name: 'raised_printing',
            status: 'present',
            confidence: 92,
            notes: 'Texture clearly detectable'
          },
          {
            name: 'microprinting',
            status: 'present',
            confidence: 94,
            notes: 'Text sharp and clear'
          }
        ]
      }
    case 'fake20':
      return {
        id: baseId,
        imageUrl: DEMO_IMAGES.fake20,
        denomination: 20,
        currency: 'USD',
        timestamp,
        result: 'LIKELY FAKE',
        overallConfidence: 15,
        printQuality: 'poor',
        paperTexture: 'suspicious',
        redFlags: [
          'Security thread missing',
          'Color-shifting ink not detected',
          'Watermark incomplete or printed',
          'Print quality inconsistent',
          'No raised printing texture',
          'Paper texture does not match genuine bills'
        ],
        overallAssessment: 'Multiple security features missing or incorrect. Print quality is poor. Bill appears to be counterfeit.',
        securityFeatures: [
          {
            name: 'watermark',
            status: 'suspicious',
            confidence: 20,
            notes: 'Appears to be printed rather than embedded'
          },
          {
            name: 'security_thread',
            status: 'missing',
            confidence: 0,
            notes: 'Not detected'
          },
          {
            name: 'color_shifting_ink',
            status: 'missing',
            confidence: 5,
            notes: 'No color shift detected'
          },
          {
            name: 'raised_printing',
            status: 'missing',
            confidence: 10,
            notes: 'No texture detected'
          },
          {
            name: 'microprinting',
            status: 'poor',
            confidence: 25,
            notes: 'Blurry or missing'
          }
        ]
      }
    case 'uncertain10':
      return {
        id: baseId,
        imageUrl: DEMO_IMAGES.uncertain10,
        denomination: 10,
        currency: 'USD',
        timestamp,
        result: 'UNCERTAIN',
        overallConfidence: 55,
        printQuality: 'acceptable',
        paperTexture: 'unclear',
        redFlags: [
          'Image quality unclear',
          'Some features obstructed',
          'Lighting conditions poor'
        ],
        overallAssessment: 'Unable to definitively verify all security features due to image quality. Some features appear present but require manual verification. Recommend expert inspection.',
        securityFeatures: [
          {
            name: 'watermark',
            status: 'unclear',
            confidence: 45,
            notes: 'Possible watermark detected, needs verification'
          },
          {
            name: 'security_thread',
            status: 'partial',
            confidence: 50,
            notes: 'Thread partially visible'
          },
          {
            name: 'color_shifting_ink',
            status: 'unclear',
            confidence: 55,
            notes: 'Unable to verify due to lighting'
          },
          {
            name: 'raised_printing',
            status: 'unclear',
            confidence: 60,
            notes: 'May be present, requires manual check'
          },
          {
            name: 'microprinting',
            status: 'unclear',
            confidence: 40,
            notes: 'Cannot verify due to image quality'
          }
        ]
      }
    default:
      throw new Error('Invalid demo type')
  }
}
