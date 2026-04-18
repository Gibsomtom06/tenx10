import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'

export interface MetaAdsBrief {
  campaignName: string
  objective: string
  pixel: string
  totalBudget: number
  phases: {
    name: string
    timing: string
    budget: number
    audiences: string[]
    adFormat: string
    creativeDirection: string
    cta: string
    kpi: string
    kpiTarget: string
  }[]
  adSets: {
    name: string
    type: 'retargeting' | 'cold'
    targeting: {
      location: string
      radius: string
      ageMin: number
      ageMax: number
      interests?: string[]
      customAudiences?: string[]
    }
    budgetShare: string
    placements: string[]
  }[]
  creativeFormats: {
    format: string
    hook: string
    headline: string
    body: string
    cta: string
    notes: string
  }[]
  trackingSetup: {
    pixel: string
    standardEvents: string[]
    customConversions: string[]
    utmParams: string
  }
  killThreshold: string
  targetCPT: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dealId } = await request.json() as { dealId: string }

  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single()

  if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

  const pts = deal.deal_points as Record<string, string | boolean | number> | null
  const city = (pts?.city as string) ?? deal.title
  const state = (pts?.state as string) ?? ''
  const venue = (pts?.venue as string) ?? 'TBD'
  const showDate = deal.show_date ?? 'TBD'
  const offerAmount = deal.offer_amount ?? 0
  const support = (pts?.support as string) ?? ''

  const showDateFormatted = showDate !== 'TBD'
    ? new Date(showDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    : 'TBD'

  const daysUntil = showDate !== 'TBD'
    ? Math.floor((new Date(showDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 30

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: `You are X, Meta Ads strategist for DirtySnatcha Records.
You generate precise, actionable Meta Ads campaign briefs for shows.

DSR Artist: DirtySnatcha (Lee Bray) — dubstep, riddim, bass music, trap
Meta Pixel: 701854965266742
Meta Ad Accounts: 810543424275407 / 461019786273565
Current fanbase: ~8-9K monthly listeners, ~11K Instagram

CRITICAL RULES:
- CPT (cost per ticket) target: under $5. Kill threshold: $8+
- Affinity targeting > genre interest targeting
- Scratch/curiosity-hook creative outperforms event announcement creative
- Campaign type tag: [SHOW]
- 4-phase system: Announcement → On-Sale → Maintenance → Final Push
- Budget: allocate more to retargeting (lower CPT)
- Always include retargeting ad sets (page engagers, website visitors)

Respond ONLY with valid JSON matching the MetaAdsBrief structure. No markdown, no commentary.`,
    messages: [{
      role: 'user',
      content: `Generate a full Meta Ads campaign brief for this show:

Artist: DirtySnatcha
Venue: ${venue}
City: ${city}${state ? `, ${state}` : ''}
Date: ${showDateFormatted}
Days Until Show: ${daysUntil}
Guarantee: $${offerAmount.toLocaleString()}
Support Acts: ${support || 'None announced'}

Generate the complete brief as JSON with:
- campaignName (use [SHOW] format)
- objective
- pixel (use the DSR pixel)
- totalBudget (recommend based on market and days out)
- phases (4 phases, each with name, timing, budget, audiences, adFormat, creativeDirection, cta, kpi, kpiTarget)
- adSets (2-3 ad sets: at least 1 retargeting, 1-2 cold. Include location 50mi radius of ${city})
- creativeFormats (3 ad creative concepts with hook, headline, body, cta, notes)
- trackingSetup (pixel, standardEvents, customConversions, utmParams)
- killThreshold ("Pause if CPT exceeds $8")
- targetCPT ("Under $5 per ticket sold")`,
    }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
  let brief: MetaAdsBrief
  try {
    const jsonStart = raw.indexOf('{')
    const jsonEnd = raw.lastIndexOf('}')
    brief = JSON.parse(raw.slice(jsonStart, jsonEnd + 1))
  } catch {
    return NextResponse.json({ error: 'Failed to parse campaign brief' }, { status: 500 })
  }

  return NextResponse.json({ brief, showInfo: { city, state, venue, showDate: showDateFormatted, daysUntil } })
}
