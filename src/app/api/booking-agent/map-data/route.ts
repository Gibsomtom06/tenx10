import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'
import { getCityCoords } from '@/lib/geo/us-cities'

export interface PlatformScores {
  spotify: number   // 1–10 estimated audience density
  meta: number
  tiktok: number
  apple: number
  pandora: number
  youtube: number
  web: number
}

export interface MarketHistory {
  dealId: string
  date: string
  venue: string
  promoter: string | null
  amount: number | null
  status: string
}

export interface ContactPin {
  id: string
  name: string
  company: string | null
  relationship: string | null
}

export interface MapMarket {
  city: string
  state: string
  lat: number
  lng: number
  // Tour history
  showCount: number
  lastShow: MarketHistory | null
  allShows: MarketHistory[]
  // Current pipeline status
  pipelineStatus: 'confirmed' | 'active' | 'opportunity' | 'contact_only' | null
  opportunitySource?: 'routing' | 'warm' | 'market'
  // Contacts in this market
  contacts: ContactPin[]
  // Platform audience intelligence
  platform: PlatformScores
}

export interface MapDataResponse {
  markets: MapMarket[]
  generatedAt: string
}

type AIPlatformData = Record<string, PlatformScores>

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch all data in parallel
  const [
    { data: rawDeals },
    { data: rawContacts },
  ] = await Promise.all([
    supabase.from('deals').select('*').neq('status', 'cancelled'),
    supabase.from('contacts').select('id, name, company, city, state, pitch_status'),
  ])

  const deals = rawDeals ?? []
  const contacts = rawContacts ?? []

  // Build per-city market data from deals
  type CityKey = string
  const cityMap = new Map<CityKey, {
    city: string
    state: string
    shows: MarketHistory[]
    pipelineStatus: MapMarket['pipelineStatus']
  }>()

  for (const deal of deals) {
    const pts = deal.deal_points as Record<string, string | number> | null
    const city = (pts?.city as string | undefined) ?? deal.title?.split('@')?.[1]?.trim() ?? ''
    const state = (pts?.state as string | undefined) ?? ''
    if (!city) continue

    const key = `${city.toLowerCase()}|${state.toLowerCase()}`
    if (!cityMap.has(key)) {
      cityMap.set(key, { city, state, shows: [], pipelineStatus: null })
    }
    const entry = cityMap.get(key)!

    const history: MarketHistory = {
      dealId: deal.id,
      date: deal.show_date ?? '',
      venue: (pts?.venue as string | undefined) ?? '',
      promoter: (pts?.promoterName as string | undefined) ?? (pts?.promoter as string | undefined) ?? null,
      amount: deal.offer_amount ?? null,
      status: deal.status,
    }
    entry.shows.push(history)

    // Track highest pipeline status
    if (deal.status === 'confirmed' || deal.status === 'completed') {
      entry.pipelineStatus = 'confirmed'
    } else if (['offer', 'negotiating'].includes(deal.status) && entry.pipelineStatus !== 'confirmed') {
      entry.pipelineStatus = 'active'
    }
  }

  // Build per-city contact index
  const contactsByCity = new Map<CityKey, ContactPin[]>()
  for (const c of contacts) {
    if (!c.city) continue
    const key = `${c.city.toLowerCase()}|${(c.state ?? '').toLowerCase()}`
    if (!contactsByCity.has(key)) contactsByCity.set(key, [])
    contactsByCity.get(key)!.push({
      id: c.id,
      name: c.name,
      company: c.company,
      relationship: c.pitch_status,
    })
  }

  // Merge cities from deals + contacts
  for (const c of contacts) {
    if (!c.city) continue
    const key = `${c.city.toLowerCase()}|${(c.state ?? '').toLowerCase()}`
    if (!cityMap.has(key)) {
      cityMap.set(key, { city: c.city, state: c.state ?? '', shows: [], pipelineStatus: 'contact_only' })
    }
  }

  // Resolve coordinates
  const resolvedMarkets: Array<{
    city: string; state: string; lat: number; lng: number
    shows: MarketHistory[]; pipelineStatus: MapMarket['pipelineStatus']
    contacts: ContactPin[]
  }> = []

  for (const [key, entry] of cityMap) {
    const coords = getCityCoords(entry.city, entry.state)
    if (!coords) continue
    const [, stateKey] = key.split('|')
    resolvedMarkets.push({
      city: entry.city,
      state: entry.state || stateKey,
      lat: coords.lat,
      lng: coords.lng,
      shows: entry.shows,
      pipelineStatus: entry.pipelineStatus,
      contacts: contactsByCity.get(key) ?? [],
    })
  }

  // Generate AI platform intelligence for all cities
  const cityListForAI = resolvedMarkets
    .slice(0, 60)
    .map(m => `${m.city}, ${m.state}`)
    .join(' | ')

  let platformData: AIPlatformData = {}

  try {
    const aiResponse = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `You are a music industry data analyst specializing in dubstep, riddim, and bass music markets.

For each US city below, estimate the relative audience density score (1-10) for DirtySnatcha (dubstep/riddim artist, ~8-9K Spotify monthly listeners, Lost Lands performer, 4.5K Spotify followers, 11K Instagram) across these platforms:
- spotify: Spotify listener density for dubstep/bass music in this market
- meta: Facebook/Instagram engagement density for bass music / festival culture
- tiktok: TikTok creator & fan density for bass music content
- apple: Apple Music listener density for dubstep/electronic
- pandora: Pandora listener density (stronger in midwest/south suburban markets)
- youtube: YouTube content consumption for dubstep/bass music
- web: Electronic music fan web traffic / blog readership density

Score 1-10 where 10 = extremely dense market (e.g., festival hubs, college towns with bass culture, major metro areas with thriving club scenes).

Cities: ${cityListForAI}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "City, ST": { "spotify": 7, "meta": 6, "tiktok": 5, "apple": 7, "pandora": 4, "youtube": 6, "web": 7 },
  ...
}`,
      }],
    })

    const raw = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text.trim() : '{}'
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    platformData = JSON.parse(cleaned) as AIPlatformData
  } catch {
    // Fall through with empty platform data — not fatal
  }

  // Assemble final markets
  const markets: MapMarket[] = resolvedMarkets.map(m => {
    const aiKey = `${m.city}, ${m.state}`
    const platform: PlatformScores = platformData[aiKey] ?? {
      spotify: 5, meta: 5, tiktok: 5, apple: 5, pandora: 5, youtube: 5, web: 5,
    }

    const sortedShows = [...m.shows].sort((a, b) =>
      (b.date ?? '').localeCompare(a.date ?? '')
    )

    return {
      city: m.city,
      state: m.state,
      lat: m.lat,
      lng: m.lng,
      showCount: m.shows.length,
      lastShow: sortedShows[0] ?? null,
      allShows: sortedShows,
      pipelineStatus: m.pipelineStatus,
      contacts: m.contacts,
      platform,
    }
  })

  return NextResponse.json({ markets, generatedAt: new Date().toISOString() } satisfies MapDataResponse)
}
