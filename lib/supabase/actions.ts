'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'

export async function updateUsername(username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { error } = await supabase
    .from('user_profiles')
    .upsert({ id: user.id, username }, { onConflict: 'id' })
  
  if (error) throw error
  
  revalidatePath('/settings')
}