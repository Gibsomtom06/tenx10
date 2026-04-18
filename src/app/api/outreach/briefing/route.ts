import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'
import { PITCH_ARTISTS } from '@/lib/outreach/artist-profiles'

export interface BriefingStop {
  city: string
  state: string
  suggestedDate: string
  drivingNote: string
  suggestedArtistSlug: string
  suggestedArtistName: string
  promoters: {
    name: string
    company: string | null
    why: string
    email: string | null
    contactId: string | null
    inContacts: boolean
  }[]
}

export interface BriefingWindow {
  id: string
  label: string
  anchorCity: string
  anchorState: string
  anchorDate: string
  anchorArtist: string
  windowRange: string
  stops: BriefingStop[]
}

export interface WarmAlert {
  contactId: string
  contactName: string
  company: string | null
  city: string | null
  email: string | null
  alertMessage: string
  pitchAngle: string
  suggestedArtistSlug: string
  suggestedArtistName: string
}

export interface NewMarket {
  city: string
  state: string
  reason: string
  suggestedArtistSlug: string
  suggestedArtistName: string
  promoters: {
    name: string
    why: string
    email: string | null
    contactId: string | null
    inContacts: boolean
  }[]
}

export interface OutreachBriefing {
  summary: string
  priority: string
  generatedAt: string
  routingWindows: BriefingWindow[]
  warmAlerts: WarmAlert[]
  newMarkets: NewMarket[]
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch all data in parallel
  const [
    { data: deals },
    { data: contacts },
  ] = await Promise.all([
    supabase.from('deals').select('*').neq('status', 'cancelled'),
    supabase.from('contacts').select('*').order('region'),
  ])

  const allDeals = deals ?? []
  const allContacts = contacts ?? []

  // Build contact lookup map (name → id)
  const contactByName: Record<string, string> = {}
  const contactByCity: Record<string, string[]> = {}
  for (const c of allContacts) {
    if (c.name) contactByName[c.name.toLowerCase()] = c.id
    if (c.city) {
      const key = c.city.toLowerCase()
      contactByCity[key] = contactByCity[key] ?? []
      contactByCity[key].push(c.id)
    }
  }

