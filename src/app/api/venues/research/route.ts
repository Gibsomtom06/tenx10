import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const access = await getArtistAccess(supabase)
  if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { venueId } = await request.json() as { venueId: string }

  const { data: venue } = await supabase
    .from('venues')
    .select('*')
    .eq('id', venueId)
    .single()

  if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 })

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Research this venue and provide booking intelligence. Return ONLY valid JSON.

VENUE: ${venue.name}
CITY: ${venue.city ?? 'Unknown'}, ${venue.state ?? ''}
CAPACITY: ${venue.capacity ?? 'Unknown'}

Return this JSON structure:
{
  "talentBuyer": "name of typical talent buyer/booker or null",
  "bookingEmail": "booking contact email or null",
  "typicalGenres": "comma-separated list of genres this venue books",
  "sellRadius": "geographic area fans typically travel from (e.g. '50-mile radius', 'regional')",
  "otherShows": [
    {"artist": "artist name", "date": "approx date or null", "notes": "any relevant notes"}
  ],
  "summary": "2-3 sentence summary of this venue's profile, booking tendencies, and fit for bass/dubstep acts"
}`,
    }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
  let parsed: Record<string, unknown> = {}
  try { parsed = JSON.parse(raw) } catch { /* continue */ }

  await supabase.from('venues').update({
    talent_buyer: (parsed.talentBuyer as string) ?? null,
    booking_email: (parsed.bookingEmail as string) ?? null,
    typical_genres: (parsed.typicalGenres as string) ?? null,
    sell_radius: (parsed.sellRadius as string) ?? null,
    other_shows: (parsed.otherShows ?? null) as import('@/types/database').Json | null,
    intel: parsed as import('@/types/database').Json,
  }).eq('id', venueId)

  const { data: updated } = await supabase.from('venues').select('*').eq('id', venueId).single()
  return NextResponse.json({ venue: updated, intel: parsed })
}
