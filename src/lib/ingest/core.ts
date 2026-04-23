/**
 * TENx10 Ingest Core
 * Platform-agnostic conversation engine for the 7-agent management team.
 * Called by: /api/ingest (web), /api/webhooks/discord, /api/webhooks/whatsapp,
 *            /api/webhooks/slack, /api/webhooks/sms, /api/webhooks/messenger
 */

import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// ----------------------------------------------------------------
// Re-export types (single source of truth)
// ----------------------------------------------------------------

export type IngestPhase = 'intro' | 'collect' | 'research' | 'questions' | 'brief'

export interface ArtistData {
  name?: string
  spotifyUrl?: string
  instagramHandle?: string
  tiktokHandle?: string
  websiteUrl?: string
  soundcloudUrl?: string
  youtubeUrl?: string
}

export interface IngestState {
  phase: IngestPhase
  artistData: ArtistData
  researchComplete: boolean
  researchSummary?: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface IngestInput {
  message: string
  history: Message[]
  state: IngestState
  sessionKey?: string   // platform:userId e.g. "discord:1234567890"
  managerId?: string    // auth user UUID — enables saving artist to DB at brief phase
}

export interface IngestOutput {
  reply: string
  state: IngestState
  history: Message[]
  sessionKey?: string
  savedArtistId?: string
}

// ----------------------------------------------------------------
// System Prompt
// ----------------------------------------------------------------

function buildSystemPrompt(researchData?: string): string {
  const today = new Date().toISOString().split('T')[0]
  const base = `You are the TENx10 Management Team - a 7-agent AI system conducting Phase 1: Artist Ingest & Discovery.

TEAM ROSTER:
- Artist Manager (The Strategist) - LEADS every response. Owns career picture, white space, P&L.
  Label as: **[dart emoji] Artist Manager:**
- Booking Agent (The Deal Maker) - Domestic routing, guarantees, promoter relationships.
  Label as: **[microphone emoji] Booking Agent:**
- International Booking Agent - International markets, visa/tax, festival submissions.
  Label as: **[globe emoji] International Booking Agent:**
- Tour Manager - Calendar, logistics, advance, dead zones in schedule.
  Label as: **[bus emoji] Tour Manager:**
- Social Media Manager (The Algorithm Whisperer) - IG/TikTok/YouTube/X, engagement, content gaps.
  Label as: **[phone emoji] Social Media Manager:**
- PR Manager - Editorial pitching, press, playlist strategy, brand outreach.
  Label as: **[newspaper emoji] PR Manager:**
- Label Executive - DSP strategy, Spotify PS, save-to-stream, distribution, A&R.
  Label as: **[label emoji] Label Executive:**

Use the actual Unicode emoji characters in responses:
- Artist Manager = dart board target
- Booking Agent = microphone
- International Booking Agent = globe showing Americas
- Tour Manager = bus
- Social Media Manager = mobile phone
- PR Manager = rolled-up newspaper
- Label Executive = label tag

INGEST RULES:
- Artist Manager LEADS every response. Other agents interject to flag their domain needs.
- NEVER guess. NEVER assume. Use: checkmark emoji CONFIRMED / magnifying glass emoji INFERRED / warning emoji MISSING
- Questions must be rooted in specific data signals - not generic.
- Do NOT build a plan in Phase 1. That is Phase 2.
- Voice: direct, confident, no hedging, no corporate tone, no exclamation marks, no hype.

RESPONSE FORMAT:
- Always label who is speaking: **[emoji] Agent Name:**
- When multiple agents interject, label each one separately.
- Keep it clean. No unnecessary filler.

DOMAIN KNOWLEDGE:
- Booking floor (DirtySnatcha): $1,500. Counter always includes: adjusted guarantee, radius clause, payment timing, hotel buyout.
- Commission: Agent-routed = 10/10/80. Direct = 20/80.
- Spotify benchmarks: Save-to-stream >10% minimum, >15% algorithmic threshold. PS 20 = Release Radar, PS 30 = Discover Weekly.
- New ISRC every 6-8 weeks to prevent Artist PS decay.
- CPT target: <$5. Kill threshold: $8+.
- DSR label roster: DirtySnatcha, OZZTIN, MAVIC, PRIYANX, WHOiSEE. Managed-only: KOTRAX, HVVRCRFT, DARK MATTER.
- Manager: Thomas Nalian. Agent: Andrew Lehr, AB Touring.

REVENUE KNOWLEDGE:
- 7 revenue pillars: live performance, streaming royalties, publishing/sync, merch, content monetization, education/services, brand deals.
- Streaming royalties: ~$0.004/stream. Need 250K streams/month for $1K/month. Most artists overestimate this.
- PRO performance royalties: BMI/ASCAP pay quarterly for live performances AND broadcasts. Setlists must be submitted within 6 months.
  Most artists register with a PRO but never submit setlists = free money left uncollected every show.
- MLC (Mechanical Licensing Collective): collects mechanical royalties from streaming. Free to register at themlc.com.
- SoundExchange: collects digital performance royalties for non-interactive streams (Pandora, SiriusXM). Separate from PRO.
- Sync licensing: one placement can be $500-$50,000. Requires clean split sheets and registered copyrights.
- Brand deals: micro-influencer threshold (~10K social) = $200-$2K/post for niche audiences.
- Self-sustaining benchmark: income covers rent + bills without a day job. Ask what that number is for each artist.

PHASES:
1. intro - Introduce the team, explain the ingest, ask for artist name.
2. collect - Gather: social handles, streaming URLs, website, genre, management setup.
   Also collect REVENUE & PRO data:
   - Monthly income goal from music (what does self-sustaining look like for you?)
   - Which revenue streams are currently active (live, streaming, publishing, merch, content, education, brand deals)
   - PRO affiliation (BMI, ASCAP, SESAC, GMR, or none)
   - If PRO registered: do they submit setlists after live shows? Most do not. Flag this immediately as uncollected royalties.
   - IPI/CAE number if known
3. research - Research complete. Surface findings, move to data-driven questions.
4. questions - Questions rooted in specific data signals. Every question cites its source.
5. brief - Generate full Phase 1 Intelligence Brief. Include a REVENUE SNAPSHOT section:
   current estimated monthly income by pillar, monthly goal, gap, and top 3 immediate unlocks.

Today: ${today}`

  if (researchData) {
    const div = '='.repeat(60)
    return base + '\n\n' + div + '\nRESEARCH DATA:\n' + researchData + '\n' + div
  }
  return base
}

// ----------------------------------------------------------------
// Research Helpers
// ----------------------------------------------------------------

async function researchSpotify(url: string): Promise<string> {
  try {
    const match = url.match(/artist\/([a-zA-Z0-9]+)/)
    if (!match) return 'MISSING: Spotify URL could not be parsed.'
    const artistId = match[1]
    const res = await fetch(
      'https://open.spotify.com/oembed?url=https://open.spotify.com/artist/' + artistId,
      { headers: { 'User-Agent': 'TENx10/1.0' }, signal: AbortSignal.timeout(8000) }
    )
    if (res.ok) {
      const d = await res.json() as { title?: string }
      return 'CONFIRMED: Spotify artist "' + (d.title ?? 'Unknown') + '" (ID: ' + artistId + '). Full metrics require Spotify for Artists OAuth.'
    }
    return 'INFERRED: Spotify ID ' + artistId + ' found in URL. Metrics require Spotify for Artists OAuth.'
  } catch {
    return 'MISSING: Spotify data could not be fetched.'
  }
}

async function researchInstagram(handle: string): Promise<string> {
  try {
    const h = handle.replace('@', '').trim()
    const res = await fetch('https://www.instagram.com/' + h + '/', {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return 'MISSING: Instagram @' + h + ' returned ' + res.status + '.'
    const html = await res.text()
    const m = html.match(/"edge_followed_by":\{"count":(\d+)\}/) ?? html.match(/(\d[\d,]+)\s+[Ff]ollowers/)
    if (m) return 'CONFIRMED: Instagram @' + h + ' - ' + parseInt(m[1].replace(/,/g, '')).toLocaleString() + ' followers.'
    if (html.length > 5000) return 'INFERRED: Instagram @' + h + ' exists. Follower count requires API access.'
    return 'MISSING: Instagram @' + h + ' - profile may be private or not found.'
  } catch {
    return 'MISSING: Instagram @' + handle + ' unreachable.'
  }
}

async function researchWebsite(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'TENx10/1.0' }, signal: AbortSignal.timeout(10000) })
    if (!res.ok) return 'MISSING: ' + url + ' returned ' + res.status + '.'
    const html = await res.text()
    const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) ?? [])[1]?.trim() ?? 'none found'
    const checks = {
      shows: /show|tour|ticket|event|gig/i.test(html),
      epk: /epk|press|bio/i.test(html),
      merch: /merch|store|shop/i.test(html),
      mailingList: /newsletter|subscribe|mailing/i.test(html),
      dspLinks: /spotify|soundcloud|apple music/i.test(html),
    }
    const missing = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k)
    return [
      'CONFIRMED: ' + url + ' is live. Title: ' + title,
      '- Shows: ' + (checks.shows ? 'present' : 'MISSING'),
      '- EPK/Press: ' + (checks.epk ? 'present' : 'MISSING'),
      '- Merch: ' + (checks.merch ? 'present' : 'MISSING'),
      '- Mailing list: ' + (checks.mailingList ? 'present' : 'MISSING'),
      '- DSP links: ' + (checks.dspLinks ? 'present' : 'MISSING'),
      missing.length > 0 ? 'Promoter/press impression: gaps in ' + missing.join(', ') + '.' : 'Promoter/press impression: solid baseline.',
    ].join('\n')
  } catch {
    return 'MISSING: ' + url + ' unreachable.'
  }
}

