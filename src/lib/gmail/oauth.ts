import { google } from 'googleapis'
import type { SupabaseClient } from '@supabase/supabase-js'

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  )
}

export function getAuthUrl(state?: string) {
  const oauth2Client = getOAuthClient()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/photoslibrary',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    state,
  })
}

export async function exchangeCode(code: string) {
  const oauth2Client = getOAuthClient()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

/** Returns an OAuth2 client that auto-saves refreshed tokens back to Supabase. */
export function getOAuthClientWithPersistence(
  userId: string,
  accessToken: string,
  refreshToken: string | null,
  supabase: SupabaseClient
) {
  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken ?? undefined,
  })

  // When googleapis auto-refreshes, persist the new tokens
  oauth2Client.on('tokens', (tokens) => {
    const update: Record<string, unknown> = {}
    if (tokens.access_token) update.access_token = tokens.access_token
    if (tokens.refresh_token) update.refresh_token = tokens.refresh_token
    if (tokens.expiry_date) update.token_expires_at = new Date(tokens.expiry_date).toISOString()
    if (Object.keys(update).length > 0) {
      // fire-and-forget — don't block the response
      supabase.from('gmail_connections').update(update).eq('user_id', userId).then(() => {})
    }
  })

  return oauth2Client
}

export function getGmailClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  return google.gmail({ version: 'v1', auth: oauth2Client })
}

/** Gmail client that persists refreshed tokens. Use this in all routes. */
export function getGmailClientWithPersistence(
  userId: string,
  accessToken: string,
  refreshToken: string | null,
  supabase: SupabaseClient
) {
  const auth = getOAuthClientWithPersistence(userId, accessToken, refreshToken, supabase)
  return google.gmail({ version: 'v1', auth })
}

/** Google Drive client that persists refreshed tokens. */
export function getDriveClientWithPersistence(
  userId: string,
  accessToken: string,
  refreshToken: string | null,
  supabase: SupabaseClient
) {
  const auth = getOAuthClientWithPersistence(userId, accessToken, refreshToken, supabase)
  return google.drive({ version: 'v3', auth })
}

/** YouTube client that persists refreshed tokens. */
export function getYouTubeClientWithPersistence(
  userId: string,
  accessToken: string,
  refreshToken: string | null,
  supabase: SupabaseClient
) {
  const auth = getOAuthClientWithPersistence(userId, accessToken, refreshToken, supabase)
  return google.youtube({ version: 'v3', auth })
}
