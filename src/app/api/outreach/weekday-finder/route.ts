import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchWithGemini } from '@/lib/gemini/search'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { region, genre = 'dubstep bass music' } = await request.json()

  const regionClause = region ? `in the ${region} area` : 'across the US'

  const prompt = `Search for nightclubs, venues, and promoters ${regionClause} that currently run weeknight (Monday through Thursday) electronic music or ${genre} events in 2024-2025.

Look for:
- Weekly or monthly weeknight electronic music nights
- Club residencies or recurring bass music nights on weekdays
- Venues known for hosting weekday EDM or dubstep events
- Any promoters or booking contacts associated with weekday shows

Return a JSON array only (no markdown, no explanation outside the JSON):
[
  {
    "name": "venue or promoter name",
    "city": "city, state",
    "event_name": "name of the night or event series if known",
    "day": "Monday/Tuesday/Wednesday/Thursday",
    "frequency": "weekly/monthly/occasional",
    "why": "one sentence on why this is a good fit for bass music",
    "website": "url or null",
    "booking_contact": "email or name if found, otherwise null"
  }
]`

  try {
    const raw = await searchWithGemini(prompt)
    const json = raw.replace(/```json\n?|\n?```/g, '').trim()
    // Extract JSON array from response
    const match = json.match(/\[[\s\S]*\]/)
    if (!match) return NextResponse.json({ venues: [] })
    const venues = JSON.parse(match[0])
    return NextResponse.json({ venues })
  } catch (e) {
    return NextResponse.json({ error: 'Search failed', venues: [] }, { status: 500 })
  }
}
