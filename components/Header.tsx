'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export default function Header() {
  const { user, loading, signInWithGoogle, signOut, isAuthenticated } = useAuth()

  return (
    <header className="w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
            BlurImg
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={signInWithGoogle}
              className="px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Sign Up
            </button>
            <button
              onClick={signInWithGoogle}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}