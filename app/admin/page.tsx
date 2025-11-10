'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, Users, UserPlus, Activity, MousePointerClick, BarChart2, Globe2 } from 'lucide-react'

const formatNumber = (value: number): string =>
  Number.isFinite(value) ? value.toLocaleString() : '0'

type RankedItem = {
  label: string
  count: number
}

type DailyDataPoint = {
  label: string
  count: number
}

type AnalyticsSummary = {
  totals: {
    totalUsers: number
    newUsers: number
    sessions: number
    eventCount: number
  }
  last24hSessions: number
  last24hEvents: number
  dailySessions: DailyDataPoint[]
  dailyEvents: DailyDataPoint[]
  eventsByName: RankedItem[]
  topPages: RankedItem[]
  topSources: RankedItem[]
  lastUpdated: Date | null
}

type AnalyticsResponseData = {
  totals: AnalyticsSummary['totals']
  last24hSessions: number
  last24hEvents: number
  dailySessions: DailyDataPoint[]
  dailyEvents: DailyDataPoint[]
  eventsByName: RankedItem[]
  topPages: RankedItem[]
  topSources: RankedItem[]
  lastUpdated: string | null
}

type AnalyticsSuccessResponse = { success: true } & AnalyticsResponseData
type AnalyticsErrorResponse = { success: false; error?: string }
type AnalyticsResponseEnvelope = AnalyticsSuccessResponse | AnalyticsErrorResponse

const DEFAULT_ANALYTICS: AnalyticsSummary = {
  totals: {
    totalUsers: 0,
    newUsers: 0,
    sessions: 0,
    eventCount: 0,
  },
  last24hSessions: 0,
  last24hEvents: 0,
  dailySessions: [],
  dailyEvents: [],
  eventsByName: [],
  topPages: [],
  topSources: [],
  lastUpdated: null,
}

