"use client"

import Link from 'next/link'
import { AuthButton } from '@/components/Auth'

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-gray-900">
          CashGuard
        </Link>
        <nav className="flex items-center gap-4 text-sm text-gray-700">
          <Link href="/scanner" className="hover:text-gray-900">
            Scanner
          </Link>
          <Link href="/history" className="hover:text-gray-900">
            History
          </Link>
          <Link href="/admin" className="hover:text-gray-900">
            Admin
          </Link>
          <Link href="/settings" className="hover:text-gray-900">
            Settings
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  )
}


