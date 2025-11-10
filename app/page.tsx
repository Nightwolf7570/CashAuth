'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Camera, Shield, CheckCircle, PlayCircle, BookOpen, Upload } from 'lucide-react'
// Removed uploadBase64ToStorage import - demo images use local paths
import { getDemoResult, DEMO_IMAGES } from '@/lib/demo'
import { useRouter } from 'next/navigation'
import EducationModal from '@/components/EducationModal'
import { Timestamp } from 'firebase/firestore'

interface SecurityFeature {
  name: string;
  status: string;
  confidence: number;
  notes: string;
}

export default function Home() {
  const [isUploadingDemo, setIsUploadingDemo] = useState<string | null>(null)
  const [isEducationOpen, setIsEducationOpen] = useState(false)
  const router = useRouter()

  // Note: Demo images are now loaded directly from public folder
  // No need to upload to Firebase Storage - they work locally
  // This prevents 404 errors when Firebase Storage is not set up

  const handleDemoClick = async (type: 'real20' | 'fake20' | 'uncertain10') => {
    setIsUploadingDemo(type)
    
    try {
      // Get demo result
      const demoResult = getDemoResult(type)
      
      // Store in localStorage for backward compatibility (legacy format)
      const legacyResult = {
        id: demoResult.id,
        image: demoResult.imageUrl,
        denomination: `$${demoResult.denomination}`,
        currency: demoResult.currency,
        validity: demoResult.result === 'REAL' ? 'Valid' : demoResult.result === 'LIKELY FAKE' ? 'Invalid' : 'Uncertain',
        timestamp: demoResult.timestamp instanceof Date
          ? demoResult.timestamp.toISOString()
          : demoResult.timestamp instanceof Timestamp
          ? demoResult.timestamp.toDate().toISOString()
          : new Date().toISOString(),
        features: demoResult.securityFeatures.map((f) => f.notes || f.name),
        confidence: demoResult.overallConfidence,
        issues: demoResult.redFlags
      }
      
      const history = JSON.parse(localStorage.getItem('scanHistory') || '[]')
      history.unshift(legacyResult)
      localStorage.setItem('scanHistory', JSON.stringify(history))

      // Store in sessionStorage for results page to pick up
      sessionStorage.setItem(`demo-result-${demoResult.id}`, JSON.stringify(demoResult))

      // Navigate to results
      router.push(`/results?id=${demoResult.id}`)
    } catch (err) {
      console.error('Demo error:', err)
      alert('Failed to load demo. Please try again.')
    } finally {
      setIsUploadingDemo(null)
    }
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-primary-600">CashGuard</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your trusted currency validation tool. Verify bills with confidence using advanced scanning technology.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <Link
            href="/scanner"
            className="inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <Camera className="w-6 h-6" />
            <span>Scan Bill</span>
          </Link>
          <button
            onClick={() => setIsEducationOpen(true)}
            className="inline-flex items-center justify-center space-x-3 bg-white border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <BookOpen className="w-6 h-6" />
            <span>Learn About Security Features</span>
          </button>
        </div>

        {/* Demo Mode Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <div className="flex items-center space-x-3 mb-6">
            <PlayCircle className="w-8 h-8 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Demo Mode</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Try CashGuard with pre-loaded demo images to see how it works:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleDemoClick('real20')}
              disabled={isUploadingDemo !== null}
              className="p-6 border-2 border-secondary-200 rounded-lg hover:border-secondary-400 hover:bg-secondary-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-secondary-600" />
                <span className="font-semibold text-gray-900">Real $20 USD</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">High confidence validation</p>
              {isUploadingDemo === 'real20' && (
                <p className="text-xs text-primary-600">Loading...</p>
              )}
            </button>
            <button
              onClick={() => handleDemoClick('fake20')}
              disabled={isUploadingDemo !== null}
              className="p-6 border-2 border-red-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-gray-900">Fake $20 USD</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Many issues detected</p>
              {isUploadingDemo === 'fake20' && (
                <p className="text-xs text-primary-600">Loading...</p>
              )}
            </button>
            <button
              onClick={() => handleDemoClick('uncertain10')}
              disabled={isUploadingDemo !== null}
              className="p-6 border-2 border-yellow-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-2 mb-3">
                <Upload className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-gray-900">Uncertain $10</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Some features unclear</p>
              {isUploadingDemo === 'uncertain10' && (
                <p className="text-xs text-primary-600">Loading...</p>
              )}
            </button>
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <Camera className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Scanning</h3>
          <p className="text-gray-600">
            Simply point your camera at any bill and let our advanced AI detect and validate currency features.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-secondary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
          <p className="text-gray-600">
            Built with security in mind. All scans are processed securely and your data is always protected.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Results</h3>
          <p className="text-gray-600">
            Get immediate validation results with detailed information about your scanned currency.
          </p>
        </div>
      </div>

      </div>

      <EducationModal isOpen={isEducationOpen} onClose={() => setIsEducationOpen(false)} />
    </>
  )
}
