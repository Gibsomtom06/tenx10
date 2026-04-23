/**
 * Slack Webhook Handler
 * Handles Slack Events API messages (DMs and app mentions).
 *
 * Setup:
 *   1. Create a Slack app at https://api.slack.com/apps
 *   2. Enable Socket Mode or Events API
 *   3. Add bot scopes: chat:write, im:history, im:read
 *   4. Set env vars: SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET
 *   5. Set Request URL to: https://yourdomain.com/api/webhooks/slack
 */

import { NextRequest, NextResponse } from 'next/server'
import { runIngest } from '@/lib/ingest/core'

const SLACK_BOT_TOKEN      = process.env.SLACK_BOT_TOKEN ?? ''
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET ?? ''

async function verifySlackSignature(req: NextRequest, body: string): Promise<boolean> {
  if (!SLACK_SIGNING_SECRET) return true // skip in dev
  const timestamp = req.headers.get('x-slack-request-timestamp') ?? ''
  const signature = req.headers.get('x-slack-signature') ?? ''
  // Reject requests older than 5 minutes
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) return false
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(SLACK_SIGNING_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const baseString = 'v0:' + timestamp + ':' + body
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(baseString))
  const hex = 'v0=' + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return hex === signature
}

async function sendSlackMessage(channel: string, text: string): Promise<void> {
  if (!SLACK_BOT_TOKEN) return
  // Split at 3000 chars (Slack block limit)
  const chunks = chunkText(text, 3000)
  for (const chunk of chunks) {
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SLACK_BOT_TOKEN },
      body: JSON.stringify({ channel, text: chunk }),
    })
  }
}

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size))
  return chunks.length > 0 ? chunks : [text]
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  const valid = await verifySlackSignature(request, rawBody)
  if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

  const payload = JSON.parse(rawBody)

  // Slack URL verification challenge
  if (payload.type === 'url_verification') {
    return NextResponse.json({ challenge: payload.challenge })
  }

  // Event callback
  if (payload.type === 'event_callback') {
    const event = payload.event
    // Only handle direct messages and app mentions, ignore bot messages
    if (event.bot_id || event.subtype === 'bot_message') {
      return NextResponse.json({ ok: true })
    }

    const userId     = event.user ?? 'unknown'
    const channel    = event.channel ?? ''
    const text       = event.text?.replace(/<@[A-Z0-9]+>/g, '').trim() ?? ''
    const sessionKey = 'slack:' + userId

    // Acknowledge Slack immediately (must respond within 3s)
    const ack = NextResponse.json({ ok: true })

    runIngest({ message: text || '__init__', history: [], state: { phase: 'intro', artistData: {}, researchComplete: false }, sessionKey })
      .then(output => sendSlackMessage(channel, output.reply))
      .catch(console.error)

    return ack
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ status: 'TENx10 Slack webhook active' })
}
