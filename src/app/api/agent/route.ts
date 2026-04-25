import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'

const XAI_SYSTEM_PROMPT = `You are Xai — the AI management team behind TENx10.

You are not a chatbot. You are the manager, booking strategist, label operator, and revenue architect — all running in parallel. You speak like someone who has been in this industry for years. Warm, direct, no fluff.

When the user is logged in, you already know who they are. Do not ask "who am I talking to?" — they're already in the system. Get straight to work.

You have full context on their artists, upcoming shows, open deals, tasks, and catalog. Surface the right insights at the right moment. If something needs attention, say so directly.

You can help with:
- Booking strategy and offer evaluation
- Revenue gap identification across all 7 pillars
- Release planning and catalog health
- Outreach and pitch strategy
- Day-to-day management decisions
- Label operations (A&R, roster, publishing)

Never say you can't access data — you have it in context. Never be vague. Never be corporate.
If you don't have a specific number, ask one sharp question to get it.`

async function buildManagerContext(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, userEmail: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]

  // Get managed artists
  const { data: artists } = await (supabase as any)
    .from('artists')
    .select('id, name, stage_name, genre, spotify_artist_id, is_managed')
    .eq('manager_id', userId)
    .order('name')

  if (!artists?.length) return `Manager: ${userEmail}\nNo artists on roster yet.\nToday: ${today}`

  const artistIds = artists.map((a: any) => a.id)

  const [
    { data: upcomingDeals },
    { data: pendingDeals },
    { data: openTasks },
    { data: recentDeals },
  ] = await Promise.all([
    supabase.from('deals')
      .select('id, title, show_date, offer_amount, status, artist_id, deal_points')
      .in('artist_id', artistIds)
      .eq('status', 'confirmed')
      .gte('show_date', today)
      .order('show_date', { ascending: true })
      .limit(15),
    supabase.from('deals')
      .select('id, title, show_date, offer_amount, status, artist_id, deal_points')
      .in('artist_id', artistIds)
      .in('status', ['inquiry', 'offer', 'negotiating'])
      .order('show_date', { ascending: true })
      .limit(10),
    (supabase as any).from('tasks')
      .select('id, title, due_date, priority, status, artist_id')
      .in('artist_id', artistIds)
      .neq('status', 'done')
      .order('due_date', { ascending: true })
      .limit(10),
    supabase.from('deals')
      .select('offer_amount, status, artist_id')
      .in('artist_id', artistIds)
      .in('status', ['confirmed', 'completed'])
      .gte('show_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
  ])

  const artistMap = Object.fromEntries(artists.map((a: any) => [a.id, a.stage_name ?? a.name]))

  const rosterLines = artists.map((a: any) => {
    const name = a.stage_name ?? a.name
    const role = (a as any).is_managed === false ? 'label act' : 'managed'
    return `- ${name} (${role})${a.genre ? ` · ${a.genre}` : ''}${a.spotify_artist_id ? ' · Spotify linked' : ''}`
  }).join('\n')

  const confirmedLines = (upcomingDeals ?? []).map(d => {
    const pts = (d.deal_points ?? {}) as Record<string, string>
    const city = pts.city ?? d.title
    const state = pts.state ? `, ${pts.state}` : ''
    const artist = artistMap[d.artist_id] ?? 'Unknown'
    return `- ${d.show_date}: ${city}${state} · ${artist}${d.offer_amount ? ` · $${Number(d.offer_amount).toLocaleString()}` : ''}`
  }).join('\n') || 'None confirmed.'

  const pipelineLines = (pendingDeals ?? []).map(d => {
    const pts = (d.deal_points ?? {}) as Record<string, string>
    const city = pts.city ?? d.title
    const artist = artistMap[d.artist_id] ?? 'Unknown'
    return `- [${d.status.toUpperCase()}] ${city} · ${artist}${d.offer_amount ? ` · $${Number(d.offer_amount).toLocaleString()}` : ''}`
  }).join('\n') || 'Pipeline clear.'

  const taskLines = (openTasks ?? []).map((t: any) =>
    `- [${t.priority?.toUpperCase() ?? 'NORMAL'}] ${t.title}${t.due_date ? ` · due ${t.due_date}` : ''} · ${artistMap[t.artist_id ?? ''] ?? 'General'}`
  ).join('\n') || 'No open tasks.'

  const totalRevenue90d = (recentDeals ?? []).reduce((s, d) => s + (Number(d.offer_amount) || 0), 0)

  return `MANAGER CONTEXT — THOMAS NALIAN / TENx10
Today: ${today}

ROSTER (${artists.length} artists):
${rosterLines}

UPCOMING CONFIRMED SHOWS:
${confirmedLines}

PIPELINE (${(pendingDeals ?? []).length} active negotiations):
${pipelineLines}

OPEN TASKS:
${taskLines}

90-DAY CONFIRMED REVENUE: $${totalRevenue90d.toLocaleString()}`
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, conversationId } = await request.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Gemini not configured' }, { status: 500 })
  }

  // Load conversation history
  let history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []
  if (conversationId) {
    const { data: conv } = await supabase
      .from('agent_conversations')
      .select('messages')
      .eq('id', conversationId)
      .single()
    if (conv?.messages) {
      history = (conv.messages as Array<{ role: string; content: string }>).map(m => ({
        role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
        parts: [{ text: m.content }],
      }))
    }
  }

  // Build manager context and inject only on first message
  let userMessage = message
  if (history.length === 0) {
    const context = await buildManagerContext(supabase, user.id, user.email ?? '')
    userMessage = `${context}\n\n---\n\n${message}`
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: XAI_SYSTEM_PROMPT,
  })

  const chat = model.startChat({ history })
  const result = await chat.sendMessage(userMessage)
  const reply = result.response.text()

  // Persist conversation
  const updatedMessages = [
    ...(history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.parts[0]?.text ?? '' }))),
    { role: 'user', content: message },
    { role: 'assistant', content: reply },
  ]

  const { data: saved } = await supabase
    .from('agent_conversations')
    .upsert({
      ...(conversationId ? { id: conversationId } : {}),
      user_id: user.id,
      messages: updatedMessages,
    })
    .select('id')
    .single()

  return NextResponse.json({ reply, conversationId: saved?.id })
}
