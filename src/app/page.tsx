import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HomepageClient from './HomepageClient'

export const metadata = {
  title: 'TENx10 — AI-Powered Artist Management',
  description: 'The intelligent platform built for managers, artists, and labels. Booking intelligence, tour ops, release strategy, and AI-powered outreach — all in one place.',
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Logged-in users go straight to their portal
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'manager' || profile?.role === 'admin') {
      redirect('/dashboard')
    } else {
      redirect('/artist')
    }
  }

  return <HomepageClient />
}
