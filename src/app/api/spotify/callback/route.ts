import { NextRequest, NextResponse } from 'next/server'
import { exchangeSpotifyCode } from '@/lib/spotify/oauth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) return NextResponse.redirect('/dashboard/spotify?error=no_code')

  try {
    const { userId, artistId } = JSON.parse(state ?? '{}')
    const tokens = await exchangeSpotifyCode(code)

    if (artistId) {
      const supabase = await createClient()
      await supabase.from('artists').update({
        spotify_access_token: tokens.access_token,
        spotify_refresh_token: tokens.refresh_token,
        spotify_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      }).eq('id', artistId)
    }

    return NextResponse.redirect(new URL('/dashboard/spotify?connected=true', request.url))
  } catch (error) {
    console.error('Spotify OAuth error:', error)
    return NextResponse.redirect(new URL('/dashboard/spotify?error=oauth_failed', request.url))
  }
}
