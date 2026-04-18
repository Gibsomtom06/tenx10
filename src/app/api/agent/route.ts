import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { askXCloudRun } from '@/lib/gemini/client'

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

  const reply = await askXCloudRun(history, message)

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
