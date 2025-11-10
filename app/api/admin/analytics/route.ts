import { createSign } from 'crypto'
import { NextResponse } from 'next/server'

type RunReportRequest = {
  dateRanges: Array<{ startDate: string; endDate: string }>
  metrics: Array<{ name: string }>
  dimensions?: Array<{ name: string }>
  orderBys?: Array<
    | { metric: { metricName: string }; desc?: boolean }
    | { dimension: { dimensionName: string }; desc?: boolean }
  >
  limit?: number
}

type RunReportRow = {
  dimensionValues?: Array<{ value?: string }>
  metricValues?: Array<{ value?: string }>
}

type RunReportResponse = {
  rows?: RunReportRow[]
  rowCount?: number
  error?: { message?: string }
}

const GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'
const TOKEN_AUD = 'https://oauth2.googleapis.com/token'

const base64UrlEncode = (value: string) =>
  Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

const getAccessToken = async (clientEmail: string, privateKey: string): Promise<string> => {
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      scope: GA_SCOPE,
      aud: TOKEN_AUD,
      exp: now + 3600,
      iat: now,
    }),
  )

  const unsignedJwt = `${header}.${claimSet}`
  const signer = createSign('RSA-SHA256')
  signer.update(unsignedJwt)
  const signature = signer.sign(privateKey, 'base64')
  const encodedSignature = signature
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  const assertion = `${unsignedJwt}.${encodedSignature}`
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  })

  const tokenResponse = await fetch(TOKEN_AUD, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!tokenResponse.ok) {
    const error = await tokenResponse.json().catch(() => ({}))
    throw new Error(
      `Failed to obtain Google Analytics access token (${tokenResponse.status}): ${
        error.error_description ?? error.error ?? 'Unknown error'
      }`,
    )
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string }
  if (!tokenData.access_token) {
    throw new Error('Google Analytics token response missing access_token')
  }
  return tokenData.access_token
}

const runReport = async (
  propertyId: string,
  accessToken: string,
  request: RunReportRequest,
): Promise<RunReportResponse> => {
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  const data = (await response.json().catch(() => ({}))) as RunReportResponse

  if (!response.ok) {
    throw new Error(data?.error?.message ?? `Google Analytics runReport failed (${response.status})`)
  }

  return data
}

const parseMetricValue = (row: RunReportRow, index: number): number => {
  const raw = row.metricValues?.[index]?.value
  const value = raw ? Number(raw) : 0
  return Number.isFinite(value) ? value : 0
}

const parseDateKey = (value: string | undefined): Date | null => {
  if (!value || value.length !== 8) {
    return null
  }
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6)) - 1
  const day = Number(value.slice(6, 8))
  const date = new Date(Date.UTC(year, month, day))
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDateLabel = (date: Date | null): string => {
  if (!date) {
    return '—'
  }
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date)
}

const cleanLabel = (value: string | undefined, fallback: string): string =>
  value && value.trim().length > 0 ? value : fallback

export async function GET() {
  try {
    const clientEmail =
      process.env.GOOGLE_CLIENT_EMAIL ?? process.env.GA_SERVICE_ACCOUNT_EMAIL ?? ''
    const privateKeyRaw =
      process.env.GOOGLE_PRIVATE_KEY ?? process.env.GA_SERVICE_ACCOUNT_KEY ?? ''
    // Get property ID from environment or use Firebase Measurement ID
    // GA4 Property ID format: numbers only (e.g., "123456789")
    // Can be extracted from Measurement ID (G-XXXXXXXXXX) or set directly
    const propertyId = process.env.GA_PROPERTY_ID || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.replace('G-', '') || '511752577'

    if (!clientEmail || !privateKeyRaw) {
      console.error('Google Analytics credentials are not configured.', {
        hasClientEmail: Boolean(clientEmail),
        hasPrivateKey: Boolean(privateKeyRaw),
        envKeys: Object.keys(process.env).filter((key) => key.startsWith('GOOGLE') || key.startsWith('GA_')),
      })
      return NextResponse.json(
        { success: false, error: 'Google Analytics credentials are not configured.' },
        { status: 500 },
      )
    }

    const privateKey = privateKeyRaw.includes('BEGIN PRIVATE KEY')
      ? privateKeyRaw.replace(/\\n/g, '\n')
      : privateKeyRaw

    const accessToken = await getAccessToken(clientEmail, privateKey)

    const [totalsReport, dailyReport, eventsReport, pagesReport, sourcesReport] = await Promise.all([
      runReport(propertyId, accessToken, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'eventCount' },
        ],
      }),
      runReport(propertyId, accessToken, {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }, { name: 'eventCount' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      runReport(propertyId, accessToken, {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 6,
      }),
      runReport(propertyId, accessToken, {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePathPlusQueryString' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 6,
      }),
      runReport(propertyId, accessToken, {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionSourceMedium' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 6,
      }),
    ])

    const totalsRow = totalsReport.rows?.[0]
    const totals = {
      totalUsers: totalsRow ? parseMetricValue(totalsRow, 0) : 0,
      newUsers: totalsRow ? parseMetricValue(totalsRow, 1) : 0,
      sessions: totalsRow ? parseMetricValue(totalsRow, 2) : 0,
      eventCount: totalsRow ? parseMetricValue(totalsRow, 3) : 0,
    }

    const dailyRows = dailyReport.rows ?? []
    const dailySessions = dailyRows.map((row) => {
      const date = parseDateKey(row.dimensionValues?.[0]?.value)
      return {
        label: formatDateLabel(date),
        count: parseMetricValue(row, 0),
      }
    })
    const dailyEvents = dailyRows.map((row) => {
      const date = parseDateKey(row.dimensionValues?.[0]?.value)
      return {
        label: formatDateLabel(date),
        count: parseMetricValue(row, 1),
      }
    })

    const todayKey = (() => {
      const now = new Date()
      const yyyy = now.getUTCFullYear().toString().padStart(4, '0')
      const mm = (now.getUTCMonth() + 1).toString().padStart(2, '0')
      const dd = now.getUTCDate().toString().padStart(2, '0')
      return `${yyyy}${mm}${dd}`
    })()

    const todayRow = dailyRows.find((row) => row.dimensionValues?.[0]?.value === todayKey)
    const last24hSessions = todayRow ? parseMetricValue(todayRow, 0) : 0
    const last24hEvents = todayRow ? parseMetricValue(todayRow, 1) : 0

    const eventsByName = (eventsReport.rows ?? []).map((row) => ({
      label: cleanLabel(row.dimensionValues?.[0]?.value, '(not set)'),
      count: parseMetricValue(row, 0),
    }))

    const topPages = (pagesReport.rows ?? []).map((row) => ({
      label: decodeURIComponent(cleanLabel(row.dimensionValues?.[0]?.value, '(not set)')),
      count: parseMetricValue(row, 0),
    }))

    const topSources = (sourcesReport.rows ?? []).map((row) => ({
      label: cleanLabel(row.dimensionValues?.[0]?.value, '(not set)'),
      count: parseMetricValue(row, 0),
    }))

    return NextResponse.json({
      success: true,
      totals,
      last24hSessions,
      last24hEvents,
      dailySessions,
      dailyEvents,
      eventsByName,
      topPages,
      topSources,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to load Google Analytics data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load analytics' },
      { status: 500 },
    )
  }
}

