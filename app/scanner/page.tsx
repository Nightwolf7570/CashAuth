"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { compressImage, validateImageFile } from '@/lib/imageCompression'
import { saveScanResult } from '@/lib/firebase'
import { useAuth } from '@/components/Auth'

// Inline camera using getUserMedia — works on Mac (Safari/Chrome) and mobile.
function InlineCamera({ onCapture, onStop }: { onCapture: (dataUrl: string) => void; onStop: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (cancelled) return
        streamRef.current = stream
        if (videoRef.current) {
          // @ts-ignore
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            setReady(true)
          }
        }
      } catch (e: any) {
        setErr(e?.message || 'Could not access camera. Check permissions & HTTPS.')
      }
    })()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const takePhoto = () => {
    const v = videoRef.current
    if (!v) return
    const w = v.videoWidth
    const h = v.videoHeight
    if (!w || !h) { setErr('Camera not ready yet.'); return }
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')!
    ctx.drawImage(v, 0, 0, w, h)
    const dataUrl = c.toDataURL('image/jpeg', 0.92)
    onCapture(dataUrl)
  }

  return (
    <div className="w-full">
      <div className="aspect-video bg-black/80 rounded-xl overflow-hidden flex items-center justify-center">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={takePhoto} disabled={!ready} className="px-4 py-2 rounded-xl bg-primary-600 text-white disabled:opacity-60">
          {ready ? 'Capture' : 'Starting camera…'}
        </button>
        <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); onStop() }} className="px-4 py-2 rounded-xl bg-gray-200">
          Stop Camera
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </div>
  )
}

