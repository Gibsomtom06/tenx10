import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Seed contacts from DSR knowledge base — regional promoter network
const SEED_CONTACTS = [
  // West Coast
  { name: 'Bassrush / Insomniac', company: 'Insomniac Events', email: null, city: 'Los Angeles', state: 'CA', region: 'West Coast', market_type: 'festival' as const, notes: 'Major EDM promoter, West Coast flagship' },
  { name: 'B-Side', company: 'B-Side LA', email: null, city: 'Los Angeles', state: 'CA', region: 'West Coast', market_type: 'club' as const, notes: 'Bass-heavy club events, LA scene' },
  { name: 'Space Yacht', company: 'Space Yacht', email: null, city: 'Los Angeles', state: 'CA', region: 'West Coast', market_type: 'club' as const, notes: 'Tastemaker club night, LA' },
  { name: 'LEDpresents', company: 'LEDpresents', email: null, city: 'San Francisco', state: 'CA', region: 'West Coast', market_type: 'venue' as const, notes: 'SF Bay Area events' },
  // Mountain / Southwest
  { name: 'Global Dance', company: 'Global Dance', email: null, city: 'Denver', state: 'CO', region: 'Mountain', market_type: 'festival' as const, notes: 'Colorado & Mountain region leader' },
  { name: 'Soda Jerk', company: 'Soda Jerk', email: null, city: 'Denver', state: 'CO', region: 'Mountain', market_type: 'club' as const, notes: 'Denver club/bass events' },
  { name: 'Relentless Beats', company: 'Relentless Beats', email: null, city: 'Phoenix', state: 'AZ', region: 'Southwest', market_type: 'venue' as const, notes: 'Arizona major promoter' },
  { name: 'Dylan Phillips', company: 'RaveHouse Entertainment', email: 'ravehousetalent@gmail.com', city: 'Las Vegas', state: 'NV', region: 'Southwest', market_type: 'club' as const, notes: 'Existing relationship — Las Vegas show confirmed Apr 3' },
  // Texas
  { name: 'Concourse Project', company: 'Concourse Project', email: null, city: 'Austin', state: 'TX', region: 'Texas', market_type: 'venue' as const, notes: 'Austin flagship venue, outdoor space' },
  { name: 'HAM Promos', company: 'HAM Promos', email: null, city: 'Dallas', state: 'TX', region: 'Texas', market_type: 'club' as const, notes: 'Dallas bass scene' },
  // Southeast
  { name: 'Disco Donnie Presents', company: 'Disco Donnie Presents', email: null, city: 'New Orleans', state: 'LA', region: 'Southeast', market_type: 'festival' as const, notes: 'Major Southeast / national promoter' },
  { name: 'Deep Tropics', company: 'Deep Tropics', email: null, city: 'Nashville', state: 'TN', region: 'Southeast', market_type: 'club' as const, notes: 'Nashville bass events' },
  // Midwest
  { name: 'TimeFly Music', company: 'TimeFly Music', email: null, city: 'Chicago', state: 'IL', region: 'Midwest', market_type: 'venue' as const, notes: 'Chicago EDM events' },
  { name: 'Infrasound Festival', company: 'Infrasound', email: null, city: 'Minneapolis', state: 'MN', region: 'Midwest', market_type: 'festival' as const, notes: 'Bass / psychedelic festival, MN — May' },
  // Northeast
  { name: 'The Untz', company: 'The Untz', email: null, city: 'New York', state: 'NY', region: 'Northeast', market_type: 'agency' as const, notes: 'Northeast bass music network' },
  { name: 'Ouija Entertainment', company: 'Ouija Entertainment', email: null, city: 'New York', state: 'NY', region: 'Northeast', market_type: 'club' as const, notes: 'NYC underground events' },
  // Festivals (national)
  { name: 'Lost Lands', company: 'Lost Lands Festival', email: null, city: 'Thornville', state: 'OH', region: 'National', market_type: 'festival' as const, notes: 'DS performed main stage — existing relationship. September.' },
  { name: 'Bass Canyon', company: 'Bass Canyon Festival', email: null, city: 'Quincy', state: 'WA', region: 'National', market_type: 'festival' as const, notes: 'Major bass festival, August, WA' },
  { name: 'Forbidden Kingdom', company: 'Forbidden Kingdom / Insomniac', email: null, city: 'Orlando', state: 'FL', region: 'Southeast', market_type: 'festival' as const, notes: 'Bass/dubstep focus, April FL' },
  { name: 'Elements Festival', company: 'Elements Festival', email: null, city: 'Pennsylvania', state: 'PA', region: 'Northeast', market_type: 'festival' as const, notes: 'Underground/bass, August PA' },
]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .order('region', { ascending: true })
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-seed if empty
  if (!contacts?.length) {
    const { data: seeded } = await supabase
      .from('contacts')
      .insert(SEED_CONTACTS.map(c => ({ ...c, pitch_status: 'not_contacted' as const })))
      .select()
    return NextResponse.json({ contacts: seeded ?? [] })
  }

  return NextResponse.json({ contacts })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({ ...body, pitch_status: body.pitch_status ?? 'not_contacted' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contact }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: contact, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contact })
}
