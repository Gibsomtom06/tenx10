import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'
import { createGmailDraft } from '@/lib/gmail/drafts'

// Show offer → Gmail draft pipeline (priority feature)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dealId } = await request.json()

  // Fetch deal with relations
  const { data: deal, error } = await supabase
    .from('deals')
    .select('*, artists(*), venues(*), promoters(*)')
    .eq('id', dealId)
    .single()

  if (error || !deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

  // Fetch Gmail token
  const { data: gmailConn } = await supabase
    .from('gmail_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!gmailConn) return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 })

  // Generate draft with Claude
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: `You are X, an AI artist manager assistant for TENx10.
Write professional, concise email responses to show offers.
Tone: confident, warm, industry-savvy. Never use filler phrases.`,
    messages: [{
      role: 'user',
      content: `Write a response email to this show offer:
Artist: ${deal.artists?.name}
Venue: ${deal.venues?.name ?? 'TBD'}, ${deal.venues?.city ?? ''}
Date: ${deal.show_date ?? 'TBD'}
Offer: $${deal.offer_amount ?? 'TBD'}
Deal points: ${JSON.stringify(deal.deal_points)}
Notes: ${deal.notes ?? 'None'}
Promoter contact: ${deal.promoters?.email ?? 'unknown'}

Write the email body only (no subject line).`,
    }],
  })

  const emailBody = response.content[0].type === 'text' ? response.content[0].text : ''
  const subject = `Re: Show Offer - ${deal.artists?.name} @ ${deal.venues?.name ?? 'TBD'} - ${deal.show_date ?? 'TBD'}`

  const draft = await createGmailDraft({
    to: deal.promoters?.email ?? '',
    subject,
    body: emailBody,
    accessToken: gmailConn.access_token,
    refreshToken: gmailConn.refresh_token ?? undefined,
  })

  // Save draft ID to deal
  await supabase.from('deals').update({ gmail_draft_id: draft.id }).eq('id', dealId)

  return NextResponse.json({ draftId: draft.id, body: emailBody })
}
