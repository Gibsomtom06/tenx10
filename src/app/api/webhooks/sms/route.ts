/**
 * SMS Webhook Handler (via Twilio)
 * Same architecture as WhatsApp but for plain SMS.
 *
 * Setup:
 *   1. Twilio account + SMS-capable number
 *   2. Set env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM
 *   3. Set Twilio webhook URL to: https://yourdomain.com/api/webhooks/sms
 */

import { NextRequest, NextResponse } from 'next/server'
import { runIngest } from '@/lib/ingest/core'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? ''
const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN ?? ''
const TWILIO_SMS_FROM    = process.env.TWILIO_SMS_FROM ?? ''

async function sendSMS(to: string, body: string): Promise<void> {
  if (!TWILIO_ACCOUNT_SID) return
  const url = 'https://api.twilio.com/2010-04-01/Accounts/' + TWILIO_ACCOUNT_SID + '/Messages.json'
  // SMS: 160 char segments, keep it under 1600 total
  const truncated = body.slice(0, 1600)
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(TWILIO_ACCOUNT_SID + ':' + TWILIO_AUTH_TOKEN),
    },
    body: new URLSearchParams({ From: TWILIO_SMS_FROM, To: to, Body: truncated }).toString(),
  })
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const params  = new URLSearchParams(rawBody)
  const from    = params.get('From') ?? ''
  const body    = params.get('Body') ?? ''
  const sessionKey = 'sms:' + from

  // Respond with empty TwiML immediately
  const twimlResponse = new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { headers: { 'Content-Type': 'text/xml' } }
  )

  runIngest({ message: body || '__init__', history: [], state: { phase: 'intro', artistData: {}, researchComplete: false }, sessionKey })
    .then(output => sendSMS(from, output.reply))
    .catch(console.error)

  return twimlResponse
}

export async function GET() {
  return NextResponse.json({ status: 'TENx10 SMS webhook active' })
}
