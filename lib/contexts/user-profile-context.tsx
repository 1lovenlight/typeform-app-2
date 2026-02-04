'use client'

import { createContext, useContext } from 'react'
import type { Tables } from '@/lib/supabase/types'

type UserProfile = Tables<'user_profiles'> | null

const UserProfileContext = createContext<UserProfile | undefined>(undefined)

export function UserProfileProvider({
  children,
  profile,
}: {
  children: React.ReactNode
  profile: UserProfile
}) {
  return (
    <UserProfileContext.Provider value={profile}>
      {children}
    </UserProfileContext.Provider>
  )
}

export function useUserProfile() {
  const context = useContext(UserProfileContext)
  if (context === undefined) {
    throw new Error('useUserProfile must be used within UserProfileProvider')
  }
  return context
}