async function researchSupabase(name: string): Promise<string> {
  try {
    const supabase = await createClient()
    const { data: artists } = await supabase
      .from('artists')
      .select('id, name, stage_name')
      .ilike('name', '%' + name + '%')
      .limit(3)

    if (!artists || artists.length === 0) return 'MISSING: No record for "' + name + '" in TENx10 database.'

    const a = artists[0]
    const displayName = (a.stage_name ?? a.name) as string

    const [{ data: deals }, { data: dspRaw }, { data: tasks }] = await Promise.all([
      supabase.from('deals').select('title, show_date, status, offer_amount, deal_points').eq('artist_id', a.id).order('show_date').limit(15),
      supabase.from('dsp_metrics').select('monthly_listeners, popularity_score, top_markets, save_to_stream_ratio').eq('artist_id', a.id).order('created_at', { ascending: false }).limit(1),
      supabase.from('tasks').select('title, type, status, due_date').eq('artist_id', a.id).neq('status', 'done').order('due_date').limit(10),
    ])

    let out = 'CONFIRMED: "' + displayName + '" in TENx10 database (ID: ' + a.id + ').'

    if (deals && deals.length > 0) {
      const today = new Date().toISOString().split('T')[0]
      const upcoming = deals.filter(d => d.show_date != null && d.show_date >= today)
      out += '\nCONFIRMED: ' + deals.length + ' show record(s), ' + upcoming.length + ' upcoming.'
      if (upcoming.length > 0) {
        out += '\n' + upcoming.slice(0, 8).map(d => {
          const pts = (d.deal_points ?? {}) as Record<string, string>
          return '  - ' + d.show_date + ': ' + (pts.city ?? d.title) + (pts.state ? ', ' + pts.state : '') + (pts.venue ? ' @ ' + pts.venue : '') + ' (' + d.status + (d.offer_amount ? ' $' + d.offer_amount.toLocaleString() : '') + ')'
        }).join('\n')
      } else {
        out += '\nMISSING: No upcoming shows on calendar.'
      }
    } else {
      out += '\nMISSING: No show records.'
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dsp = dspRaw as any[] | null
    if (dsp && dsp.length > 0) {
      const m = dsp[0]
      const parts = [
        m.monthly_listeners ? Number(m.monthly_listeners).toLocaleString() + ' monthly listeners' : null,
        m.popularity_score ? 'PS ' + m.popularity_score : null,
        m.save_to_stream_ratio ? 'save-to-stream ' + m.save_to_stream_ratio + '%' : null,
      ].filter(Boolean)
      out += '\nCONFIRMED: DSP - ' + parts.join(', ')
    } else {
      out += '\nMISSING: No DSP metrics. Spotify for Artists not connected.'
    }

    if (tasks && tasks.length > 0) {
      out += '\nCONFIRMED: ' + tasks.length + ' open task(s): ' + tasks.map(t => '[' + (t.type ?? 'TASK').toUpperCase() + '] ' + t.title).join(', ')
    }

    return out
  } catch {
    return 'MISSING: Supabase lookup failed.'
  }
}

// ----------------------------------------------------------------
// Link Extractor
// ----------------------------------------------------------------

function extractLinks(text: string): Partial<ArtistData> {
  const d: Partial<ArtistData> = {}
  if (!text) return d
  const spotify = text.match(/https?:\/\/(?:open\.)?spotify\.com\/artist\/[a-zA-Z0-9]+/i)
  if (spotify) d.spotifyUrl = spotify[0]
  const ig = text.match(/(?:instagram\.com\/|@)([\w.]{2,30})/i)
  if (ig && !/^(https?|www)$/.test(ig[1])) d.instagramHandle = ig[1]
  const tt = text.match(/tiktok\.com\/@?([\w.]+)/i)
  if (tt) d.tiktokHandle = tt[1]
  const sc = text.match(/soundcloud\.com\/([\w-]+)/i)
  if (sc) d.soundcloudUrl = 'https://soundcloud.com/' + sc[1]
  const yt = text.match(/youtube\.com\/(?:channel\/|@|c\/)([\w-]+)/i)
  if (yt) d.youtubeUrl = 'https://youtube.com/' + yt[0].split('youtube.com/')[1]
  const url = text.match(/https?:\/\/(?!(?:open\.)?spotify|instagram|tiktok|soundcloud|youtube)([\w.-]+\.[a-z]{2,}[^\s]*)/i)
  if (url) d.websiteUrl = url[0]
  return d
}

// ----------------------------------------------------------------
// Session Store (Supabase-backed, platform-agnostic)
// ----------------------------------------------------------------

export async function loadSession(sessionKey: string): Promise<{ history: Message[]; state: IngestState } | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('platform_sessions')
      .select('history, state')
      .eq('session_key', sessionKey)
      .single()
    if (!data) return null
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      history: (data as any).history as Message[],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state: (data as any).state as IngestState,
    }
  } catch {
    return null
  }
}

