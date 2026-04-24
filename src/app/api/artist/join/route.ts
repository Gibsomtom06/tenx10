import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const {
    token,
    inviteId,
    artistId,
    email,
    password,
    bio,
    instagram,
    tiktok,
    soundcloud,
    spotifyUrl,
  } = await request.json()

  if (!token || !email || !password || !artistId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const service = await createServiceClient()

  // Validate invite is still valid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invite } = await (service as any)
    .from('artist_invites')
    .select('id, expires_at, accepted_at')
    .eq('token', token)
    .single()

  if (!invite) return NextResponse.json({ error: 'Invalid invite' }, { status: 400 })
  if (invite.accepted_at) return NextResponse.json({ error: 'Invite already used' }, { status: 400 })
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Invite expired' }, { status: 400 })

  // Create auth user
  const { data: authData, error: authErr } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { artist_id: artistId, role: 'artist' },
  })

  if (authErr || !authData.user) {
    if (authErr?.message?.includes('already registered')) {
      return NextResponse.json({ error: 'An account with this email already exists. Try logging in instead.' }, { status: 409 })
    }
    return NextResponse.json({ error: authErr?.message ?? 'Failed to create account' }, { status: 500 })
  }

  const userId = authData.user.id

  // Build social stats
  const socialStats: Record<string, string> = {}
  if (instagram) socialStats.instagram = instagram.replace('@', '')
  if (tiktok) socialStats.tiktok = tiktok.replace('@', '')
  if (soundcloud) socialStats.soundcloud = soundcloud
  const spotifyId = spotifyUrl?.match(/artist\/([a-zA-Z0-9]+)/)?.[1]

  // Update artist record with user_id and profile data
  await service.from('artists').update({
    user_id: userId,
    ...(bio ? { bio } : {}),
    ...(spotifyId ? { spotify_artist_id: spotifyId } : {}),
    ...(Object.keys(socialStats).length ? { social_stats: socialStats } : {}),
    updated_at: new Date().toISOString(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any).eq('id', artistId)

  // Create profile row
  await service.from('profiles').upsert({
    id: userId,
    full_name: null,
    updated_at: new Date().toISOString(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any, { onConflict: 'id' })

  // Mark invite accepted
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any).from('artist_invites').update({ accepted_at: new Date().toISOString() }).eq('id', inviteId)

  return NextResponse.json({ ok: true, userId })
}