const parseAnalyticsResponse = ({
  lastUpdated,
  ...rest
}: AnalyticsResponseData): AnalyticsSummary => ({
  ...rest,
  lastUpdated: lastUpdated ? new Date(lastUpdated) : null,
    })

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const [analytics, setAnalytics] = useState<AnalyticsSummary>(DEFAULT_ANALYTICS)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  useEffect(() => {
    const authStatus = sessionStorage.getItem('admin-authenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const fetchAnalytics = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setAnalyticsLoading(true)
      }

      try {
        const response = await fetch('/api/admin/analytics')
        if (!response.ok) {
          throw new Error(`Analytics request failed with status ${response.status}`)
        }

        const payload = (await response.json()) as AnalyticsResponseEnvelope

        if (!payload.success) {
          throw new Error(
            payload.error ?? 'Unable to load analytics. Check Google Analytics configuration.',
          )
        }

        setAnalytics(parseAnalyticsResponse(payload))
        setAnalyticsError(null)
      } catch (err) {
        console.error('Failed to load admin analytics:', err)
        setAnalyticsError('Unable to load analytics. Check Google Analytics configuration.')
      } finally {
        if (!options.silent) {
          setAnalyticsLoading(false)
        }
      }
    },
    [],
  )

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    void fetchAnalytics()
    const interval = window.setInterval(() => {
      void fetchAnalytics({ silent: true })
    }, 30000)

    return () => {
      window.clearInterval(interval)
    }
  }, [isAuthenticated, fetchAnalytics])

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setAnalyticsError(null)
    setIsAuthenticating(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      let payload: { success?: boolean; error?: string } | null = null

      try {
        payload = await response.json()
    } catch (err) {
        console.error('Failed to parse admin login response:', err)
      }

      if (!response.ok) {
        setError(payload?.error ?? 'Unable to login. Please try again.')
        return
      }

      if (payload?.success) {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin-authenticated', 'true')
      setError('')
        setPassword('')
      setAnalyticsError(null)
        void fetchAnalytics()
    } else {
        setError(payload?.error ?? 'Incorrect password')
      }
    } catch (err) {
      console.error('Failed to authenticate admin:', err)
      setError('Unable to login. Please try again later.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin-authenticated')
    setPassword('')
    setAnalytics(DEFAULT_ANALYTICS)
    setAnalyticsLoading(false)
    setAnalyticsError(null)
  }

  const dailySessionsMax = Math.max(1, ...analytics.dailySessions.map((day) => day.count))
  const dailyEventsMax = Math.max(1, ...analytics.dailyEvents.map((day) => day.count))

  const lastUpdatedDisplay = analytics.lastUpdated
    ? analytics.lastUpdated.toLocaleString()
    : '—'

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <Shield className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Admin Access</h1>
          <p className="mb-6 text-center text-gray-600">Enter password to view analytics</p>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-600"
              required
            />
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-3 font-medium text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none"
            >
              {isAuthenticating ? 'Verifying...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Analytics</h1>
          <p className="text-sm text-gray-500">
            Google Analytics insights for property activity
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
        >
          Logout
        </button>
      </div>

          {analyticsError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium">Analytics unavailable</p>
              <p className="mt-1">{analyticsError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-white p-6 shadow">
              <div className="flex items-start justify-between">
                <div>
              <p className="text-sm text-gray-500">Total users</p>
                  <p className="mt-3 text-3xl font-semibold text-gray-900">
                {formatNumber(analytics.totals.totalUsers)}
                  </p>
                </div>
                <div className="rounded-lg bg-primary-100 p-3 text-primary-600">
              <Users className="h-6 w-6" />
                </div>
              </div>
          <p className="mt-4 text-xs text-gray-500">Tracked users in the last 30 days</p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow">
              <div className="flex items-start justify-between">
                <div>
              <p className="text-sm text-gray-500">New users</p>
                  <p className="mt-3 text-3xl font-semibold text-gray-900">
                {formatNumber(analytics.totals.newUsers)}
                  </p>
                </div>
            <div className="rounded-lg bg-emerald-100 p-3 text-emerald-600">
              <UserPlus className="h-6 w-6" />
                </div>
              </div>
          <p className="mt-4 text-xs text-gray-500">First-time visitors in the last 30 days</p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow">
              <div className="flex items-start justify-between">
                <div>
              <p className="text-sm text-gray-500">Sessions (30 days)</p>
                  <p className="mt-3 text-3xl font-semibold text-gray-900">
                {formatNumber(analytics.totals.sessions)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {formatNumber(analytics.last24hSessions)} sessions in the past 24 hours
                  </p>
                </div>
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                  <Activity className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow">
              <div className="flex items-start justify-between">
                <div>
              <p className="text-sm text-gray-500">Events</p>
                  <p className="mt-3 text-3xl font-semibold text-gray-900">
                {formatNumber(analytics.totals.eventCount)}
                  </p>
              <p className="mt-2 text-xs text-gray-500">
                {formatNumber(analytics.last24hEvents)} events in the past 24 hours
              </p>
            </div>
            <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
              <MousePointerClick className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        {analyticsLoading && <span>Refreshing analytics…</span>}
        <span>Last updated {lastUpdatedDisplay}</span>
          </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Sessions · Last 7 days</h2>
            <BarChart2 className="h-5 w-5 text-primary-500" />
              </div>
              <div className="space-y-4">
            {analytics.dailySessions.length > 0 ? (
              analytics.dailySessions.map((day) => (
                <div key={`sessions-${day.label}`}>
                      <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{day.label}</span>
                    <span className="text-gray-600">{formatNumber(day.count)}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-gray-200">
                        <div
                      className="h-2 rounded-full bg-primary-500"
                      style={{ width: `${Math.max((day.count / dailySessionsMax) * 100, day.count > 0 ? 6 : 0)}%` }}
                        />
                      </div>
                    </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No session data available.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Events · Last 7 days</h2>
            <MousePointerClick className="h-5 w-5 text-purple-500" />
          </div>
              <div className="space-y-4">
            {analytics.dailyEvents.length > 0 ? (
              analytics.dailyEvents.map((day) => (
                <div key={`events-${day.label}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{day.label}</span>
                    <span className="text-gray-600">{formatNumber(day.count)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-gray-200">
                      <div
                      className="h-2 rounded-full bg-purple-500"
                      style={{ width: `${Math.max((day.count / dailyEventsMax) * 100, day.count > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                  </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No event data available.</p>
            )}
              </div>
            </div>
          </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Top events</h2>
          {analytics.eventsByName.length > 0 ? (
                <ul className="divide-y divide-gray-100">
              {analytics.eventsByName.map((item) => (
                    <li key={item.label} className="flex items-center justify-between py-3 text-sm">
                      <span className="font-medium text-gray-900">{item.label}</span>
                  <span className="text-gray-600">{formatNumber(item.count)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
            <p className="text-sm text-gray-500">No event activity recorded.</p>
              )}
            </div>

            <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Top pages</h2>
          {analytics.topPages.length > 0 ? (
                <ul className="divide-y divide-gray-100">
              {analytics.topPages.map((item) => (
                    <li key={item.label} className="flex items-center justify-between py-3 text-sm">
                  <span className="max-w-[70%] truncate font-medium text-gray-900">{item.label}</span>
                  <span className="text-gray-600">{formatNumber(item.count)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
            <p className="text-sm text-gray-500">No page view data available.</p>
              )}
            </div>
          </div>

      <div className="mt-8 rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Top traffic sources</h2>
          <Globe2 className="h-5 w-5 text-blue-500" />
        </div>
        {analytics.topSources.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {analytics.topSources.map((item) => (
              <li key={item.label} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-gray-900">{item.label}</span>
                <span className="text-gray-600">{formatNumber(item.count)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No source data available yet.</p>
            )}
          </div>
    </div>
  )
}
