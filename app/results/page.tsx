'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, AlertTriangle, Download, Save, Camera, ArrowLeft, Check, X } from 'lucide-react'
import { useAuth } from '@/components/Auth'
import { getValidationById, getScanById, saveValidationToHistory, ValidationResult, ScanResult } from '@/lib/firebase'
import SafeImage from '@/components/SafeImage'
import jsPDF from 'jspdf'

function getResultBadge(result: string) {
  switch (result) {
    case 'REAL':
    case 'LIKELY REAL':
      return {
        label: result === 'REAL' ? 'REAL' : 'LIKELY REAL',
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-500',
        textColor: 'text-green-700',
        icon: CheckCircle2,
      }
    case 'LIKELY FAKE':
      return {
        label: 'LIKELY FAKE',
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500',
        textColor: 'text-red-700',
        icon: XCircle,
      }
    default:
      return {
        label: 'UNCERTAIN',
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-700',
        icon: AlertTriangle,
      }
  }
}

const GOOD_FEATURE_STATUSES = new Set([
  'present',
  'verified',
  'authentic',
  'genuine',
  'detected',
  'confirmed',
  'pass',
])

const BAD_FEATURE_STATUSES = new Set([
  'missing',
  'absent',
  'failed',
  'fake',
  'counterfeit',
  'not_detected',
  'incorrect',
])

const WARNING_FEATURE_STATUSES = new Set([
  'suspicious',
  'unclear',
  'partial',
  'poor',
  'unknown',
  'inconclusive',
])

type FeatureStatusLevel = 'good' | 'warn' | 'bad'

function normalizeFeatureStatus(status: string | undefined | null): string {
  return (status ?? '').toLowerCase().replace(/\s+/g, '_')
}

function getFeatureStatusLevel(status: string, confidence: number): FeatureStatusLevel {
  const normalizedStatus = normalizeFeatureStatus(status)

  if (GOOD_FEATURE_STATUSES.has(normalizedStatus)) {
    return 'good'
  }
  if (BAD_FEATURE_STATUSES.has(normalizedStatus)) {
    return 'bad'
  }
  if (WARNING_FEATURE_STATUSES.has(normalizedStatus)) {
    return 'warn'
  }

  if (confidence >= 70) {
    return 'good'
  }
  if (confidence < 40) {
    return 'bad'
  }
  return 'warn'
}

function getFeatureStatusIcon(status: string, confidence: number) {
  const level = getFeatureStatusLevel(status, confidence)
  const baseClass = 'inline-flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0'

  if (level === 'good') {
    return (
      <span className={`${baseClass} bg-green-100`}>
        <Check className="w-4 h-4 text-green-600" />
      </span>
    )
  }

  if (level === 'bad') {
    return (
      <span className={`${baseClass} bg-red-100`}>
        <X className="w-4 h-4 text-red-600" />
      </span>
    )
  }

  return (
    <span className={`${baseClass} bg-yellow-100`}>
      <AlertTriangle className="w-4 h-4 text-yellow-600" />
    </span>
  )
}

function getFeatureStatusColor(status: string, confidence: number) {
  const level = getFeatureStatusLevel(status, confidence)

  if (level === 'good') {
    return 'text-green-700'
  }
  if (level === 'bad') {
    return 'text-red-700'
  }
  return 'text-yellow-700'
}

function getRecommendation(result: string, confidence: number, redFlags: string[]): string {
  if (result === 'REAL' || (result === 'LIKELY REAL' && confidence >= 75)) {
    return 'Accept'
  } else if (redFlags.length > 0 || confidence < 40) {
    return 'Likely counterfeit'
  } else {
    return 'Get expert opinion'
  }
}

function getPrintQualityScore(printQuality: string): number {
  switch (printQuality) {
    case 'professional':
      return 95
    case 'acceptable':
      return 70
    case 'poor':
      return 40
    default:
      return 50
  }
}

