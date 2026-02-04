import { cache } from 'react'
import { createClient } from './server'
import type { Tables } from './types'

export const getUserProfile = cache(async (): Promise<Tables<'user_profiles'> | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user profile:', error)
    return null
  }
  
  return profile
})

