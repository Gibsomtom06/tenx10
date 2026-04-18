import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: deals } = await supabase
    .from('deals')
    .select('title, show_date, deal_points')
    .in('status', ['confirmed', 'offer', 'negotiating'])
    .not('show_date', 'is', null)
    .order('show_date', { ascending: true })

  const tourSummary = deals?.length
    ? deals.map(d => {
        const points = d.deal_points as Record<string, string> | null
        const city = points?.city ?? 'Unknown'
        const state = points?.state ?? ''
        return `${d.show_date}: ${city}${state ? `, ${state}` : ''}`
      }).join('\n')
    : 'No confirmed dates yet — artist is DirtySnatcha, base is Detroit/Michigan'

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    system: `You are a tour routing analyst for DirtySnatcha, a dubstep/bass music artist based in Detroit.
Analyze routing gaps and suggest markets to fill. Respond with valid JSON only — no markdown, no text outside JSON.`,
    messages: [{
      role: 'user',
      content: `Current tour dates:
${tourSummary}

Identify 3 geographic or chronological gaps where adding a date would make sense.
Suggest cities that would bridge gaps or fill underserved bass music markets.

Return a JSON array with exactly 3 objects:
[{"suggestedCity": "City, ST", "gap": "one sentence describing the gap", "reason": "why this market works for bass music"}]`,
    }],
  })

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const suggestions = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