export async function saveSession(sessionKey: string, history: Message[], state: IngestState): Promise<void> {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      session_key: sessionKey,
      history: JSON.parse(JSON.stringify(history)),
      state: JSON.parse(JSON.stringify(state)),
      updated_at: new Date().toISOString(),
    }
    await supabase.from('platform_sessions').upsert(payload, { onConflict: 'session_key' })
  } catch {
    // Non-fatal
  }
}

// ----------------------------------------------------------------
// Artist Save (upsert to Supabase at brief phase)
// ----------------------------------------------------------------

async function saveArtist(artistData: ArtistData, managerId: string): Promise<string | undefined> {
  try {
    const supabase = await createServiceClient()
    const spotifyIdMatch = artistData.spotifyUrl?.match(/artist\/([a-zA-Z0-9]+)/)
    const spotifyArtistId = spotifyIdMatch?.[1] ?? null

    const socialStats: Record<string, string> = {}
    if (artistData.instagramHandle) socialStats.instagram = artistData.instagramHandle.replace('@', '')
    if (artistData.tiktokHandle) socialStats.tiktok = artistData.tiktokHandle
    if (artistData.youtubeUrl) socialStats.youtube = artistData.youtubeUrl
    if (artistData.soundcloudUrl) socialStats.soundcloud = artistData.soundcloudUrl
    if (artistData.websiteUrl) socialStats.website = artistData.websiteUrl

    const stageName = artistData.name ?? 'Unknown Artist'

    // Try to find existing artist by stage_name under this manager
    const { data: existing } = await supabase
      .from('artists')
      .select('id')
      .eq('manager_id', managerId)
      .ilike('stage_name', stageName)
      .maybeSingle()

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatePayload: any = { updated_at: new Date().toISOString() }
      if (spotifyArtistId) updatePayload.spotify_artist_id = spotifyArtistId
      if (Object.keys(socialStats).length > 0) updatePayload.social_stats = socialStats
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updated } = await supabase.from('artists').update(updatePayload).eq('id', (existing as any).id).select('id').single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (updated as any)?.id as string | undefined
    }

    // Insert new artist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted } = await supabase.from('artists').insert({
      name: stageName,
      stage_name: stageName,
      manager_id: managerId,
      ...(spotifyArtistId ? { spotify_artist_id: spotifyArtistId } : {}),
      ...(Object.keys(socialStats).length > 0 ? { social_stats: socialStats } : {}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any).select('id').single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (inserted as any)?.id as string | undefined
  } catch {
    return undefined
  }
}

