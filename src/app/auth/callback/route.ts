import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Backfill user_id for pre-seeded artist_members rows
        await supabase
          .from('artist_members')
          .update({ user_id: user.id })
          .eq('email', user.email!)
          .is('user_id', null)

        if (next === '/dashboard') {
          // Route artist/agent members to the artist portal
          const { data: membership } = await supabase
            .from('artist_members')
            .select('role')
            .or(`user_id.eq.${user.id},email.eq.${user.email}`)
            .limit(1)
            .single()

          if (membership?.role === 'artist' || membership?.role === 'agent') {
            return NextResponse.redirect(new URL('/artist', origin))
          }

          // New users without a profile name go to onboarding
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

          if (!profile?.full_name) {
            return NextResponse.redirect(new URL('/onboarding', origin))
          }
        }
      }
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/auth/login?error=auth_failed', origin))
}
