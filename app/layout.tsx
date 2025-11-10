import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// Import CSS FIRST - this ensures it loads before other dependencies
import './globals.css'
import Header from '@/components/Header'
import { ToastProvider } from '@/lib/toast'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Ensure font loads with proper fallback
  preload: true,
})

const firebaseRuntimeConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
}

const firebaseConfigScript = `
  window.__FIREBASE_CONFIG__ = ${JSON.stringify(firebaseRuntimeConfig)};
`

export const metadata: Metadata = {
  title: 'CashGuard - Currency Validation Tool',
  description: 'Secure and reliable currency validation at your fingertips',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-C52T16CNJL" />
        <script
          dangerouslySetInnerHTML={{
            __html: firebaseConfigScript,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-C52T16CNJL');
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AnalyticsProvider>
          <ServiceWorkerRegistration />
          <Header />
          <main className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
            {children}
          </main>
          <ToastProvider />
        </AnalyticsProvider>
      </body>
    </html>
  )
}
