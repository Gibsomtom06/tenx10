import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'
import { PITCH_ARTISTS, type PitchArtistSlug } from '@/lib/outreach/artist-profiles'

export interface MarketEstimate {
  artistName: string
  city: string
  state: string
  venueCapacity: number | null
  ticketRange: { low: number; high: number }
  fillRate: string
  recommendedGuarantee: { low: number; high: number }
  cptProjection: number
  adSpendNeeded: number
  riskRating: 'low' | 'medium' | 'high'
  riskFactors: string[]
  upsideFactors: string[]
  pitchAnchor: string
  marketTier: 'primary' | 'secondary' | 'tertiary'
  reasoning: string
}

const MARKET_TIERS: Record<string, 'primary' | 'secondary' | 'tertiary'> = {
  'new york': 'primary', 'los angeles': 'primary', 'chicago': 'primary',
  'miami': 'primary', 'san francisco': 'primary', 'las vegas': 'primary',
  'seattle': 'secondary', 'portland': 'secondary', 'denver': 'secondary',
  'atlanta': 'secondary', 'dallas': 'secondary', 'houston': 'secondary',
  'austin': 'secondary', 'nashville': 'secondary', 'phoenix': 'secondary',
  'san diego': 'secondary', 'minneapolis': 'secondary', 'detroit': 'secondary',
}

function getMarketTier(city: string): 'primary' | 'secondary' | 'tertiary' {
  const lower = city.toLowerCase()
  return MARKET_TIERS[lower] ?? 'tertiary'
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { artistSlug, city, state, venueCapacity } = await request.json() as {
    artistSlug: PitchArtistSlug
    city: string
    state: string
    venueCapacity?: number
  }

  const artist = PITCH_ARTISTS[artistSlug]
  if (!artist) return NextResponse.json({ error: 'Unknown artist' }, { status: 400 })
  if (!city || !state) return NextResponse.json({ error: 'City and state required' }, { status: 400 })

  // Pull historical shows from this artist to inform estimate
  const { data: deals } = await supabase
    .from('deals')
    .select('offer_amount, deal_points, show_date, status')
    .in('status', ['confirmed', 'completed'])

  const historicalShows = (deals ?? []).map(d => {
    const pts = d.deal_points as Record<string, string | number> | null
    return {
      city: pts?.city as string | null,
      state: pts?.state as string | null,
      guarantee: d.offer_amount,
      capacity: pts?.capacity as number | null,
    }
  }).filter(s => s.city || s.guarantee)

  const marketTier = getMarketTier(city)

  const systemPrompt = `You are X, an AI booking intelligence system for DirtySnatcha Records.
Your job is to estimate projected ticket sales and recommend a guarantee pitch strategy for a given artist in a given market.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.`

  const userPrompt = `Estimate ticket sales and pitch strategy for:

ARTIST: ${artist.name}
GENRE: ${artist.genre}
ARTIST METRICS: ${artist.metrics}
${artist.topTracks ? `TOP TRACKS: ${artist.topTracks}` : ''}
${artist.tourHistory ? `TOUR HISTORY: ${artist.tourHistory}` : ''}
CURRENT GUARANTEE RANGE: ${artist.guarantee}

TARGET MARKET:
City: ${city}, ${state}
Market tier: ${marketTier}
${venueCapacity ? `Venue capacity: ${venueCapacity}` : 'Venue capacity: unknown — assume 250-400 for club shows'}

HISTORICAL DSR SHOW DATA (${historicalShows.length} shows):
${historicalShows.length > 0
  ? historicalShows.slice(0, 10).map(s =>
      `- ${s.city ?? 'unknown'}, ${s.state ?? ''}: $${s.guarantee ?? 'unknown'} guarantee${s.capacity ? `, ${s.capacity} cap` : ''}`
    ).join('\n')
  : '- No historical show data yet'
}

DSR BOOKING RULES:
- Floor guarantee: $1,500 minimum
- Target CPT (cost per ticket from ads): under $5
- Kill threshold CPT: $8+
- Genre multiplier: Dubstep/Bass music has strong subculture in club markets — fans seek out shows actively
- Development-tier artist (8-9K monthly listeners) typically drives 30-50% fill rate at properly-sized venue
- Primary markets can support 200-400 cap venues; secondary 150-300; tertiary 100-200
- Ad spend typical for a club show: $300-800 depending on market
- Doors typically $15-25 for this artist tier

Respond with this exact JSON structure:
{
  "ticketRange": { "low": <number>, "high": <number> },
  "fillRate": "<string, e.g. '40-65%'>",
  "recommendedGuarantee": { "low": <number>, "high": <number> },
  "cptProjection": <number, estimated cost per ticket>,
  "adSpendNeeded": <number, estimated ad budget>,
  "riskRating": "<'low' | 'medium' | 'high'>",
  "riskFactors": ["<string>", ...],
  "upsideFactors": ["<string>", ...],
  "pitchAnchor": "<one-sentence summary of what to pitch — e.g. 'Pitch at $2,000 — artist can drive 150-200 people in this market'>",
  "reasoning": "<2-3 sentences explaining the estimate logic>"
}`

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'

  let parsed: Omit<MarketEstimate, 'artistName' | 'city' | 'state' | 'venueCapacity' | 'marketTier'>
  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw }, { status: 500 })
  }

  const result: MarketEstimate = {
    artistName: artist.name,
    city,
    state,
    venueCapacity: venueCapacity ?? null,
    marketTier,
    ...parsed,
  }

  return NextResponse.json(result)
}
