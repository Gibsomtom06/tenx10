import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseBookingOffer } from '@/lib/gmail/parse-offer'
import { runDecisionEngine } from '@/lib/gmail/decision-engine'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { offerText } = await request.json()
  if (!offerText?.trim()) return NextResponse.json({ error: 'offerText required' }, { status: 400 })

  const { data: artists } = await supabase
    .from('artists')
    .select('id, name')
    .eq('manager_id', user.id)
    .eq('status', 'active')
    .limit(1)

  const artist = artists?.[0]
  const artistContext = {
    name: artist?.name ?? 'DirtySnatcha',
    minimumGuarantee: 1500,
    homeCity: 'Detroit',
    existingDates: [] as string[],
  }

  if (artist?.id) {
    const { data: existing } = await supabase
      .from('deals')
      .select('show_date')
      .eq('artist_id', artist.id)
      .not('show_date', 'is', null)
      .in('status', ['offer', 'negotiating', 'confirmed'])
    artistContext.existingDates = existing?.map(d => d.show_date!).filter(Boolean) ?? []
  }

  const parsedOffer = await parseBookingOffer('', offerText)
  const decision = runDecisionEngine(parsedOffer, artistContext)

  const counterBlock = decision.counter
    ? `\n\nCounter terms:\n- Guarantee: $${decision.counter.guarantee.toLocaleString()}\n- ${decision.counter.radiusClause}\n- ${decision.counter.paymentTerms}${decision.counter.hotelBuyout ? `\n- ${decision.counter.hotelBuyout}` : ''}`
    : ''

  const stepsText = decision.steps
    .map(s => `${s.step}. ${s.name}: ${s.pass === true ? 'PASS' : s.pass === false ? 'FAIL' : 'DATA NEEDED'} — ${s.detail}`)
    .join('\n')

  const emailResponse = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: `You are X, AI artist manager for TENx10 representing ${artistContext.name}.
Write professional, direct booking response emails. No filler. No corporate speak.
Single point of contact is Thomas Nalian (Manager).`,
    messages: [{
      role: 'user',
      content: `Write a ${decision.recommendation === 'accept' ? 'acceptance' : decision.recommendation === 'counter' ? 'counter-offer' : 'decline'} response to this booking offer.

OFFER TEXT:
${offerText.slice(0, 2000)}

DECISION:
Recommendation: ${decision.recommendation.toUpperCase()}
Reasoning: ${decision.reasoning}

Steps:
${stepsText}${counterBlock}

Write the email body only. Sign as: Thomas Nalian, Manager | DirtySnatcha Records | thomas@dirtysnatcha.com / 248-765-1997`,
    }],
  })

  const emailDraft = emailResponse.content[0].type === 'text' ? emailResponse.content[0].text : ''

  return NextResponse.json({ parsedOffer, decision, emailDraft })
}
