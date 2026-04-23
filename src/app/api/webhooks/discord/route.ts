/**
 * Discord Webhook Handler
 * Handles slash commands and DM messages from the TENx10 Discord bot.
 *
 * Setup:
 *   1. Create a Discord application at https://discord.com/developers
 *   2. Add a bot, enable Message Content Intent
 *   3. Set env vars: DISCORD_PUBLIC_KEY, DISCORD_BOT_TOKEN
 *   4. Set Interactions Endpoint URL to: https://yourdomain.com/api/webhooks/discord
 */

import { NextRequest, NextResponse } from 'next/server'
import { runIngest } from '@/lib/ingest/core'

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY ?? ''
const DISCORD_BOT_TOKEN  = process.env.DISCORD_BOT_TOKEN ?? ''

// Discord interaction types
const PING = 1
const APPLICATION_COMMAND = 2
const MESSAGE_COMPONENT = 3

// Discord interaction response types
const PONG = 1
const CHANNEL_MESSAGE_WITH_SOURCE = 4
const DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5

async function verifyDiscordSignature(req: NextRequest, body: string): Promise<boolean> {
  if (!DISCORD_PUBLIC_KEY) return false
  const signature = req.headers.get('x-signature-ed25519') ?? ''
  const timestamp  = req.headers.get('x-signature-timestamp') ?? ''
  try {
    const encoder = new TextEncoder()
    const keyData = Uint8Array.from(DISCORD_PUBLIC_KEY.match(/.{1,2}/g)!.map(b => parseInt(b, 16)))
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'Ed25519' }, false, ['verify'])
    const sigBytes  = Uint8Array.from(signature.match(/.{1,2}/g)!.map(b => parseInt(b, 16)))
    const msgBytes  = encoder.encode(timestamp + body)
    return await crypto.subtle.verify({ name: 'Ed25519' }, cryptoKey, sigBytes, msgBytes)
  } catch {
    return false
  }
}

async function sendDiscordFollowup(interactionToken: string, content: string): Promise<void> {
  const url = 'https://discord.com/api/v10/webhooks/' + process.env.DISCORD_APP_ID + '/' + interactionToken + '/messages/@original'
  await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bot ' + DISCORD_BOT_TOKEN },
    body: JSON.stringify({ content: content.slice(0, 2000) }),
  })
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  // Verify Discord signature
  const valid = await verifyDiscordSignature(request, rawBody)
  if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

  const interaction = JSON.parse(rawBody)

  // Respond to ping (Discord requires this)
  if (interaction.type === PING) {
    return NextResponse.json({ type: PONG })
  }

  if (interaction.type === APPLICATION_COMMAND || interaction.type === MESSAGE_COMPONENT) {
    const userId   = interaction.member?.user?.id ?? interaction.user?.id ?? 'unknown'
    const message  = interaction.data?.options?.[0]?.value ?? interaction.data?.custom_id ?? ''
    const sessionKey = 'discord:' + userId

    // Acknowledge immediately (Discord requires response within 3s)
    // We send a deferred response then update via followup
    const deferResponse = NextResponse.json({ type: DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE })

    // Run ingest in background
    const interactionToken = interaction.token
    runIngest({ message: message || '__init__', history: [], state: { phase: 'intro', artistData: {}, researchComplete: false }, sessionKey })
      .then(output => sendDiscordFollowup(interactionToken, output.reply))
      .catch(console.error)

    return deferResponse
  }

  // Handle direct messages via bot (non-interaction events go through gateway, not webhooks)
  return NextResponse.json({ type: CHANNEL_MESSAGE_WITH_SOURCE, data: { content: 'Message received.' } })
}

// Discord verification challenge (GET)
export async function GET() {
  return NextResponse.json({ status: 'TENx10 Discord webhook active' })
}