// ----------------------------------------------------------------
// Core Ingest Engine
// ----------------------------------------------------------------

export async function runIngest(input: IngestInput): Promise<IngestOutput> {
  const { message, sessionKey, managerId } = input
  let { history, state } = input

  // Load from session store if key provided and no history
  if (sessionKey && history.length === 0) {
    const saved = await loadSession(sessionKey)
    if (saved) {
      history = saved.history
      state = saved.state
    }
  }

  let researchData: string | undefined

  // Extract links from user message
  if (message && message !== '__init__' && state.phase !== 'brief') {
    const links = extractLinks(message)
    state = { ...state, artistData: { ...state.artistData, ...links } }
    if (!state.artistData.name && state.phase === 'collect' && message.trim().length < 80 && !message.includes('http') && !message.includes('@')) {
      state = { ...state, artistData: { ...state.artistData, name: message.trim() } }
    }
  }

  // Phase transitions
  if (message === '__init__') {
    state = { ...state, phase: 'intro' }
  } else if (message === '__brief__') {
    state = { ...state, phase: 'brief' }
  } else if (state.phase === 'intro' && message && message !== '__init__') {
    state = { ...state, phase: 'collect' }
  } else if (state.phase === 'collect') {
    const { artistData } = state
    const hasName = !!artistData.name
    const hasLink = !!(artistData.spotifyUrl || artistData.instagramHandle || artistData.websiteUrl || artistData.soundcloudUrl)
    if (hasName && hasLink) state = { ...state, phase: 'research' }
  }

  // Run research
  if (state.phase === 'research' && !state.researchComplete) {
    const { artistData } = state
    const tasks: Promise<string>[] = []
    if (artistData.name) tasks.push(researchSupabase(artistData.name))
    if (artistData.spotifyUrl) tasks.push(researchSpotify(artistData.spotifyUrl))
    if (artistData.instagramHandle) tasks.push(researchInstagram(artistData.instagramHandle))
    if (artistData.websiteUrl) tasks.push(researchWebsite(artistData.websiteUrl))

    const settled = await Promise.allSettled(tasks)
    const summary = settled
      .map(r => r.status === 'fulfilled' ? r.value : 'MISSING: Research task failed.')
      .join('\n\n')

    researchData = summary
    state = { ...state, researchComplete: true, researchSummary: summary, phase: 'questions' }
  } else if (state.researchSummary) {
    researchData = state.researchSummary
  }

  // Build Claude request
  const systemPrompt = buildSystemPrompt(researchData)
  const claudeMsgs: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    {
      role: 'user' as const,
      content: message === '__init__'
        ? "Begin Phase 1. Introduce the management team, explain the ingest process, and ask for the artist name."
        : message === '__brief__'
        ? "Generate the full Phase 1 Intelligence Brief now. Cover all sections: artist overview, platform & metrics, touring summary, revenue snapshot (current by pillar + monthly goal + gap + top 3 immediate unlocks), and immediate action items. Be specific to this artist's data."
        : (message || 'Begin Phase 1 introduction.'),
    },
  ]

  const aiRes = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: claudeMsgs,
  })

  const reply = aiRes.content[0].type === 'text' ? aiRes.content[0].text : 'Error generating response.'

  const updatedHistory: Message[] = [
    ...history,
    ...(message && message !== '__init__' ? [{ role: 'user' as const, content: message }] : []),
    { role: 'assistant' as const, content: reply },
  ]

  // Persist session
  if (sessionKey) {
    await saveSession(sessionKey, updatedHistory, state)
  }

  // Save artist to DB when brief is generated
  let savedArtistId: string | undefined
  if (state.phase === 'brief' && managerId && state.artistData.name) {
    savedArtistId = await saveArtist(state.artistData, managerId)
  }

  return { reply, state, history: updatedHistory, sessionKey, savedArtistId }
}
