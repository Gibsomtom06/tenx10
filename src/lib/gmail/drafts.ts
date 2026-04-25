import { getGmailClient, getGmailClientWithPersistence } from './oauth'
import type { SupabaseClient } from '@supabase/supabase-js'

interface DraftParams {
  to: string
  subject: string
  body: string
  accessToken: string
  refreshToken?: string
  cc?: string[]
  userId?: string
  supabase?: SupabaseClient
}

export async function createGmailDraft({ to, subject, body, accessToken, refreshToken, cc, userId, supabase }: DraftParams) {
  const gmail = userId && supabase
    ? getGmailClientWithPersistence(userId, accessToken, refreshToken ?? null, supabase)
    : getGmailClient(accessToken, refreshToken)

  const headers: string[] = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
  ]
  if (cc && cc.length > 0) headers.push(`Cc: ${cc.join(', ')}`)

  const message = [...headers, '', body].join('\n')
  const encoded = Buffer.from(message).toString('base64url')

  const { data } = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: { message: { raw: encoded } },
  })

  return data
}

export async function listGmailMessages(accessToken: string, query?: string, maxResults = 20) {
  const gmail = getGmailClient(accessToken)
  const { data } = await gmail.users.messages.list({
    userId: 'me',
    q: query ?? 'label:inbox',
    maxResults,
  })
  return data.messages ?? []
}

export async function getGmailMessage(accessToken: string, messageId: string) {
  const gmail = getGmailClient(accessToken)
  const { data } = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  })
  return data
}
