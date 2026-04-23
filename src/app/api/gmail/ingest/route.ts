/**
 * POST /api/gmail/ingest
 * Scans Gmail for booking offer emails, parses them with Claude AI,
 * and creates deal cards in `pending_review` status.
 *
 * Designed to be called:
 * - Manually from the dashboard "Scan Inbox" button
 * - On a schedule (future Vercel Cron)
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGmailClient } from '@/lib/gmail/oauth'
import { parseBookingOffer, extractEmailText, extractEmailHeader } from '@/lib/gmail/parse-offer'

const OFFER_KEYWORDS = ['offer', 'booking', 'guarantee', 'venue', 'performance date', 'date inquiry', 'show offer', 'festival offer']

function isBookingOffer(subject: string, snippet: string): boolean {
  const text = `${subject} ${snippet}`.toLowerCase()
  return OFFER_KEYWORDS.some(kw => text.includes(kw))
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Load Gmail connection
  const { data: conn } = await supabase
    .from('gmail_connections')
    .select('access_token, refresh_token')
    .eq('user_id', user.id)
    .single()

  if (!conn) return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 })

  // Load managed artists for this user (to match offer to artist)
  const { data: memberships } = await supabase
    .from('artist_members')
    .select('artist_id, artists(id, name, stage_name)')
    .or(`user_id.eq.${user.id},email.eq.${user.email ?? ''}`)

  const artistList = (memberships ?? [])
    .filter((m: any) => m.artists)
    .map((m: any) => ({
      id: m.artist_id,
      name: ((m.artists as any).stage_name ?? (m.artists as any).name ?? '') as string,
    }))

  const gmail = getGmailClient(conn.access_token, conn.refresh_token ?? undefined)

  // Fetch recent inbox messages
  const { data: list } = await gmail.users.messages.list({
    userId: 'me',
    q: 'label:inbox newer_than:14d',
    maxResults: 50,
  })

  if (!list.messages?.length) {
    return NextResponse.json({ ok: true, scanned: 0, created: 0, skipped: 0 })
  }

  // Get already-ingested source_email_ids to avoid duplicates
  const { data: existing } = await supabase
    .from('deals')
    .select('source_email_id')
    .not('source_email_id', 'is', null)

  const ingestedIds = new Set((existing ?? []).map((d: any) => d.source_email_id))

  let scanned = 0
  let created = 0
  let skipped = 0
  const results: any[] = []

  for (const { id } of list.messages) {
    if (!id || ingestedIds.has(id)) { skipped++; continue } // Already processed

    // Fetch full message
    const { data: msg } = await gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'full',
    })

    const headers = msg.payload?.headers ?? []
    const subject = extractEmailHeader(headers, 'Subject')
    const from = extractEmailHeader(headers, 'From')
    const snippet = msg.snippet ?? ''

    scanned++

    if (!isBookingOffer(subject, snippet)) { skipped++; continue }

    // Extract body text
    const bodyText = extractEmailText(msg.payload)
    if (!bodyText && !snippet) { skipped++; continue }

    // Parse with Claude
    let parsed
    try {
      parsed = await parseBookingOffer(subject, bodyText || snippet)
    } catch (err) {
      console.error(`Parse failed for message ${id}:`, err)
      skipped++
      continue
    }

    // Match artist — use parsed artistName or fall back to first managed artist
    let matchedArtistId = artistList[0]?.id ?? null
    if (parsed.artistName && artistList.length > 1) {
      const nameLower = parsed.artistName.toLowerCase()
      const match = artistList.find(a => a.name.toLowerCase().includes(nameLower) || nameLower.includes(a.name.toLowerCase()))
      if (match) matchedArtistId = match.id
    }

    if (!matchedArtistId) { skipped++; continue }

    // Build deal card
    const dealPoints: Record<string, any> = {
      city: parsed.venueCity ?? '',
      state: parsed.venueState ?? '',
      venue: parsed.venueName ?? '',
      capacity: parsed.venueCapacity ?? null,
      guarantee: parsed.guarantee ?? null,
      dealType: parsed.dealType ?? 'flat',
      backendPercent: parsed.backendPercent ?? null,
      promoterName: parsed.promoterName ?? '',
      promoterEmail: parsed.promoterEmail ?? '',
      promoterCompany: parsed.promoterCompany ?? '',
      marketingCommitment: parsed.marketingCommitment ?? null,
      depositAmount: parsed.depositAmount ?? null,
      source: 'gmail_ingest',
      rawFrom: from,
      rawSubject: subject,
      aiNotes: parsed.notes ?? '',
    }

    const { data: deal, error: dealErr } = await supabase
      .from('deals')
      .insert({
        artist_id: matchedArtistId,
        title: subject || `${parsed.venueName ?? 'Unknown Venue'} — ${parsed.venueCity ?? 'Unknown City'}`,
        status: 'inquiry',
        show_date: parsed.showDate ?? null,
        offer_amount: parsed.guarantee ?? null,
        deal_points: dealPoints,
        source_email_id: id,
      } as any)
      .select('id')
      .single()

    if (dealErr) {
      console.error('Insert failed:', dealErr)
      skipped++
      continue
    }

    created++
    results.push({
      dealId: deal.id,
      messageId: id,
      subject,
      city: parsed.venueCity,
      guarantee: parsed.guarantee,
    })
  }

  return NextResponse.json({ ok: true, scanned, created, skipped, results })
}