export default function ScannerPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dropRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState<string | null>(null)
  const [mode, setMode] = useState<'upload' | 'camera'>('upload')
  const router = useRouter()
  const { user } = useAuth()
  const triggerFileDialog = useCallback(() => {
    const input = fileInputRef.current
    if (!input) return
    setError(null)
    const fallback = () => {
      requestAnimationFrame(() => {
        try {
          input.click()
        } catch (err) {
          console.warn('input.click() failed to open file picker', err)
        }
      })
    }
    try {
      if (typeof input.showPicker === 'function') {
        input.showPicker()
        return
      }
    } catch (err) {
      console.warn('showPicker failed, falling back to input.click()', err)
    }
    fallback()
  }, [])

  // IMPORTANT: No "mounted" gating; SSR and CSR render the same markup.

  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (e) => reject(e)
    reader.readAsDataURL(file)
  })

  const processBase64 = useCallback(async (base64: string) => {
    try {
      setPreviewUrl(base64)
      setLoadingStep('Analyzing…')
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      })
      if (!res.ok) {
        const data: any = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Validation failed')
      }
      const data: any = await res.json()
      const result = data?.result || {}

      // Build result object compatible with Results page demo loader
      const id = 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
      const confNum = typeof result.confidence === 'number' ? Math.max(1, Math.min(99, result.confidence)) : 80
      const resultLabel: 'REAL' | 'LIKELY REAL' | 'UNCERTAIN' | 'LIKELY FAKE' =
        result.validity === 'Invalid' ? 'LIKELY FAKE' : 'REAL'
      const geminiConfidence = typeof result.geminiConfidence === 'number' ? result.geminiConfidence : confNum
      const geminiValidity = result.geminiValidity || result.validity || 'Valid'
      const vertexConfidence =
        typeof result.vertexConfidence === 'number' ? Math.max(0, Math.min(100, result.vertexConfidence)) : null
      const vertexValidity = result.vertexValidity || null
      
      // Get print quality score from API response, default to 70 if not provided
      const printQualityScore = typeof result.printQualityScore === 'number' 
        ? Math.max(0, Math.min(100, Math.round(result.printQualityScore)))
        : 70
      
      // Convert numeric score to string for backward compatibility
      let printQuality: string
      if (printQualityScore >= 85) {
        printQuality = 'professional'
      } else if (printQualityScore >= 70) {
        printQuality = 'acceptable'
      } else if (printQualityScore >= 40) {
        printQuality = 'poor'
      } else {
        printQuality = 'poor'
      }
      
      const demoResult = {
        id: id,
        imageUrl: base64,
        denomination: parseInt(String(result.denomination).replace(/[^0-9]/g, '')) || 20,
        currency: result.currency || 'USD',
        securityFeatures: (result.features || []).map((name: any) => ({
          name: String(name).toLowerCase().replace(/\s+/g, '_'),
          status: 'present',
          confidence: typeof result.confidence === 'number' ? Math.max(40, Math.min(95, Math.round(result.confidence))) : 80,
          notes: String(name),
        })),
        printQuality: printQuality,
        printQualityScore: printQualityScore, // Store numeric score for direct use
        paperTexture: 'genuine_appearance',
        redFlags: result.validity === 'Invalid' ? ['Multiple discrepancies detected'] : [],
        overallAssessment: result.notes || 'Validation completed',
        overallConfidence: confNum,
        result: resultLabel,
        timestamp: new Date().toISOString(),
        geminiConfidence,
        geminiValidity,
        vertexConfidence,
        vertexValidity,
      }
      let resultId = id
      let storedResult = demoResult

      if (user) {
        try {
          setLoadingStep('Saving to history…')
          const response = await fetch(base64)
          const imageBlob = await response.blob()
          // Extract numeric value from denomination (handle both string "$20" and number 20)
          let denominationValue: string | number = result.denomination || '$20'
          if (typeof denominationValue === 'string') {
            // Extract number from string like "$20" or "20"
            const numMatch = denominationValue.match(/(\d+)/)
            denominationValue = numMatch ? parseInt(numMatch[1], 10) : 20
          }
          
          const scanId = await saveScanResult(user.uid, imageBlob, {
            denomination: denominationValue,
            currency: result.currency || 'USD',
            validity: result.validity || 'Valid',
            confidence: typeof result.confidence === 'number' ? result.confidence : confNum,
            features: (result.features || []).map((name: any) => String(name)),
            notes: result.notes,
            overallConfidence: demoResult.overallConfidence,
            printQualityScore: demoResult.printQualityScore,
            printQuality: demoResult.printQuality,
            resultLabel,
            redFlags: demoResult.redFlags,
            overallAssessment: demoResult.overallAssessment,
            paperTexture: demoResult.paperTexture,
            securityFeatures: demoResult.securityFeatures,
            geminiConfidence,
            geminiValidity,
            vertexConfidence,
            vertexValidity,
          })

          resultId = scanId
          storedResult = {
            ...demoResult,
            id: scanId,
            imageUrl: base64, // Keep base64 for immediate display, Firebase URL is in the saved record
          }
          console.log('Scan saved successfully with ID:', scanId)
        } catch (saveError: any) {
          console.error('Failed to save scan result:', saveError)
          // Don't block the flow if save fails - user can still view results
          // The error is logged but we continue with the local result
        }
      }

      sessionStorage.setItem('demo-result-' + resultId, JSON.stringify(storedResult))
      setLoadingStep(null)
      router.push('/results?id=' + resultId)
    } catch (err: any) {
      setLoadingStep(null)
      setError(err?.message || 'Something went wrong while processing the image')
    }
  }, [router, user])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null)
      const file = e.target.files?.[0]
      if (!file) return
      const v = validateImageFile(file)
      if (!v.valid) { setError(v.error || 'Invalid image file'); return }
      setLoadingStep('Compressing image…')
      const compressed = await compressImage(file)
      const base64 = await fileToBase64(compressed)
      await processBase64(base64)
    } catch (err: any) {
      setLoadingStep(null)
      setError(err?.message || 'Failed to read image')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Drag & drop for upload
  useEffect(() => {
    const el = dropRef.current
    if (!el) return
    const prevent = (e: DragEvent) => { e.preventDefault(); e.stopPropagation() }
    const onDrop = async (e: DragEvent) => {
      e.preventDefault(); e.stopPropagation()
      setError(null)
      const file = e.dataTransfer?.files?.[0]
      if (!file) return
      const v = validateImageFile(file)
      if (!v.valid) { setError(v.error || 'Invalid image file'); return }
      setLoadingStep('Compressing image…')
      const compressed = await compressImage(file)
      const base64 = await fileToBase64(compressed)
      await processBase64(base64)
    }
    el.addEventListener('dragenter', prevent)
    el.addEventListener('dragover', prevent)
    el.addEventListener('drop', onDrop)
    return () => {
      el.removeEventListener('dragenter', prevent)
      el.removeEventListener('dragover', prevent)
      el.removeEventListener('drop', onDrop)
    }
  }, [processBase64])

  return (
    <div className="w-full mx-auto max-w-6xl p-4">
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => { setMode('upload'); setError(null) }}
          className={'px-4 py-2 rounded-xl ' + (mode === 'upload' ? 'bg-primary-600 text-white' : 'bg-gray-200')}
        >Upload Image</button>
        <button
          onClick={() => { setMode('camera'); setError(null) }}
          className={'px-4 py-2 rounded-xl ' + (mode === 'camera' ? 'bg-primary-600 text-white' : 'bg-gray-200')}
        >Use Mac Camera</button>
      </div>

      {/* Horizontal-heavy layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: Live input area (wide, landscape) */}
        <div className="md:w-2/3 w-full">
          {mode === 'camera' ? (
            <InlineCamera
              onCapture={(dataUrl) => { setPreviewUrl(dataUrl); processBase64(dataUrl) }}
              onStop={() => setMode('upload')}
            />
          ) : (
            <div ref={dropRef} className="aspect-video rounded-xl border border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center p-6">
                <p className="text-sm text-gray-700">Drag & drop an image here</p>
                <p className="text-xs text-gray-500 mt-1">or</p>
                <button
                  onClick={() => { triggerFileDialog() }}
                  className="mt-2 px-4 py-2 rounded-xl bg-gray-900 text-white"
                  disabled={!!loadingStep}
                  aria-busy={!!loadingStep}
                >
                  {loadingStep ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                      {loadingStep}
                    </span>
                  ) : 'Choose Image'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-gray-500 mt-3">Tip: Use clear, well-lit images for best results.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Preview and actions */}
        <div className="md:w-1/3 w-full">
          <h1 className="text-xl font-semibold">Scanner</h1>
          <div className="mt-3 aspect-video bg-black/80 rounded-xl overflow-hidden flex items-center justify-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="text-white/70 text-sm px-6 text-center">
                {mode === 'camera' ? 'Use the Mac camera and press Capture.' : 'Upload or drop an image to begin.'}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-600">
              {error}
              <p className="mt-2 text-gray-600">
                Camera note: Desktop browsers require HTTPS. Grant permission when prompted.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
