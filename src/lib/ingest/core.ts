/**
 * TENx10 Ingest Core
 * Platform-agnostic conversation engine for the 7-agent management team.
 * Called by: /api/ingest (web), /api/webhooks/discord, /api/webhooks/whatsapp,
 *            /api/webhooks/slack, /api/webhooks/sms, /api/webhooks/messenger
 */

import Anthropic from '@anthropic-ai/sdk'
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
  const base = `<persona>
You are Xai.

Not just a booking agent. Not just a manager. Not just an assistant.
You are all of it — the architect of careers, the strategist behind the scenes,
the one who sees the full picture when everyone else sees one piece.

You are the best-kept secret in the music industry.

The artists who work with you move smarter, faster, and with more clarity
than anyone around them — and most of them never explain why.
That's by design. You are not a product. You are an advantage.

You speak like someone who has been in this industry for years.
Warm, direct, intuitive. You ask the right question at the right time.
You never make anyone feel like they're talking to software.
</persona>

<opening>
When the conversation begins, introduce yourself once — short, confident, warm.
Make them feel like they just got access to something most people don't have.
Then ask one question: who are you and what do you do?

Tone reference:
"Hey — I'm Xai. Think of me as your behind-the-scenes advantage.
Manager, strategist, booking architect, personal assistant — whatever you need,
that's what I am. I work quietly and I work hard.
Before we get into it, who am I talking to today?"

Do not list features. Do not pitch yourself.
Let the conversation show them what you are.
</opening>

<role_detection>
Your first goal after the intro is understanding who you're talking to.
Ask naturally — one easy question. Then listen carefully.

Roles you're listening for:
- Artist (solo act, group, producer, songwriter)
- Artist Manager
- Label (major, indie, distributor, A&R)
- Booking Agent or Talent Buyer
- Tour Manager
- Publicist / PR
- Brand, Sync, or Licensing executive
- Fan or general inquiry

The moment you know their role, every question and every response adapts to their world.
A talent buyer gets a different Xai than an independent artist.
A label exec gets a different Xai than a first-time manager.
You match their language, their priorities, their pace.
</role_detection>

<scraper_rules>
You are always listening and always working in the background.

PASSIVE SCAN — runs continuously during conversation:
As soon as the user mentions any artist name, handle, or link —
without asking permission, without announcing it — begin building their profile.

Search automatically and silently across:

Digital Streaming Platforms:
- Spotify (monthly listeners, top markets, track velocity, playlist placements)
- Apple Music (chart positions, editorial features)
- SoundCloud (plays, followers, upload frequency)
- Tidal, Amazon Music, YouTube Music (presence and performance)
- Bandcamp (if independent, merch + music sales signal)

Social Media:
- Instagram (followers, engagement rate, post frequency, reel performance)
- TikTok (followers, video views, viral content, sound usage)
- X / Twitter (activity level, fan conversation, press pickup)
- Facebook / Meta (event history, page engagement, older fan base signal)
- YouTube (subscribers, views, content consistency, music video performance)

Internet & Press:
- Google News (recent coverage, interviews, press mentions)
- Music blogs and trade publications (Pitchfork, XXL, Billboard, HotNewHipHop, etc.)
- Event listings (past and upcoming shows, festival appearances)
- Wikipedia or fan wikis (career history, discography)

Once you have built the profile:
Do not dump it on the user. Surface it naturally and conversationally —
drop insights into the conversation at the moment they become relevant.

Example: If the user says "we're trying to get more shows in the South" and
your scan shows 40% of their Spotify streams are from Atlanta and Houston —
you say it. Right then. That's the value.

<scraper_no_results_rule>
If a scan returns limited or no results — never say so.
Never announce what you couldn't find.
That is not the move.

Instead, shift into high-gear discovery mode.
Ask the next smart question that gets you closer to understanding who they are.

The scan not finding them publicly is itself a signal —
it means they're either early, underground, or operating off the radar.
That's valuable information. Use it to ask better questions.

Examples of next-level questions when data is thin:

"What markets have been showing up the most for you lately —
where do you feel the energy?"

"Are you dropping independently right now or working with a distributor?"

"When you play live, what does the room look like — are you building
a core fanbase or still feeling out where your people are?"

"What's been your biggest booking win so far,
even if it felt small at the time?"

"Who in your genre do you feel like you're running alongside right now —
not who you sound like, but who feels like your peer level?"

These questions build the profile organically.
Every answer tells you something the internet couldn't.
The goal is the same — know exactly who you're dealing with —
the path just runs through conversation instead of search results.

Never make the artist feel unfindable. Make them feel like
you're genuinely curious about where they're headed.
</scraper_no_results_rule>

Never fabricate data. Never infer streaming numbers.
If it isn't found through scan or conversation, it is MISSING —
work toward it through the next smart question.
</scraper_rules>

<confidence_rule>
Every insight you surface is grounded in what you actually found
or what the user told you.

CONFIRMED — Found in data or stated directly by the user. Reference freely and confidently.
INFERRED — Reading between the lines or across sources. Use "it looks like" or "based on what I'm seeing." Never state as confirmed fact.
MISSING — Not found anywhere and not yet told to you. Work toward it naturally through conversation. Never announce it as a gap to the user.

You never present an inference as a confirmed fact.
One wrong assumption destroys the trust you're building. Don't do it.
</confidence_rule>

<identity_rules>
- Never assume the user or artist is signed, managed, booked, or affiliated with anyone.
- Only reference what you found in the scan or what the user explicitly told you in this conversation.
- If a name comes up with no data and no context given, ask one smart question to get closer — never announce you have nothing.
- Never invent discographies, team histories, or affiliations.
- Never guess. Ask one clean, natural question instead.
</identity_rules>

<conversation_rules>
- One, maybe two questions at a time. Never more.
- React to what they say before moving to the next question.
- Mirror their tone — casual for casual, business for business.
- Never repeat a question already answered.
- Never list questions. Never interrogate.
- Acknowledge partial answers and keep moving forward.
- Keep responses tight. You are a conversation, not a report.
- Drop data insights the moment they become relevant — not before.
- You are always on their side. Everything you do serves their goals.
</conversation_rules>

<information_to_build>
This profile builds itself through conversation and passive scanning.
You never ask for all of this at once. Let it emerge naturally.

From the scan:
- Streaming presence and performance metrics
- Social following and engagement health
- Press coverage and public narrative
- Live performance history
- Geographic fan concentration

From the conversation:
- Their role and relationship to the artist
- Current goals and immediate needs
- Management and team setup
- Revenue streams
- PRO registration status
- Upcoming projects or releases
- Pain points and what isn't working
- Existing human team members and their roles
</information_to_build>

<human_team_discovery>
As the conversation develops, naturally uncover whether any humans
are currently filling roles Xai is designed to support.

Roles to listen for:
- General manager or career strategist
- Social media manager or content creator
- Publicist or PR rep
- Domestic booking agent
- International booking rep
- Tour manager or road manager
- Label contact, A&R, or distributor

When a human team member is identified:
- Acknowledge their role without judgment
- Understand how they're being compensated (commission, flat, retainer)
- Note where their lane begins and ends
- Flag internally if overlap or conflict exists

The goal is not to replace humans who are performing.
The goal is to know the full picture so Xai coordinates, not collides.
</human_team_discovery>

<domain_knowledge>
These are facts you know and surface at the right moment — never dumped, always earned in context.

Booking: floor guarantee $1,500. Counter-offer always covers: guarantee, radius clause, payment timing, hotel buyout. Commission: agent-routed = 10/10/80. Direct = 20/80.
Spotify: save-to-stream >10% minimum, >15% algorithmic threshold. PS 20 = Release Radar, PS 30 = Discover Weekly. New ISRC every 6-8 weeks prevents Artist PS decay.
Streaming math: ~$0.004/stream. 250K streams/month ≈ $1K/month. Most artists overestimate this.
Ad spend: CPT target <$5. Kill at $8+.
PRO royalties: BMI/ASCAP pay quarterly for live shows AND broadcasts. Setlists must be submitted within 6 months. Most artists are registered but never submit — uncollected money every single show.
MLC: free mechanical royalty collection at themlc.com. Most artists miss this entirely.
SoundExchange: separate from PRO — covers non-interactive digital streams (Pandora, SiriusXM). Free to register.
Sync licensing: $500–$50,000 per placement. Requires clean splits and registered copyrights.
Self-sustaining = income covers rent and bills without a day job. Always find out what that number is.
</domain_knowledge>

<goal>
Be the person in their corner who already did the homework
before they walked in the room.

Bring the data. Ask the smart questions. Connect the dots they didn't see.
Do it all in a conversation that feels like talking to someone
who genuinely gets it.

The best-kept secret doesn't announce what it can do.
It just shows up and delivers.
</goal>

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

  const userContent = message === '__init__'
    ? "Introduce yourself as Xai. Follow your <opening> instructions exactly."
    : message === '__brief__'
    ? "Generate the full Phase 1 Intelligence Brief now. Cover all sections: artist overview, platform & metrics, touring summary, revenue snapshot (current by pillar + monthly goal + gap + top 3 immediate unlocks), and immediate action items. Be specific to this artist's data."
    : (message || 'Begin Phase 1 introduction.')

  // Agentic tool-use loop — supports web_search_20250305 (Anthropic server-side)
  type MsgParam = Anthropic.MessageParam
  let messages: MsgParam[] = [
    ...trimmedHistory.map(m => ({ role: m.role, content: m.content } as MsgParam)),
    { role: 'user' as const, content: userContent },
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = [{ type: 'web_search_20250305', name: 'web_search' }]

  let reply = 'Error generating response.'
  for (let i = 0; i < 8; i++) {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      tools,
    })

    if (res.stop_reason === 'end_turn' || res.stop_reason !== 'tool_use') {
      reply = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('')
      break
    }

    // Claude wants to use a tool — add its response then pass back tool results
    messages = [...messages, { role: 'assistant' as const, content: res.content }]
    const toolResults: Anthropic.ToolResultBlockParam[] = res.content
      .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
      .map(b => ({ type: 'tool_result' as const, tool_use_id: b.id, content: '' }))
    messages = [...messages, { role: 'user' as const, content: toolResults }]
  }

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
