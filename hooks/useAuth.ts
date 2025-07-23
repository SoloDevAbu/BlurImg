'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Authentication disabled for now
    setUser(null)
    setLoading(false)
  }, [])

  const signInWithGoogle = async () => {
    // Authentication disabled for now
    console.log('Authentication disabled for development')
  }

  const signOut = async () => {
    // Authentication disabled for now
    console.log('Authentication disabled for development')
  }

  return {
    user,
    loading,
    isAuthenticated: false,
    signInWithGoogle,
    signOut
  }
}