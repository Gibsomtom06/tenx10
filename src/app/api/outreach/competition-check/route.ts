import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'

export interface CompetitionCheck {
  city: string
  state: string
  showDate: string | null
  riskLevel: 'low' | 'medium' | 'high'
  festivals: {
    name: string
    dates: string
    distance: string
    impact: string
    size: 'major' | 'regional' | 'local'
  }[]
  competingShows: {
    type: string
    description: string
    impact: string
  }[]
  pitchTiming: {
    bestDays: string[]
    bestMonths: string[]
    leadTime: string
    reasoning: string
  }
  recommendation: string
  pitchTo: {
    priority: 'primary' | 'secondary' | 'tertiary'
    contactType: string
    why: string
    notes: string
  }[]
}

// Known major EDM/bass music festivals by month and region
const MAJOR_FESTIVALS = `
JANUARY: No major bass festivals
FEBRUARY: No major bass festivals
MARCH: Ultra Music Festival (Miami, FL - mid March), SXSW (Austin, TX - mid March)
APRIL: Coachella (Indio, CA - weekends 1 & 2), Forbidden Kingdom (Orlando, FL - April)
MAY: Bass Canyon PNW (Pacific Northwest), Electric Forest tickets on sale, Shambhala tickets on sale
JUNE: Electric Daisy Carnival EDC Las Vegas (Las Vegas, NV - June), Summer Smash (Chicago)
JULY: July 4th weekend - major competing shows everywhere
AUGUST: Lollapalooza (Chicago, IL), Bass Canyon (Quincy, WA - August), Shambhala (BC Canada)
SEPTEMBER: Lost Lands (Thornville, OH - late September), Global Dance (Denver, CO), Elements (PA)
OCTOBER: Freaky Deaky (Texas), Escape Halloween (SoCal), Voodoo Fest (New Orleans)
NOVEMBER: Thanksgiving weekend - poor for shows, low attendance
DECEMBER: Holiday season - club shows peak but festivals down
`

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { city, state, showDate, marketType = 'club' } = await request.json() as {
    city: string
    state: string
    showDate?: string
    marketType?: string
  }

  const { data: contacts } = await supabase.from('contacts').select('name, company, city, state, market_type, pitch_status').limit(50)

  const regionContacts = (contacts ?? []).filter(c =>
    c.state === state || c.city?.toLowerCase().includes(city.toLowerCase())
  )

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1000,
    system: `You are an expert EDM/bass music booking intelligence analyst.
You know the electronic music festival calendar, regional touring patterns, and booking best practices.
Respond with valid JSON only.`,
    messages: [{
      role: 'user',
      content: `Competition and pitch intelligence for a DirtySnatcha show booking:

MARKET: ${city}, ${state}
TARGET DATE: ${showDate ?? 'flexible'}
SHOW TYPE: ${marketType}
ARTIST: DirtySnatcha (dubstep/riddim/bass music, 8-9K Spotify listeners, development-tier)

KNOWN MAJOR FESTIVALS BY MONTH:
${MAJOR_FESTIVALS}

CONTACTS WE HAVE IN THIS AREA:
${regionContacts.length > 0
  ? regionContacts.map(c => `- ${c.name} (${c.company ?? 'independent'}, ${c.market_type ?? 'venue'}) — status: ${c.pitch_status ?? 'not contacted'}`).join('\n')
  : 'No contacts yet in this area'
}

Analyze:
1. Are there major festivals or events in this region around ${showDate ?? 'any time'} that would pull bass music fans away from a club show?
2. What are the competition risks for a development-tier bass music artist in this market?
3. Best timing to pitch this market (days of week, months of year, lead time)?
4. Who specifically should we pitch first in this market?

Respond with this JSON:
{
  "riskLevel": "<low|medium|high>",
  "festivals": [
    {
      "name": "<festival name>",
      "dates": "<month/dates>",
      "distance": "<miles from target city>",
      "impact": "<how it affects our show>",
      "size": "<major|regional|local>"
    }
  ],
  "competingShows": [
    {
      "type": "<e.g. 'Headliner market saturation'>",
      "description": "<what the risk is>",
      "impact": "<low|medium|high — and why>"
    }
  ],
  "pitchTiming": {
    "bestDays": ["<e.g. Tuesday>", "<Wednesday>"],
    "bestMonths": ["<e.g. January for spring shows>"],
    "leadTime": "<e.g. 8-12 weeks before show date>",
    "reasoning": "<why this timing>"
  },
  "recommendation": "<1-2 sentences on whether to pursue this market and when>",
  "pitchTo": [
    {
      "priority": "<primary|secondary|tertiary>",
      "contactType": "<e.g. 'Local club promoter'>",
      "why": "<why this is the best first contact>",
      "notes": "<any specific intel on this contact type in this market>"
    }
  ]
}`,
    }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'

  let parsed: Omit<CompetitionCheck, 'city' | 'state' | 'showDate'>
  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Parse failed', raw }, { status: 500 })
  }

  return NextResponse.json({
    city,
    state,
    showDate: showDate ?? null,
    ...parsed,
  } satisfies CompetitionCheck)
}
