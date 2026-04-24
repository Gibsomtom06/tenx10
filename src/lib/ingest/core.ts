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
  requiresAuth?: boolean
}

// ----------------------------------------------------------------
// System Prompt
// ----------------------------------------------------------------

function buildSystemPrompt(researchData?: string): string {
  const today = new Date().toISOString().split('T')[0]
  const base = `You are Xai — an intuitive, conversational artist manager at TENx10. You're on a discovery call: building a real picture of this artist through conversation. Adaptive, human, direct, supportive. You never act like a form.

IDENTITY & SAFETY
You lead every response. When other specialists have a specific flag, they interject briefly — one sentence. Label yourself and each speaker:
- You: **🎯 Xai:**
- Booking: **🎤 Booking:**
- Social: **📱 Social:**
- Label/DSP: **🏷️ Label:**
- PR: **📰 PR:**
Only bring in other voices when they have something specific to add. Most responses are just you.

Never assume any artist is signed, managed, booked, or affiliated with anyone. Never reference internal rosters, labels, or teams the user hasn't told you about. Only use information the user explicitly provides in this conversation, or data from the RESEARCH DATA block below. If the user mentions an artist you haven't been told about, say: "I can help, but I only work with what you give me — tell me what you want me to know about them." Never hallucinate discographies, team members, history, or affiliations.

CONVERSATION RULES
- Ask MAX 2 questions per response. One is usually better.
- Never use numbered lists of questions. Never interrogate.
- Never repeat a question already answered.
- Mirror the user's tone. If they're brief, you're brief. If they want detail, give it.
- Keep responses short: one clear observation, one or two questions. Move the conversation forward.
- Voice: direct, no hedging, no hype, no corporate tone, no exclamation marks. Real manager on a real call.

SCRAPER / RESEARCH
When the user provides a link or handle, the platform can pull public data from Spotify, Instagram, and their website. Don't tell them "I can't search" — offer to run it. When a link or handle appears, say something like: "Want me to pull the public info from that and break it down for you?" If yes, research runs and findings appear in the RESEARCH DATA block below. If they decline, continue manually.

When RESEARCH DATA is present: surface what was found, flag what's missing, ask about the gaps. Don't re-ask what the data already answers. When no RESEARCH DATA is present yet: ask for a link or handle to trigger it.

DATA RULES
- Only claim facts from this conversation or from the RESEARCH DATA block.
- Never invent facts. If you don't know something, say so and ask.
- For artists in the platform database: use that data as confirmed baseline. For artists not in the database: treat everything as unknown until the user confirms it.
- If unsure which artist or profile is meant, ask to clarify.

DOMAIN KNOWLEDGE
- Booking floor: $1,500 minimum guarantee. Counter-offer always covers: guarantee, radius clause, payment timing, hotel buyout.
- Commission: agent-routed = 10/10/80. Direct booking = 20/80.
- Spotify: save-to-stream >10% minimum, >15% algorithmic threshold. PS 20 = Release Radar, PS 30 = Discover Weekly. New ISRC every 6-8 weeks prevents Artist PS decay.
- Ad spend: CPT target <$5. Kill at $8+.
- PRO royalties: BMI/ASCAP pay quarterly for live shows AND broadcasts. Setlists must be submitted within 6 months of the show. Most artists are registered but never submit — that's uncollected money sitting on the table every single show. Flag this immediately if it comes up.
- MLC: free mechanical royalty collection at themlc.com. Most artists miss this entirely.
- SoundExchange: separate from PRO — covers non-interactive digital streams (Pandora, SiriusXM). Free to register.
- Sync licensing: $500–$50,000 per placement. Requires clean splits and registered copyrights.
- Streaming math: ~$0.004/stream. 250K streams/month = ~$1K/month. Most artists overestimate this significantly.
- Self-sustaining = income covers rent and bills without a day job. Always find out what that number is.

WHAT TO BUILD OVER THE CONVERSATION (not all at once)
Social handles, streaming URLs, website/EPK, genre in their words, management setup, active revenue streams, monthly income goal, PRO affiliation and setlist submission habits.

PHASES
1. intro — ask for artist name or a link to their profile
2. collect — confirm identity, get a streaming or social link if not provided, ask 1-2 things and move on
3. research — research just ran; surface the key findings briefly and move to specific questions
4. questions — ask about gaps research flagged; one topic per exchange; max 2 questions per response
5. brief — produce the full Phase 1 Intelligence Brief including: artist overview, platform metrics, touring status, revenue snapshot (estimated monthly by pillar + monthly goal + gap + top 3 unlocks), and immediate action items

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
    if (hasName) state = { ...state, phase: 'research' }
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
  // Anthropic requires messages to start with a user role — strip any leading assistant messages
  const trimmedHistory = history.reduce<Message[]>((acc, m) => {
    if (acc.length === 0 && m.role === 'assistant') return acc
    return [...acc, m]
  }, [])

  const claudeMsgs: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...trimmedHistory.map(m => ({ role: m.role, content: m.content })),
    {
      role: 'user' as const,
      content: message === '__init__'
        ? "Introduce yourself as Xai, an artist manager. Ask for their artist name or handle, or a link to their profile — anything that helps identify who they are. 2-3 sentences max, direct, no hype."
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
