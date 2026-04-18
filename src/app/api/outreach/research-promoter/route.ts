import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { city } = await request.json()
  if (!city) return NextResponse.json({ error: 'city required' }, { status: 400 })

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 900,
    system: `You are a booking intelligence analyst for DirtySnatcha Records, a dubstep/bass music label.
Provide promoters and venues in a given city that book bass music, dubstep, or electronic dance music.
Only include entities you have confident knowledge about. Never fabricate contact details.
Respond with valid JSON only — no markdown, no text outside the JSON array.`,
    messages: [{
      role: 'user',
      content: `List 4-5 promoters or venues in ${city} that book bass music, dubstep, or electronic/dance music.

Return a JSON array of objects with these fields:
- name: string (promoter or venue name)
- city: "${city}"
- grade: "A" | "B" | "C" | "D" (your confidence/reputation assessment)
- why: string (one sentence on why they're relevant for bass music)
- email: string | null (only if you know it with confidence)
- website: string | null (only if you know it with confidence)`,
    }],
  })

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const promoters = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
    return NextResponse.json({ promoters })
  } catch {
    return NextResponse.json({ promoters: [] })
  }
}
