import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ImportRow {
  artist: string
  venue: string
  city: string
  state: string
  date: string
  guarantee: number | null
  promoter: string
  promoterEmail: string
  status: string
  platform: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows, platform } = await request.json() as { rows: ImportRow[]; platform: string }
  if (!rows?.length) return NextResponse.json({ error: 'No rows provided' }, { status: 400 })

  // Get primary artist (DirtySnatcha) — used as default if artist col is empty
  const { data: artists } = await supabase.from('artists').select('id, name, stage_name').eq('manager_id', user.id)
  const artistMap: Record<string, string> = {}
  for (const a of artists ?? []) {
    if (a.stage_name) artistMap[a.stage_name.toLowerCase()] = a.id
    artistMap[a.name.toLowerCase()] = a.id
  }
  const defaultArtistId = artists?.[0]?.id

  let created = 0
  let contactsCreated = 0
  const errors: string[] = []
  const seenPromoters = new Set<string>()

  for (const row of rows) {
    try {
      // Resolve artist
      const artistKey = row.artist?.toLowerCase() ?? ''
      const artist_id = artistMap[artistKey] ?? defaultArtistId
      if (!artist_id) { errors.push(`No artist found for row: ${row.venue}`); continue }

      // Upsert venue
      let venue_id: string | null = null
      if (row.venue) {
        const { data: venue } = await supabase
          .from('venues')
          .insert({ name: row.venue, city: row.city || null, state: row.state || null })
          .select('id')
          .single()
        venue_id = venue?.id ?? null
      }

      // Upsert promoter
      let promoter_id: string | null = null
      if (row.promoter) {
        const { data: promoter } = await supabase
          .from('promoters')
          .insert({ name: row.promoter, email: row.promoterEmail || null, city: row.city || null })
          .select('id')
          .single()
        promoter_id = promoter?.id ?? null

        // Also add to contacts as a lead if not seen yet
        const promoterKey = `${row.promoter}:${row.promoterEmail}`.toLowerCase()
        if (!seenPromoters.has(promoterKey) && row.promoter) {
          seenPromoters.add(promoterKey)
          const { error: contactError } = await supabase.from('contacts').insert({
            name: row.promoter,
            email: row.promoterEmail || null,
            city: row.city || null,
            state: row.state || null,
            market_type: 'club',
            pitch_status: 'not_contacted',
            notes: `Imported from ${platform}. Past show: ${row.venue}${row.city ? `, ${row.city}` : ''}${row.date ? ` on ${row.date}` : ''}.`,
          })
          if (!contactError) contactsCreated++
        }
      }

      // Parse date
      let show_date: string | null = null
      if (row.date) {
        const d = new Date(row.date)
        if (!isNaN(d.getTime())) {
          show_date = d.toISOString().split('T')[0]
        }
      }

      // Map status
      const STATUS_MAP: Record<string, string> = {
        confirmed: 'confirmed', booked: 'confirmed', completed: 'completed',
        cancelled: 'cancelled', canceled: 'cancelled', pending: 'offer',
        inquiry: 'inquiry', negotiating: 'negotiating',
      }
      const status = STATUS_MAP[row.status?.toLowerCase()] ?? 'confirmed'

      // Create deal
      const title = [row.venue, row.city, row.state].filter(Boolean).join(' — ') || `Imported show ${row.date}`
      const { error: dealError } = await supabase.from('deals').insert({
        title,
        artist_id,
        venue_id,
        promoter_id,
        show_date,
        offer_amount: row.guarantee,
        status: status as any,
        created_by: user.id,
        notes: `Imported from ${platform}.`,
        deal_points: { platform, venue: row.venue, city: row.city, state: row.state } as any,
      })

      if (dealError) {
        errors.push(`${title}: ${dealError.message}`)
      } else {
        created++
      }
    } catch (err: any) {
      errors.push(`Row error: ${err.message}`)
    }
  }

  return NextResponse.json({ created, contacts: contactsCreated, errors })
}
