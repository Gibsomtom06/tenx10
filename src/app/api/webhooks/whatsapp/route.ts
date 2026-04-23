/**
 * WhatsApp Webhook Handler (via Twilio)
 * Handles inbound WhatsApp messages routed through Twilio.
 *
 * Setup:
 *   1. Get a Twilio account + WhatsApp-enabled number
 *   2. Set env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 *   3. In Twilio console, set webhook URL to: https://yourdomain.com/api/webhooks/whatsapp
 */

import { NextRequest, NextResponse } from 'next/server'
import { runIngest } from '@/lib/ingest/core'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? ''
const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN ?? ''
const TWILIO_FROM        = process.env.TWILIO_WHATSAPP_FROM ?? ''

async function verifyTwilioSignature(req: NextRequest, body: string, url: string): Promise<boolean> {
  if (!TWILIO_AUTH_TOKEN) return true // skip in dev
  const signature = req.headers.get('x-twilio-signature') ?? ''
  const params = new URLSearchParams(body)
  const sortedParams = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b))
  const validationString = url + sortedParams.map(([k, v]) => k + v).join('')
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(TWILIO_AUTH_TOKEN), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(validationString))
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)))
  return signature === expected
}

async function sendWhatsApp(to: string, body: string): Promise<void> {
  if (!TWILIO_ACCOUNT_SID) return
  const url = 'https://api.twilio.com/2010-04-01/Accounts/' + TWILIO_ACCOUNT_SID + '/Messages.json'
  // Split long messages (WhatsApp 4096 char limit)
  const chunks = chunkText(body, 4000)
  for (const chunk of chunks) {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(TWILIO_ACCOUNT_SID + ':' + TWILIO_AUTH_TOKEN),
      },
      body: new URLSearchParams({ From: 'whatsapp:' + TWILIO_FROM, To: to, Body: chunk }).toString(),
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
  const url = request.url

  const valid = await verifyTwilioSignature(request, rawBody, url)
  if (!valid) return new NextResponse('Forbidden', { status: 403 })

  const params = new URLSearchParams(rawBody)
  const from    = params.get('From') ?? ''       // "whatsapp:+12485551234"
  const body    = params.get('Body') ?? ''
  const userId  = from.replace('whatsapp:', '')
  const sessionKey = 'whatsapp:' + userId

  // Respond with empty TwiML immediately to prevent Twilio timeout
  const twimlResponse = new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { headers: { 'Content-Type': 'text/xml' } }
  )

  // Process in background
  runIngest({ message: body || '__init__', history: [], state: { phase: 'intro', artistData: {}, researchComplete: false }, sessionKey })
    .then(output => sendWhatsApp(from, output.reply))
    .catch(console.error)

  return twimlResponse
}

// Twilio verification challenge
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('hub.challenge')
  if (challenge) return new NextResponse(challenge)
  return NextResponse.json({ status: 'TENx10 WhatsApp webhook active' })
}
