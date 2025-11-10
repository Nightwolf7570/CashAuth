'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Trash2, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/Auth'
import toast from 'react-hot-toast'
import { Timestamp } from 'firebase/firestore'
import { getScanHistory, deleteScan, ScanResult } from '@/lib/firebase'
import SafeImage from '@/components/SafeImage'

export default function HistoryPage() {
  const [history, setHistory] = useState<ScanResult[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user } = useAuth()

  const loadHistory = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('Loading history for user:', user.uid)
      const scans = await getScanHistory(user.uid)
      console.log('Loaded scans:', scans.length, scans)
      setHistory(scans)
      if (scans.length === 0) {
        console.log('No scans found for user:', user.uid)
        // Don't show error if no scans, just empty state
      }
    } catch (error: any) {
      console.error('Error loading history:', error)
      console.error('Error details:', {
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
      })
      
      // Check for specific Firestore errors
      if (error?.code === 'permission-denied') {
        toast.error('Permission denied. Please check Firestore security rules.')
      } else if (error?.code === 'failed-precondition') {
        toast.error('Firestore index missing. Please deploy indexes: firebase deploy --only firestore:indexes')
      } else if (error?.message?.includes('Firestore is not available')) {
        toast.error('Firestore is not configured. Please check Firebase configuration.')
      } else {
      const errorMessage = error?.message || 'Failed to load scan history'
        toast.error(`History error: ${errorMessage}`)
      }
      // Don't clear history on error, keep existing data if any
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadHistory()
    } else {
      setLoading(false)
    }
  }, [user, loadHistory])

  const handleDeleteScan = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    if (!confirm('Are you sure you want to delete this scan?')) {
      return
    }

    try {
      await deleteScan(id)
      setHistory(history.filter((item) => item.id !== id))
      toast.success('Scan deleted successfully')
    } catch (error: any) {
      console.error('Error deleting scan:', error)
      const errorMessage = error?.message || 'Failed to delete scan'
      toast.error(errorMessage)
    }
  }

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear all scan history? This action cannot be undone.')) {
      return
    }

    try {
      const deletePromises = history
        .filter((item) => item.id)
        .map((item) => deleteScan(item.id!))
      
      await Promise.all(deletePromises)
      setHistory([])
      toast.success('History cleared successfully')
    } catch (error: any) {
      console.error('Error clearing history:', error)
      const errorMessage = error?.message || 'Failed to clear some scans'
      toast.error(errorMessage)
      // Reload history to see which scans were actually deleted
      loadHistory()
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Scan History</h1>
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-600 text-lg mb-4">Please sign in to view your scan history</p>
          <button
            onClick={() => router.push('/scanner')}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Scan History</h1>
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-600 text-lg mb-4">No scan history yet</p>
          <button
            onClick={() => router.push('/scanner')}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Start Scanning
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Scan History</h1>
        <div className="flex gap-2">
          <button
            onClick={loadHistory}
            disabled={loading}
            className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Refresh'
            )}
          </button>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
            onClick={() => router.push(`/results?id=${item.id}`)}
          >
            <div className="relative w-full h-48">
              <SafeImage
                src={item.imageUrl}
                alt="Scanned bill"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              />
              <div className="absolute top-2 right-2">
                {item.validity === 'Valid' ? (
                  <CheckCircle className="w-8 h-8 text-secondary-600 bg-white rounded-full" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600 bg-white rounded-full" />
                )}
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {typeof item.denomination === 'number' 
                      ? `$${item.denomination}` 
                      : typeof item.denomination === 'string' && item.denomination.startsWith('$')
                      ? item.denomination
                      : `$${item.denomination || 'N/A'}`}
                  </h3>
                  <p className="text-sm text-gray-600">{item.currency || 'USD'}</p>
                </div>
                <button
                  onClick={(e) => {
                    if (item.id) {
                      handleDeleteScan(item.id, e)
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Delete scan"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <Clock className="w-4 h-4" />
                <span>
                  {item.timestamp instanceof Date
                    ? item.timestamp.toLocaleString()
                    : item.timestamp instanceof Timestamp
                    ? item.timestamp.toDate().toLocaleString()
                    : new Date(item.timestamp as any).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    item.validity === 'Valid'
                      ? 'bg-secondary-100 text-secondary-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.validity}
                </span>
                {item.confidence && (
                  <span className="text-xs text-gray-500">
                    {item.confidence}% confidence
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