function convertScanToValidationResult(scan: ScanResult): ValidationResult {
  const denominationNumber = parseInt(String(scan.denomination).replace(/[^0-9]/g, ''), 10) || 0

  const printQualityScore =
    typeof scan.printQualityScore === 'number'
      ? Math.max(0, Math.min(100, scan.printQualityScore))
      : undefined

  const derivedPrintQuality =
    scan.printQuality ||
    (printQualityScore !== undefined
      ? printQualityScore >= 85
        ? 'professional'
        : printQualityScore >= 70
        ? 'acceptable'
        : printQualityScore >= 40
        ? 'poor'
        : 'poor'
      : 'acceptable')

  const normalizedPrintQualityScore =
    printQualityScore !== undefined ? printQualityScore : getPrintQualityScore(derivedPrintQuality)

  const securityFeatures =
    scan.securityFeatures && scan.securityFeatures.length > 0
      ? scan.securityFeatures
      : (scan.features || []).map((name) => ({
          name: String(name).toLowerCase().replace(/\s+/g, '_'),
          status: 'present',
          confidence: typeof scan.confidence === 'number' ? Math.max(40, Math.min(95, Math.round(scan.confidence))) : 80,
          notes: String(name),
        }))

  const timestamp =
    scan.timestamp instanceof Date
      ? scan.timestamp
      : typeof (scan.timestamp as any)?.toDate === 'function'
      ? (scan.timestamp as any).toDate()
      : new Date(scan.timestamp as any)

  return {
    id: scan.id || '',
    imageUrl: scan.imageUrl,
    denomination: denominationNumber,
    currency: scan.currency,
    securityFeatures,
    printQuality: derivedPrintQuality,
    printQualityScore: normalizedPrintQualityScore,
    paperTexture: scan.paperTexture || 'genuine_appearance',
    redFlags: scan.redFlags || [],
    overallAssessment: scan.overallAssessment || scan.notes || 'Validation completed',
    overallConfidence:
      typeof scan.overallConfidence === 'number' ? scan.overallConfidence : scan.confidence ?? normalizedPrintQualityScore,
    result:
      scan.resultLabel ||
      (scan.validity === 'Valid' ? 'REAL' : scan.validity === 'Invalid' ? 'LIKELY FAKE' : 'UNCERTAIN'),
    timestamp,
    geminiConfidence: scan.geminiConfidence ?? scan.overallConfidence ?? scan.confidence,
    geminiValidity: scan.geminiValidity || scan.validity,
    vertexConfidence: scan.vertexConfidence ?? null,
    vertexValidity: scan.vertexValidity ?? null,
  }
}

function ResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const id = searchParams.get('id')
    if (!id) {
      setLoading(false)
      return
    }

    const loadResult = async () => {
      // First check for demo result in sessionStorage
      const demoResultStr = typeof window !== 'undefined' ? sessionStorage.getItem(`demo-result-${id}`) : null
      if (demoResultStr) {
        try {
          const demoResult = JSON.parse(demoResultStr)
          if (typeof demoResult.timestamp === 'string') {
            demoResult.timestamp = new Date(demoResult.timestamp)
          }
          setResult(demoResult as ValidationResult)
          setLoading(false)
          return
        } catch (err) {
          console.warn('Failed to parse demo result:', err)
        }
      }

      try {
        const validation = await getValidationById(id)
        if (validation) {
          setResult(validation)
          setLoading(false)
          return
        }

        const scan = await getScanById(id)
        if (scan) {
          setResult(convertScanToValidationResult(scan))
          setLoading(false)
          return
        }

        // Fallback to legacy localStorage format
        const historyStr = typeof window !== 'undefined' ? localStorage.getItem('scanHistory') : null
        if (historyStr) {
          try {
            const history = JSON.parse(historyStr)
            const found = history.find((item: any) => item.id === id)
            if (found) {
              setResult({
                id: found.id,
                imageUrl: found.image,
                denomination: parseInt(found.denomination.replace('$', '')) || 0,
                currency: found.currency || 'USD',
                securityFeatures:
                  found.features?.map((f: string) => ({
                    name: f.toLowerCase().replace(/\s+/g, '_'),
                    status: 'present',
                    confidence: 85,
                    notes: f,
                  })) || [],
                printQuality: 'acceptable',
                printQualityScore: 70,
                paperTexture: 'genuine_appearance',
                redFlags: found.issues || [],
                overallAssessment: 'Validation completed',
                overallConfidence: found.confidence || (found.validity === 'Valid' ? 85 : 30),
                result: found.validity === 'Valid' ? 'REAL' : found.validity === 'Invalid' ? 'LIKELY FAKE' : 'UNCERTAIN',
                timestamp: new Date(found.timestamp),
                geminiConfidence: found.confidence || (found.validity === 'Valid' ? 85 : 30),
                geminiValidity: found.validity,
                vertexConfidence: null,
                vertexValidity: null,
              })
            }
          } catch (legacyError) {
            console.warn('Failed to parse legacy history:', legacyError)
          }
        }
      } catch (error) {
        console.error('Error loading validation:', error)
      } finally {
        setLoading(false)
      }
    }

    loadResult()
  }, [searchParams])

  const handleSaveToHistory = async () => {
    if (!result || saving || !user) return
    
    setSaving(true)
    try {
      // Check if already saved (has Firestore ID format)
      if (result.id && result.id.length > 20) {
        // Already saved to Firestore
        alert('This validation is already saved to history!')
      } else {
        await saveValidationToHistory(user.uid, {
          imageUrl: result.imageUrl,
          denomination: result.denomination,
          currency: result.currency,
          securityFeatures: result.securityFeatures,
          printQuality: result.printQuality,
          printQualityScore: result.printQualityScore,
          paperTexture: result.paperTexture,
          redFlags: result.redFlags,
          overallAssessment: result.overallAssessment,
          overallConfidence: result.overallConfidence,
          result: result.result,
        geminiConfidence: result.geminiConfidence,
        geminiValidity: result.geminiValidity,
        vertexConfidence: result.vertexConfidence,
        vertexValidity: result.vertexValidity,
        })
        alert('Saved to history successfully!')
      }
    } catch (error) {
      console.error('Error saving to history:', error)
      alert('Failed to save to history')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadReport = () => {
    if (!result) return

    const pdf = new jsPDF()
    const badge = getResultBadge(result.result)
    
    // Title
    pdf.setFontSize(20)
    pdf.setTextColor(0, 0, 0)
    pdf.text('Currency Validation Report', 20, 20)
    
    // Result badge
    pdf.setFontSize(16)
    if (badge.color === 'green') {
      pdf.setTextColor(0, 128, 0)
    } else if (badge.color === 'red') {
      pdf.setTextColor(220, 20, 60)
    } else {
      pdf.setTextColor(255, 165, 0)
    }
    pdf.text(`Result: ${badge.label}`, 20, 40)
    
    // Confidence
    pdf.setFontSize(14)
    pdf.setTextColor(0, 0, 0)
    pdf.text(`Confidence: ${result.overallConfidence.toFixed(1)}%`, 20, 55)
    
    // Details
    pdf.setFontSize(12)
    pdf.text(`Denomination: ${result.denomination} ${result.currency}`, 20, 70)
    pdf.text(`Print Quality: ${result.printQuality}`, 20, 80)
    
    // Security Features
    pdf.setFontSize(14)
    pdf.text('Security Features:', 20, 95)
    let yPos = 105
    result.securityFeatures.forEach((feature) => {
      pdf.setFontSize(10)
      pdf.setTextColor(0, 0, 0)
      pdf.text(
        `${feature.name.replace(/_/g, ' ')}: ${feature.status.replace(/_/g, ' ')} (${feature.confidence}%)`,
        25,
        yPos
      )
      yPos += 10
      if (yPos > 280) {
        pdf.addPage()
        yPos = 20
      }
    })
    
    // Red Flags
    if (result.redFlags.length > 0) {
      yPos += 10
      if (yPos > 280) {
        pdf.addPage()
        yPos = 20
      }
      pdf.setFontSize(14)
      pdf.setTextColor(220, 20, 60)
      pdf.text('Red Flags:', 20, yPos)
      yPos += 10
      result.redFlags.forEach((flag) => {
        pdf.setFontSize(10)
        pdf.setTextColor(220, 20, 60)
        pdf.text(`- ${flag}`, 25, yPos)
        yPos += 10
        if (yPos > 280) {
          pdf.addPage()
          yPos = 20
        }
      })
    }
    
    // Assessment
    pdf.setTextColor(0, 0, 0)
    yPos += 10
    if (yPos > 280) {
      pdf.addPage()
      yPos = 20
    }
    pdf.setFontSize(14)
    pdf.text('Overall Assessment:', 20, yPos)
    yPos += 10
    pdf.setFontSize(10)
    const assessmentLines = pdf.splitTextToSize(result.overallAssessment, 170)
    assessmentLines.forEach((line: string) => {
      pdf.text(line, 25, yPos)
      yPos += 10
      if (yPos > 280) {
        pdf.addPage()
        yPos = 20
      }
    })
    
    // Recommendation
    const recommendation = getRecommendation(result.result, result.overallConfidence, result.redFlags)
    yPos += 10
    if (yPos > 280) {
      pdf.addPage()
      yPos = 20
    }
    pdf.setFontSize(14)
    pdf.text('Recommendation:', 20, yPos)
    yPos += 10
    pdf.setFontSize(12)
    if (recommendation === 'Accept') {
      pdf.setTextColor(0, 128, 0)
    } else if (recommendation === 'Likely counterfeit') {
      pdf.setTextColor(220, 20, 60)
    } else {
      pdf.setTextColor(255, 165, 0)
    }
    pdf.text(recommendation, 25, yPos)
    
    // Timestamp
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(8)
    pdf.text(
      `Generated: ${new Date().toLocaleString()}`,
      20,
      285
    )
    
    pdf.save(`validation-report-${result.id}.pdf`)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-600">Loading results...</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-600 mb-4">No validation result found</p>
        <button
          onClick={() => router.push('/scanner')}
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all"
        >
          Start New Scan
        </button>
      </div>
    )
  }

  const badge = getResultBadge(result.result)
  const BadgeIcon = badge.icon
  // Use numeric score if available, otherwise fall back to string conversion
  const printQualityScore = typeof result.printQualityScore === 'number' 
    ? Math.max(0, Math.min(100, result.printQualityScore))
    : getPrintQualityScore(result.printQuality)
  const recommendation = getRecommendation(result.result, result.overallConfidence, result.redFlags)
  const modelDisagreement =
    result.geminiValidity &&
    result.vertexValidity &&
    result.vertexValidity !== null &&
    result.geminiValidity !== result.vertexValidity

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      {/* Top Section: Badge, Confidence, Image */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="p-6">
          {/* Large Badge */}
          <div className="flex justify-center mb-6">
            <div
              className={`${badge.bgColor} ${badge.borderColor} border-4 rounded-xl px-8 py-4 flex items-center space-x-4`}
            >
              <BadgeIcon className={`w-10 h-10 ${badge.textColor}`} />
              <span className={`text-3xl font-bold ${badge.textColor}`}>
                {badge.label}
              </span>
            </div>
          </div>

          {/* Confidence Percentage */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">Confidence Level</p>
            <p className="text-5xl font-bold text-gray-900">
              {result.overallConfidence.toFixed(1)}%
            </p>
          </div>

          {/* Bill Image */}
          <div className="mb-6">
            <SafeImage
              src={result.imageUrl}
              alt="Scanned bill"
              width={800}
              height={600}
              className="w-full h-auto max-h-96 object-contain rounded-lg mx-auto border border-gray-200"
              sizes="(min-width: 1024px) 640px, (min-width: 768px) 75vw, 100vw"
            />
          </div>
        </div>
      </div>

      {/* Middle Section: Security Features Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Security Features</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Feature</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {result.securityFeatures.map((feature, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getFeatureStatusIcon(feature.status, feature.confidence)}
                        <span className="font-medium text-gray-900 capitalize">
                          {feature.name.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${getFeatureStatusColor(feature.status, feature.confidence)}`}>
                        {feature.status.replace(/_/g, ' ')}
                      </span>
                      {feature.notes && (
                        <p className="text-sm text-gray-600 mt-1">{feature.notes}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${getFeatureStatusColor(feature.status, feature.confidence)}`}>
                        {feature.confidence}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Model Comparison Section */}
      {(result.geminiConfidence !== undefined || result.vertexConfidence !== undefined) && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Model Comparison</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gemini</h3>
                <p className="text-sm text-gray-600 mb-1">Validity</p>
                <p className="text-xl font-bold text-gray-900">{result.geminiValidity || result.result}</p>
                <p className="text-sm text-gray-600 mt-3 mb-1">Confidence</p>
                <p className="text-lg font-semibold text-gray-900">
                  {result.geminiConfidence !== undefined ? `${result.geminiConfidence.toFixed(1)}%` : '—'}
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill Classifier</h3>
                <p className="text-sm text-gray-600 mb-1">Validity</p>
                <p className="text-xl font-bold text-gray-900">{result.vertexValidity || 'Not available'}</p>
                <p className="text-sm text-gray-600 mt-3 mb-1">Confidence</p>
                <p className="text-lg font-semibold text-gray-900">
                  {typeof result.vertexConfidence === 'number' ? `${result.vertexConfidence.toFixed(1)}%` : '—'}
                </p>
              </div>
            </div>
            {modelDisagreement && (
              <p className="mt-4 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                The models disagree on this prediction. CashGuard defaults to Gemini’s assessment for the summary above.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bottom Section: Print Quality, Red Flags, Assessment, Recommendation */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="p-6">
          {/* Print Quality Score */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Print Quality Score</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      printQualityScore >= 70
                        ? 'bg-green-500'
                        : printQualityScore >= 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${printQualityScore}%` }}
                  />
                </div>
              </div>
              <span className="text-lg font-semibold text-gray-900">{printQualityScore}%</span>
            </div>
            <p className="text-sm text-gray-600 mt-2 capitalize">{result.printQuality}</p>
          </div>

          {/* Red Flags */}
          {result.redFlags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-red-700 mb-3">Red Flags</h3>
              <ul className="space-y-2">
                {result.redFlags.map((flag, index) => (
                  <li key={index} className="flex items-start space-x-2 text-red-700">
                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Overall Assessment */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Overall Assessment</h3>
            <p className="text-gray-700 leading-relaxed">{result.overallAssessment}</p>
          </div>

          {/* Recommendation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Recommendation</h3>
            <p
              className={`text-xl font-bold ${
                recommendation === 'Accept'
                  ? 'text-green-700'
                  : recommendation === 'Likely counterfeit'
                  ? 'text-red-700'
                  : 'text-yellow-700'
              }`}
            >
              {recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={handleSaveToHistory}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'Saving...' : 'Save to History'}</span>
        </button>
        <button
          onClick={() => router.push('/scanner')}
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center space-x-2"
        >
          <Camera className="w-5 h-5" />
          <span>Scan Another</span>
        </button>
        <button
          onClick={handleDownloadReport}
          className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Download Report</span>
        </button>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-600">Loading results...</p>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}
