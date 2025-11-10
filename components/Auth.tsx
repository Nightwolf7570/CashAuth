'use client'

import { useState, useEffect } from 'react'
import { User, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { LogIn, LogOut, User as UserIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const authInstance = getFirebaseAuth()
    if (!authInstance) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const authInstance = getFirebaseAuth()
    if (!authInstance) {
      toast.error('Authentication is not available')
      return
    }
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(authInstance, provider)
      toast.success('Signed in successfully!')
    } catch (error: any) {
      // Don't show error for user cancellation
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, don't show error
        return
      }
      console.error('Sign in error:', error)
      toast.error(error.message || 'Failed to sign in')
    }
  }

  const handleSignOut = async () => {
    const authInstance = getFirebaseAuth()
    if (!authInstance) {
      toast.error('Authentication is not available')
      return
    }
    try {
      await signOut(authInstance)
      toast.success('Signed out successfully!')
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  if (loading) {
    return (
      <div className="px-3 py-2 text-sm text-gray-600">
        Loading...
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-sm text-gray-700">
          <UserIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{user.displayName || user.email}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-2 px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={signInWithGoogle}
      className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
    >
      <LogIn className="w-4 h-4" />
      <span className="hidden sm:inline">Sign In</span>
    </button>
  )
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const authInstance = getFirebaseAuth()
    if (!authInstance) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, loading }
}

