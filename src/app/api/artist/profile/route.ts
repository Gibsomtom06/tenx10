import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    artistId,
    bio,
    genre,
    phone,
    spotifyUrl,
    instagram,
    tiktok,
    soundcloud,
    youtube,
    website,
  } = await request.json()

  if (!artistId) return NextResponse.json({ error: 'artistId required' }, { status: 400 })

  // Ensure user owns this artist record
  const { data: artist } = await supabase
    .from('artists')
    .select('id, user_id, manager_id')
    .eq('id', artistId)
    .single()

  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = artist as any
  const isOwner = a.user_id === user.id || a.manager_id === user.id
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const spotifyId = spotifyUrl?.match(/artist\/([a-zA-Z0-9]+)/)?.[1] ?? null

  const socialStats: Record<string, string> = {}
  if (instagram) socialStats.instagram = instagram.replace('@', '')
  if (tiktok) socialStats.tiktok = tiktok.replace('@', '')
  if (soundcloud) socialStats.soundcloud = soundcloud
  if (youtube) socialStats.youtube = youtube
  if (website) socialStats.website = website

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: any = { updated_at: new Date().toISOString() }
  if (bio !== undefined) update.bio = bio || null
  if (genre !== undefined) update.genre = genre || null
  if (phone !== undefined) update.phone = phone || null
  if (spotifyId !== null) update.spotify_artist_id = spotifyId
  if (Object.keys(socialStats).length > 0) update.social_stats = socialStats

  const { error } = await supabase.from('artists').update(update).eq('id', artistId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
