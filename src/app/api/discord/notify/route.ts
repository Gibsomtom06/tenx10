'use server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CRON_SECRET = process.env.CRON_SECRET
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL

export async function POST(req: Request) {
  // Auth: logged-in user OR cron secret
  const authHeader = req.headers.get('authorization')
  const isCron = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`

  if (!isCron) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!DISCORD_WEBHOOK) {
    return NextResponse.json({ error: 'DISCORD_WEBHOOK_URL not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const {
    type = 'info',        // 'approval' | 'alert' | 'info' | 'done'
    title,
    message,
    link,
    items,               // optional string[]
  } = body

  if (!title || !message) {
    return NextResponse.json({ error: 'title and message required' }, { status: 400 })
  }

  const COLOR = {
    approval: 0xf59e0b, // amber — needs action
    alert:    0xef4444, // red — urgent
    info:     0x7c3aed, // violet — fyi
    done:     0x22c55e, // green — completed
  }[type as string] ?? 0x7c3aed

  const EMOJI = {
    approval: '🟡',
    alert:    '🔴',
    info:     '🔵',
    done:     '✅',
  }[type as string] ?? '🔵'

  const fields: { name: string; value: string; inline?: boolean }[] = []

  if (items && items.length > 0) {
    fields.push({
      name: 'details',
      value: items.slice(0, 25).map((i: string) => `• ${i}`).join('\n'),
      inline: false,
    })
  }

  if (link) {
    fields.push({ name: '​', value: `[${link.includes('tenx10.co') ? 'Open Dashboard' : 'View'} →](${link})`, inline: false })
  } else {
    fields.push({ name: '​', value: '[Open Dashboard →](https://tenx10.co/dashboard/ops)', inline: false })
  }

  const payload = {
    embeds: [{
      title: `${EMOJI} ${title}`,
      description: message,
      color: COLOR,
      fields,
      footer: { text: 'TENx10 · tenx10.co' },
      timestamp: new Date().toISOString(),
    }],
  }

  const res = await fetch(DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: `Discord error: ${res.status} ${text}` }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
