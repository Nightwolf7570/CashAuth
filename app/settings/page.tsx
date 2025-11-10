'use client'

import { useState, useEffect } from 'react'
import { Settings, Key, Gauge, Save, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7)
  const [autoSave, setAutoSave] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    const savedKey = localStorage.getItem('gemini-api-key') || ''
    const savedThreshold = parseFloat(localStorage.getItem('confidence-threshold') || '0.7')
    const savedAutoSave = localStorage.getItem('auto-save-history') !== 'false'

    setGeminiApiKey(savedKey)
    setConfidenceThreshold(savedThreshold)
    setAutoSave(savedAutoSave)
  }, [])

  const handleSave = () => {
    localStorage.setItem('gemini-api-key', geminiApiKey)
    localStorage.setItem('confidence-threshold', confidenceThreshold.toString())
    localStorage.setItem('auto-save-history', autoSave.toString())

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
          <Settings className="w-6 h-6 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Gemini API Key */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Key className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Gemini API Key</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Enter your Google Gemini API key for enhanced AI-powered currency validation.
            <br />
            <a
              href="https://ai.google.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Get your API key here
            </a>
          </p>
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="Enter your Gemini API key"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
          {geminiApiKey && (
            <p className="mt-2 text-sm text-gray-500">
              Key is stored locally in your browser and never shared.
            </p>
          )}
        </div>

        {/* Confidence Threshold */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Gauge className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Confidence Threshold</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Adjust the minimum confidence level required for a bill to be considered valid.
            Lower values are more lenient, higher values are stricter.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Threshold: {(confidenceThreshold * 100).toFixed(0)}%</span>
              <span className="text-sm text-gray-500">
                {(confidenceThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.3"
              max="0.95"
              step="0.05"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Lenient (30%)</span>
              <span>Balanced</span>
              <span>Strict (95%)</span>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Current setting:</strong> Bills with confidence below{' '}
              {(confidenceThreshold * 100).toFixed(0)}% will be marked as uncertain or invalid.
            </p>
          </div>
        </div>

        {/* Auto-save History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">History Settings</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Automatically save scan results to your history for later review.
          </p>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
            />
            <span className="text-gray-700">Enable auto-save to history</span>
          </label>
          {!autoSave && (
            <p className="mt-3 text-sm text-gray-500">
              Scan results will not be automatically saved. You can still manually save individual results.
            </p>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-all ${
              saved
                ? 'bg-secondary-600 text-white'
                : 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:shadow-lg'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
