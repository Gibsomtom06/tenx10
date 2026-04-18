import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { askXCloudRun } from '@/lib/gemini/client'

async function buildArtistContext(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string> {
  const { data: artist } = await supabase
    .from('artists')
    .select('id, name, stage_name')
    .eq('user_id', userId)
    .single()

  if (!artist) return ''

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: deals },
    { data: tasks },
    { data: catalog },
  ] = await Promise.all([
    supabase
      .from('deals')
      .select('title, show_date, status, offer_amount, deal_points')
      .neq('status', 'cancelled')
      .gte('show_date', today)
      .order('show_date', { ascending: true })
      .limit(10),
    supabase
      .from('tasks')
      .select('title, type, status, due_date, description')
      .eq('artist_id', artist.id)
      .neq('status', 'done')
      .order('due_date', { ascending: true })
      .limit(10),
    supabase
      .from('catalog')
      .select('title, streams, bucket, release_date')
      .eq('artist_id', artist.id)
      .order('streams', { ascending: false })
      .limit(8),
  ])

  const artistName = artist.stage_name ?? artist.name

  const showLines = (deals ?? []).map(d => {
    const pts = (d.deal_points ?? {}) as Record<string, string>
    const city = pts.city ?? d.title
    const state = pts.state ?? ''
    const venue = pts.venue ?? ''
    return `- ${d.show_date}: ${city}${state ? `, ${state}` : ''}${venue ? ` @ ${venue}` : ''} (${d.status}${d.offer_amount ? ` · $${d.offer_amount.toLocaleString()}` : ''})`
  }).join('\n') || 'No upcoming shows scheduled.'

  const taskLines = (tasks ?? []).map(t =>
    `- [${t.type.toUpperCase()}] ${t.title}${t.due_date ? ` (due ${t.due_date})` : ''} — ${t.status}`
  ).join('\n') || 'No open tasks.'

  const catalogLines = (catalog ?? []).map(t =>
    `- ${t.title} (${t.bucket === 'released_full' ? 'Released' : t.bucket})${t.streams ? ` — ${(t.streams / 1_000_000).toFixed(2)}M streams` : ''}`
  ).join('\n') || 'No catalog tracks.'

  return `
ARTIST CONTEXT — ${artistName.toUpperCase()}
Today's date: ${today}

UPCOMING SHOWS:
${showLines}

OPEN TASKS:
${taskLines}

CATALOG:
${catalogLines}
`.trim()
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, conversationId, artistId } = await request.json()

  // Load conversation history
  let history: Array<{ role: 'user' | 'model'; content: string }> = []
  if (conversationId) {
    const { data: conv } = await supabase
      .from('agent_conversations')
      .select('messages')
      .eq('id', conversationId)
      .single()
    if (conv?.messages) {
      history = (conv.messages as Array<{ role: string; content: string }>).map(m => ({
        role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
        content: m.content,
      }))
    }
  }

  // Build artist-specific context if the user has an artist account
  const artistContext = await buildArtistContext(supabase, user.id)

  // Prepend context to the first message if we have it and no history yet
  let messageWithContext = message
  if (artistContext && history.length === 0) {
    messageWithContext = `${artistContext}\n\n---\n\nUser question: ${message}`
  }

  const reply = await askXCloudRun(history, messageWithContext)

  const updatedMessages = [
    ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: message },
    { role: 'assistant', content: reply },
  ]

  const { data: saved } = await supabase
    .from('agent_conversations')
    .upsert({
      ...(conversationId ? { id: conversationId } : {}),
      user_id: user.id,
      artist_id: artistId ?? null,
      messages: updatedMessages,
    })
    .select()
    .single()

  return NextResponse.json({ reply, conversationId: saved?.id })
}
