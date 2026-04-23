/**
 * Facebook Messenger Webhook Handler
 * Handles messages sent to the TENx10 Facebook Page via Messenger.
 *
 * Setup:
 *   1. Create a Facebook App at https://developers.facebook.com
 *   2. Add Messenger product, connect your Page
 *   3. Set env vars: FACEBOOK_PAGE_ACCESS_TOKEN, FACEBOOK_VERIFY_TOKEN
 *   4. Set webhook URL to: https://yourdomain.com/api/webhooks/messenger
 *   5. Subscribe to: messages, messaging_postbacks
 */

import { NextRequest, NextResponse } from 'next/server'
import { runIngest } from '@/lib/ingest/core'

const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN ?? ''
const VERIFY_TOKEN      = process.env.FACEBOOK_VERIFY_TOKEN ?? 'tenx10_verify'

async function sendMessengerMessage(recipientId: string, text: string): Promise<void> {
  if (!PAGE_ACCESS_TOKEN) return
  // Messenger: 2000 char limit per message
  const chunks = chunkText(text, 1900)
  for (const chunk of chunks) {
    await fetch('https://graph.facebook.com/v19.0/me/messages?access_token=' + PAGE_ACCESS_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: { id: recipientId }, message: { text: chunk } }),
    })
  }
}

// GET: Facebook webhook verification
function chunkText(text: string, size: number): string[] {
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size))
  return chunks.length > 0 ? chunks : [text]
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ status: 'TENx10 Messenger webhook active' })
}

// POST: Incoming messages
export async function POST(request: NextRequest) {
  const body = await request.json()

  if (body.object !== 'page') {
    return NextResponse.json({ error: 'Not a page event' }, { status: 400 })
  }

  for (const entry of (body.entry ?? [])) {
    for (const event of (entry.messaging ?? [])) {
      const senderId = event.sender?.id
      if (!senderId) continue

      // Skip echoes (messages the page itself sent)
      if (event.message?.is_echo) continue

      const text = event.message?.text ?? event.postback?.payload ?? ''
      const sessionKey = 'messenger:' + senderId

      runIngest({ message: text || '__init__', history: [], state: { phase: 'intro', artistData: {}, researchComplete: false }, sessionKey })
        .then(output => sendMessengerMessage(senderId, output.reply))
        .catch(console.error)
    }
  }

  // Facebook requires 200 OK quickly
  return NextResponse.json({ status: 'ok' })
}
