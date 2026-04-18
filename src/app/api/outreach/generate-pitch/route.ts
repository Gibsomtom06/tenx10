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

  const { data: contact, error: contactErr } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single()
  if (contactErr || !contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  const { data: gmailConn } = await supabase
    .from('gmail_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (!gmailConn) return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 })

  // ── Relationship history ─────────────────────────────────────────────────
  const { data: allDeals } = await supabase
    .from('deals')
    .select('*')
    .neq('status', 'cancelled')

  const contactDeals = (allDeals ?? []).filter(d => {
    const pts = d.deal_points as Record<string, string> | null
    return pts?.contactId === contactId
  })

  // Duplicate guard: same artist pitched to same contact in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const recentDuplicate = contactDeals.find(d => {
    const pts = d.deal_points as Record<string, string> | null
    return pts?.artistSlug === artistSlug && d.created_at > thirtyDaysAgo
  })
  if (recentDuplicate) {
    return NextResponse.json({
      error: 'duplicate_recent',
      message: `${artist.name} was already pitched to ${contact.name} in the last 30 days. Re-pitch anyway?`,
      existingDealId: recentDuplicate.id,
    }, { status: 409 })
  }

  // Build relationship context for the prompt
  const pastArtists = [...new Set(
    contactDeals
      .map(d => (d.deal_points as Record<string, string> | null)?.artistSlug)
      .filter(Boolean)
  )]
  const confirmedDeals = contactDeals.filter(d => ['confirmed', 'completed'].includes(d.status))
  const isWarm = confirmedDeals.length > 0 || contactDeals.length > 0

  let relationshipContext = ''
  if (confirmedDeals.length > 0) {
    const showSummaries = confirmedDeals.map(d => {
      const pts = d.deal_points as Record<string, string> | null
      return `${pts?.artistSlug ?? 'an artist'} at ${pts?.city ?? 'their market'}`
    }).join(', ')
    relationshipContext = `RELATIONSHIP: ${contact.name} has confirmed ${confirmedDeals.length} show(s) with DSR before — ${showSummaries}. This is a warm contact. Reference the existing relationship naturally.`
  } else if (pastArtists.length > 0) {
    relationshipContext = `RELATIONSHIP: ${contact.name} has been in discussions with DSR before (${pastArtists.join(', ')} were pitched). Not confirmed yet, but not a cold contact. Reference the ongoing conversation.`
  }

  // If pitching a different artist to someone who already works with DS, bridge it
  if (isWarm && artistSlug !== 'dirtysnatcha' && pastArtists.includes('dirtysnatcha')) {
    relationshipContext += `\n\nIMPORTANT: This contact works with DirtySnatcha. You are now introducing ${artist.name}, a different artist on the DSR roster. Frame this as expanding the relationship — "now that we've worked together on DS, I want to bring you another artist from the label you should know about."`
  }

  // ── Routing proximity ────────────────────────────────────────────────────
  const confirmedShows = (allDeals ?? [])
    .filter(d => ['confirmed', 'offer', 'negotiating'].includes(d.status) && d.show_date)

  let routingContext = ''
  if (contact.state || contact.region) {
    const nearby = confirmedShows.find(d => {
      const pts = d.deal_points as Record<string, string> | null
      return pts?.state === contact.state || pts?.region === contact.region
    })
    if (nearby) {
      const pts = nearby.deal_points as Record<string, string> | null
      const nearbyArtist = pts?.artistSlug ?? 'the artist'
      routingContext = `ROUTING OPPORTUNITY: We already have a confirmed show in ${pts?.city ?? nearby.title} on ${nearby.show_date}. Mention that ${contact.city ?? 'their market'} would route perfectly — artist is already traveling to the region. This makes it easier and cheaper for both sides.`
    }
  }

  // ── Build prompt ─────────────────────────────────────────────────────────
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

  const contextBlock = [relationshipContext, routingContext].filter(Boolean).join('\n\n')

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 800,
    system: `You are X, an AI artist manager for DirtySnatcha Records (DSR).
Write outbound booking pitch emails on behalf of manager Thomas Nalian.
Tone: direct, confident, industry-savvy. Short and punchy — no filler.
Never use "I hope this email finds you well." Get to the point in the first sentence.
If there is relationship history, open with a natural reference to it — not sycophantic, just real.
If there is a routing opportunity, mention it specifically — it's a genuine selling point.`,
    messages: [{
      role: 'user',
      content: `Write a booking pitch email to ${contactInfo} for ${artist.name}.

${artistContext}

Target market: ${contact.city ?? contact.region ?? 'their market'}
Promoter type: ${contact.market_type ?? 'venue/promoter'}
${contextBlock ? `\n${contextBlock}` : ''}

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

  await supabase
    .from('contacts')
    .update({ pitch_status: 'drafted', last_pitched_at: new Date().toISOString() })
    .eq('id', contactId)

  const { data: deal } = await supabase
    .from('deals')
    .insert({
      title: `${artist.name} @ ${contact.company ?? contact.name} — ${contact.city ?? ''}`,
      artist_id: '',
      status: 'inquiry',
      gmail_draft_id: draft.id ?? null,
      notes: `Outbound pitch — ${artist.name}\n${isWarm ? '(warm contact)' : '(cold outreach)'}\n\n${body}`,
      deal_points: {
        artistSlug,
        contactId,
        pitchType: 'outbound',
        isWarm,
        hasRouting: !!routingContext,
      },
      created_by: user.id,
    })
    .select('id')
    .single()

  return NextResponse.json({
    draft: { id: draft.id, subject, to: contact.email, body },
    dealId: deal?.id ?? null,
    contact: { ...contact, pitch_status: 'drafted' },
    meta: { isWarm, hadRelationshipContext: !!relationshipContext, hadRoutingContext: !!routingContext },
  })
}