  // Confirmed/active tour dates
  const tourDates = allDeals
    .filter(d => ['confirmed', 'offer', 'negotiating'].includes(d.status) && d.show_date)
    .map(d => {
      const pts = d.deal_points as Record<string, string> | null
      return {
        date: d.show_date as string,
        city: pts?.city ?? '',
        state: pts?.state ?? '',
        region: pts?.region ?? '',
        artistSlug: pts?.artistSlug ?? 'dirtysnatcha',
        dealId: d.id,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  // Past pitch history per contact
  const pitchHistory: Record<string, string[]> = {}
  for (const deal of allDeals) {
    const pts = deal.deal_points as Record<string, string> | null
    if (!pts?.contactId || !pts?.artistSlug) continue
    pitchHistory[pts.contactId] = pitchHistory[pts.contactId] ?? []
    if (!pitchHistory[pts.contactId].includes(pts.artistSlug)) {
      pitchHistory[pts.contactId].push(pts.artistSlug)
    }
  }

  // Artist roster summary
  const rosterSummary = Object.values(PITCH_ARTISTS).map(a =>
    `- ${a.name} (${a.slug}): ${a.genre}, ${a.guarantee}, ${a.metrics}`
  ).join('\n')

  // Contact database summary (top contacts)
  const contactSummary = allContacts.slice(0, 40).map(c =>
    `- id:${c.id} | ${c.name}${c.company ? ` (${c.company})` : ''} | ${c.city ?? ''}${c.state ? `, ${c.state}` : ''} | ${c.market_type ?? ''} | ${c.region ?? ''}`
  ).join('\n')

  const tourSummary = tourDates.length > 0
    ? tourDates.map(t => `- ${t.date}: ${t.city}, ${t.state} [${t.artistSlug}]`).join('\n')
    : 'No confirmed shows yet'

  const pitchSummary = Object.entries(pitchHistory).length > 0
    ? Object.entries(pitchHistory).map(([cid, slugs]) => {
        const c = allContacts.find(x => x.id === cid)
        return `- ${c?.name ?? cid}: pitched [${slugs.join(', ')}]`
      }).join('\n')
    : 'No past pitches yet'

  const today = new Date().toISOString().split('T')[0]

  const prompt = `You are a tour booking strategist for DirtySnatcha Records (DSR), a dubstep/bass music label based in Detroit, MI. Today is ${today}.

ARTIST ROSTER:
${rosterSummary}

CONFIRMED TOUR DATES:
${tourSummary}

PROMOTER CONTACTS IN DATABASE:
${contactSummary}

PAST PITCH HISTORY:
${pitchSummary}

Generate a complete outreach briefing. Think strategically:

1. ROUTING WINDOWS: For each confirmed show, identify 3-4 cities within driving range (1-6 hours) that would make sense as additional stops in the same trip. Consider the dates — suggest realistic show dates that fit the travel window. For each stop, recommend specific promoters (use ones from the database when possible — match by city/region). Prioritize shows that create a logical geographic loop or straight-line route.

2. WARM ALERTS: Identify contacts in the database that have past pitch history and should be re-engaged. Especially: contacts pitched only for DirtySnatcha who could be pitched for other roster artists. Include multi-city/multi-venue promoters who might have other opportunities.

3. NEW MARKETS: If no shows in certain high-value bass music cities (Seattle, Portland, Atlanta, Miami, Nashville, Minneapolis, etc.), flag them as opportunities. Match against known contacts in the database.

If there are no confirmed tour dates yet, generate a "First Shows" briefing: suggest the 5 best starter markets for DirtySnatcha based on genre and typical bass music markets, with specific contacts from the database.

Respond with ONLY valid JSON (no markdown, no explanation). Use this exact structure:
{
  "summary": "brief one-line summary of the briefing (e.g. '2 routing windows · 3 warm alerts · 4 new markets')",
  "priority": "one sentence on the highest-priority action to take today",
  "routingWindows": [
    {
      "id": "window_1",
      "label": "string e.g. 'April Southwest Run'",
      "anchorCity": "string",
      "anchorState": "string",
      "anchorDate": "YYYY-MM-DD",
      "anchorArtist": "string (display name)",
      "windowRange": "string e.g. 'Apr 1–7'",
      "stops": [
        {
          "city": "string",
          "state": "string",
          "suggestedDate": "string e.g. 'April 1'",
          "drivingNote": "string e.g. '4h from Las Vegas'",
          "suggestedArtistSlug": "string (one of: dirtysnatcha, hvrcrft, dark-matter, kotrax, dsr-takeover)",
          "suggestedArtistName": "string",
          "promoters": [
            {
              "name": "string",
              "company": "string or null",
              "why": "string (one sentence)",
              "email": "string or null",
              "contactId": "string or null (use id from database if match found)",
              "inContacts": true
            }
          ]
        }
      ]
    }
  ],
  "warmAlerts": [
    {
      "contactId": "string (use id from database)",
      "contactName": "string",
      "company": "string or null",
      "city": "string or null",
      "email": "string or null",
      "alertMessage": "string (why this contact is worth re-engaging right now)",
      "pitchAngle": "string (exactly what to say/angle to use)",
      "suggestedArtistSlug": "string",
      "suggestedArtistName": "string"
    }
  ],
  "newMarkets": [
    {
      "city": "string",
      "state": "string",
      "reason": "string (why this market, listener data, genre fit)",
      "suggestedArtistSlug": "string",
      "suggestedArtistName": "string",
      "promoters": [
        {
          "name": "string",
          "why": "string",
          "email": "string or null",
          "contactId": "string or null",
          "inContacts": false
        }
      ]
    }
  ]
}`

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'

  let briefing: OutreachBriefing
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    // Post-process: resolve contactIds for any promoters Claude couldn't match
    const resolveContact = (name: string, city: string) => {
      const nameKey = name.toLowerCase()
      const cityKey = city?.toLowerCase()
      if (contactByName[nameKey]) return contactByName[nameKey]
      if (cityKey) {
        const cityContacts = contactByCity[cityKey] ?? []
        if (cityContacts.length === 1) return cityContacts[0]
      }
      return null
    }

    for (const w of parsed.routingWindows ?? []) {
      for (const s of w.stops ?? []) {
        for (const p of s.promoters ?? []) {
          if (!p.contactId) {
            const resolved = resolveContact(p.name, s.city)
            if (resolved) { p.contactId = resolved; p.inContacts = true }
          }
        }
      }
    }

    for (const m of parsed.newMarkets ?? []) {
      for (const p of m.promoters ?? []) {
        if (!p.contactId) {
          const resolved = resolveContact(p.name, m.city)
          if (resolved) { p.contactId = resolved; p.inContacts = true }
        }
      }
    }

    briefing = { ...parsed, generatedAt: new Date().toISOString() }
  } catch {
    briefing = {
      summary: 'Briefing generation failed — check API logs',
      priority: 'Retry generating the briefing',
      generatedAt: new Date().toISOString(),
      routingWindows: [],
      warmAlerts: [],
      newMarkets: [],
    }
  }

  return NextResponse.json(briefing)
}
