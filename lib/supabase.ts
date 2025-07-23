import { createClient } from '@supabase/supabase-js'

// Mock Supabase client for development without authentication
const mockSupabaseClient = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithOAuth: async () => ({ error: null }),
    signOut: async () => ({ error: null })
  }
}

export const supabase = mockSupabaseClient as any