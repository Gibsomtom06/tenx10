import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingWizard from './OnboardingWizard'

export const metadata = { title: 'Setup — TENx10' }

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // If already set up, go to dashboard
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const { count: artistCount } = await supabase.from('artists').select('*', { count: 'exact', head: true })
  const { data: gmail } = await supabase.from('gmail_connections').select('email').eq('user_id', user.id).single()

  const setupDone = !!(profile?.full_name && (artistCount ?? 0) > 0 && gmail)
  if (setupDone) redirect('/dashboard')

  return (
    <OnboardingWizard
      email={user.email ?? ''}
      hasProfile={!!profile?.full_name}
      hasArtists={(artistCount ?? 0) > 0}
      hasGmail={!!gmail}
      gmailEmail={gmail?.email ?? null}
    />
  )
}
