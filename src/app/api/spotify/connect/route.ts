import { NextRequest, NextResponse } from 'next/server'
import { getSpotifyAuthUrl } from '@/lib/spotify/oauth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const artistId = searchParams.get('artistId')

  const state = JSON.stringify({ userId: user.id, artistId })
  const url = getSpotifyAuthUrl(state)

  return NextResponse.redirect(url)
}
