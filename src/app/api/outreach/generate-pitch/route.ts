import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'
import { createGmailDraft } from '@/lib/gmail/drafts'
import { PITCH_ARTISTS, type PitchArtistSlug } from '@/lib/outreach/artist-profiles'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contactId, artistSlug, notes } = await request.json() as {
    contactId: string
    artistSlug: PitchArtistSlug
    notes?: string
  }

  const artist = PITCH_ARTISTS[artistSlug]
  if (!artist) return NextResponse.json({ error: 'Unknown artist slug' }, { status: 400 })

  // Fetch contact
  const { data: contact, error: contactErr } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()
  if (contactErr || !contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  // Fetch Gmail connection
  const { data: gmailConn } = await supabase
    .from('gmail_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (!gmailConn) return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 })

  const contactInfo = [
    contact.name,
    contact.company && `(${contact.company})`,
    contact.city && `${contact.city}${contact.state ? `, ${contact.state}` : ''}`,
  ].filter(Boolean).join(' — ')

  const artistContext = [
    `Artist: ${artist.name}`,
    `Genre: ${artist.genre}`,
    `Bio: ${artist.bio}`,
    `Metrics: ${artist.metrics}`,
    artist.topTracks && `Top tracks: ${artist.topTracks}`,
    artist.tourHistory && `Recent activity: ${artist.tourHistory}`,
    `Guarantee range: ${artist.guarantee}`,
    `Booking contact: ${artist.bookingContact} | ${artist.bookingEmail}`,
    notes && `Additional notes: ${notes}`,
  ].filter(Boolean).join('\n')

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 800,
    system: `You are X, an AI artist manager for DirtySnatcha Records (DSR).
Write outbound booking pitch emails on behalf of manager Thomas Nalian.
Tone: direct, confident, industry-savvy. Short and punchy — no filler.
Never use phrases like "I hope this email finds you well."
Get to the point in the first sentence. Make it easy to say yes.`,
    messages: [{
      role: 'user',
      content: `Write a booking pitch email to ${contactInfo} for ${artist.name}.

${artistContext}

Target market: ${contact.city ?? contact.region ?? 'their market'}
Promoter type: ${contact.market_type ?? 'venue/promoter'}

Write the email body only (no subject line). Keep it under 200 words.
End with Thomas Nalian's contact info: thomas@dirtysnatcha.com / 248-765-1997`,
    }],
  })

  const body = response.content[0].type === 'text' ? response.content[0].text : ''
  const subject = `Booking Inquiry — ${artist.name} | ${contact.city ?? contact.region ?? 'Your Market'} | 2026`

  const draft = await createGmailDraft({
    to: contact.email ?? '',
    subject,
    body,
    accessToken: gmailConn.access_token,
    refreshToken: gmailConn.refresh_token ?? undefined,
  })

  // Update contact pitch status + last_pitched_at
  await supabase
    .from('contacts')
    .update({ pitch_status: 'drafted', last_pitched_at: new Date().toISOString() })
    .eq('id', contactId)

  // Create deal at inquiry status to track this pitch
  const { data: deal } = await supabase
    .from('deals')
    .insert({
      title: `${artist.name} @ ${contact.company ?? contact.name} — ${contact.city ?? ''}`,
      artist_id: '', // no linked artist record yet for managed artists
      status: 'inquiry',
      gmail_draft_id: draft.id ?? null,
      notes: `Outbound pitch — ${artist.name}\n\n${body}`,
      deal_points: { artistSlug, contactId, pitchType: 'outbound' },
      created_by: user.id,
    })
    .select('id')
    .single()

  return NextResponse.json({
    draft: { id: draft.id, subject, to: contact.email, body },
    dealId: deal?.id ?? null,
    contact: { ...contact, pitch_status: 'drafted' },
  })
}
