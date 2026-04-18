import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, getOAuthClient } from '@/lib/gmail/oauth'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // user_id

  if (!code) return NextResponse.redirect(new URL('/dashboard/gmail?error=no_code', request.url))

  try {
    const tokens = await exchangeCode(code)

    const oauth2Client = getOAuthClient()
    oauth2Client.setCredentials({ access_token: tokens.access_token! })
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()

    const supabase = await createClient()

    await supabase.from('gmail_connections').upsert({
      user_id: state!,
      email: userInfo.email ?? '',
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
    }, { onConflict: 'user_id' })

    return NextResponse.redirect(new URL('/dashboard/gmail?connected=true', request.url))
  } catch (error) {
    console.error('Gmail OAuth error:', error)
    return NextResponse.redirect(new URL('/dashboard/gmail?error=oauth_failed', request.url))
  }
}
