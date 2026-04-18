import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGmailClient } from '@/lib/gmail/oauth'
import { parseBookingOffer, extractEmailText, extractEmailHeader } from '@/lib/gmail/parse-offer'
import { runDecisionEngine } from '@/lib/gmail/decision-engine'
import { createGmailDraft } from '@/lib/gmail/drafts'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'

// Full pipeline: Gmail message → parse → 6-step eval → counter draft → save → create deal
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messageId } = await request.json()
  if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 })

  // Fetch Gmail connection
  const { data: conn } = await supabase
    .from('gmail_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (!conn) return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 })

  // Fetch full Gmail message
  const gmail = getGmailClient(conn.access_token, conn.refresh_token ?? undefined)
  const { data: message } = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  })

  const headers = message.payload?.headers ?? []
  const subject = extractEmailHeader(headers, 'Subject')
  const fromHeader = extractEmailHeader(headers, 'From')
  const body = extractEmailText(message.payload)

  if (!body) return NextResponse.json({ error: 'Could not extract email body' }, { status: 422 })

  // Fetch artist context (primary artist for this user's label)
  const { data: artists } = await supabase
    .from('artists')
    .select('id, name, status')
    .eq('manager_id', user.id)
    .eq('status', 'active')
    .limit(1)

  const artist = artists?.[0]
  const artistContext = {
    name: artist?.name ?? 'DirtySnatcha',
    minimumGuarantee: 1500, // DSR floor from CLAUDE.md
    homeCity: 'Detroit',
    existingDates: [] as string[],
  }

  // Fetch existing show dates for conflict check
  if (artist) {
    const { data: existingDeals } = await supabase
      .from('deals')
      .select('show_date')
      .eq('artist_id', artist.id)
      .not('show_date', 'is', null)
      .in('status', ['offer', 'negotiating', 'confirmed'])
    artistContext.existingDates = existingDeals?.map(d => d.show_date!).filter(Boolean) ?? []
  }

  // Step 1: Parse the offer
  const parsedOffer = await parseBookingOffer(subject, body)

  // Step 2: Run 6-step decision engine
  const decision = runDecisionEngine(parsedOffer, artistContext)

  // Step 3: Generate email draft with Claude
  const counterPoints = decision.counter
    ? `\n\nCounter-offer terms to include:
- Guarantee: $${decision.counter.guarantee.toLocaleString()}
- ${decision.counter.radiusClause}
- Payment: ${decision.counter.paymentTerms}${decision.counter.hotelBuyout ? `\n- ${decision.counter.hotelBuyout}` : ''}`
    : ''

  const decisionSummary = decision.steps
    .map(s => `${s.step}. ${s.name}: ${s.pass === true ? 'PASS' : s.pass === false ? 'FAIL' : 'DATA NEEDED'} — ${s.detail}`)
    .join('\n')

  const emailResponse = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: `You are X, AI artist manager for TENx10 representing ${artistContext.name}.
Write professional, concise booking response emails. Confident and industry-savvy.
Never use filler phrases. Single point of contact is Thomas Nalian (manager).`,
    messages: [{
      role: 'user',
      content: `Write a ${decision.recommendation === 'accept' ? 'acceptance' : decision.recommendation === 'counter' ? 'counter-offer' : 'decline'} response to this booking offer.

ORIGINAL EMAIL:
Subject: ${subject}
From: ${fromHeader}
Body: ${body.slice(0, 2000)}

DECISION ENGINE OUTPUT:
Recommendation: ${decision.recommendation.toUpperCase()}
Reasoning: ${decision.reasoning}

Step results:
${decisionSummary}${counterPoints}

Write ONLY the email body (no subject line). Sign off as Thomas Nalian, Manager | DirtySnatcha Records.`,
    }],
  })

  const emailBody = emailResponse.content[0].type === 'text' ? emailResponse.content[0].text : ''
  const replyTo = parsedOffer.promoterEmail ?? fromHeader.match(/<(.+)>/)?.[1] ?? fromHeader
  const draftSubject = `Re: ${subject}`

  // Step 4: Save draft to Gmail
  const draft = await createGmailDraft({
    to: replyTo,
    subject: draftSubject,
    body: emailBody,
    accessToken: conn.access_token,
    refreshToken: conn.refresh_token ?? undefined,
  })

  // Step 5: Create deal record
  const dealPayload = {
    title: `${parsedOffer.venueName ?? 'Unknown Venue'} — ${parsedOffer.showDate ?? 'TBD'}`,
    artist_id: artist?.id ?? '',
    show_date: parsedOffer.showDate,
    offer_amount: parsedOffer.guarantee,
    status: 'offer' as const,
    source_email_id: messageId,
    gmail_draft_id: draft.id ?? null,
    notes: [
      parsedOffer.notes,
      `Decision: ${decision.recommendation.toUpperCase()} — ${decision.reasoning}`,
    ].filter(Boolean).join('\n\n'),
    deal_points: {
      venue: parsedOffer.venueName,
      city: parsedOffer.venueCity,
      state: parsedOffer.venueState,
      capacity: parsedOffer.venueCapacity,
      dealType: parsedOffer.dealType,
      backendPercent: parsedOffer.backendPercent,
      marketingCommitment: parsedOffer.marketingCommitment,
      promoter: parsedOffer.promoterName,
      promoterCompany: parsedOffer.promoterCompany,
    },
    created_by: user.id,
  }

  let dealId: string | null = null
  if (artist?.id) {
    const { data: deal } = await supabase
      .from('deals')
      .insert(dealPayload)
      .select('id')
      .single()
    dealId = deal?.id ?? null
  }

  return NextResponse.json({
    parsedOffer,
    decision,
    draft: { id: draft.id, subject: draftSubject, to: replyTo, body: emailBody },
    dealId,
  })
}
