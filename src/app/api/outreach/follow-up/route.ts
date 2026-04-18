import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'
import { createGmailDraft } from '@/lib/gmail/drafts'
import { PITCH_ARTISTS, type PitchArtistSlug } from '@/lib/outreach/artist-profiles'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contactId, artistSlug } = await request.json() as {
    contactId: string
    artistSlug: PitchArtistSlug
  }

  const artist = PITCH_ARTISTS[artistSlug]
  if (!artist) return NextResponse.json({ error: 'Unknown artist' }, { status: 400 })

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  const { data: gmailConn } = await supabase
    .from('gmail_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (!gmailConn) return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 })

  const daysSincePitch = contact.last_pitched_at
    ? Math.floor((Date.now() - new Date(contact.last_pitched_at).getTime()) / (1000 * 60 * 60 * 24))
    : null

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 400,
    system: `You are X, AI manager for DirtySnatcha Records. Write short follow-up emails on behalf of Thomas Nalian.
Tone: casual, direct, no pressure. Under 100 words. Reference the original pitch naturally.
Never use "I hope this finds you well" or corporate language. Get straight to the point.`,
    messages: [{
      role: 'user',
      content: `Write a follow-up email to ${contact.name}${contact.company ? ` at ${contact.company}` : ''} in ${contact.city ?? 'their market'}.

We pitched ${artist.name} to them ${daysSincePitch ? `${daysSincePitch} days ago` : 'recently'}.
No response yet.

The follow-up should:
- Reference that we reached out about ${artist.name}
- Ask if they had a chance to look at it
- Be short and human — not salesy
- End with Thomas Nalian's info: thomas@dirtysnatcha.com / 248-765-1997

Write the email body only.`,
    }],
  })

  const body = response.content[0].type === 'text' ? response.content[0].text : ''
  const subject = `Re: Booking Inquiry — ${artist.name} | ${contact.city ?? 'Your Market'} | 2026`

  const draft = await createGmailDraft({
    to: contact.email ?? '',
    subject,
    body,
    accessToken: gmailConn.access_token,
    refreshToken: gmailConn.refresh_token ?? undefined,
  })

  await supabase
    .from('contacts')
    .update({ last_pitched_at: new Date().toISOString() })
    .eq('id', contactId)

  return NextResponse.json({
    draft: { id: draft.id, subject, to: contact.email, body },
  })
}
