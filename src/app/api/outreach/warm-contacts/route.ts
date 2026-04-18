import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface WarmContact {
  id: string
  name: string
  company: string | null
  email: string | null
  city: string | null
  state: string | null
  region: string | null
  market_type: string | null
  pitch_status: string | null
  notes: string | null
  // enriched
  relationship: 'vip' | 'expansion' | 'active' | 'warm'
  relationship_label: string
  artists_pitched: string[]
  deal_count: number
  confirmed_count: number
  total_value: number
  routing_note: string | null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch all non-cancelled deals to build relationship history
  const { data: allDeals } = await supabase
    .from('deals')
    .select('*')
    .neq('status', 'cancelled')

  const deals = allDeals ?? []

  // Build a map of contactId → deal history
  const contactHistory: Record<string, {
    deals: typeof deals
    artistSlugs: Set<string>
    confirmedCount: number
    totalValue: number
  }> = {}

  for (const deal of deals) {
    const pts = deal.deal_points as Record<string, string> | null
    const cid = pts?.contactId
    if (!cid) continue

    if (!contactHistory[cid]) {
      contactHistory[cid] = { deals: [], artistSlugs: new Set(), confirmedCount: 0, totalValue: 0 }
    }
    contactHistory[cid].deals.push(deal)
    if (pts?.artistSlug) contactHistory[cid].artistSlugs.add(pts.artistSlug)
    if (['confirmed', 'completed'].includes(deal.status)) {
      contactHistory[cid].confirmedCount++
      contactHistory[cid].totalValue += deal.offer_amount ?? 0
    }
  }

  // Fetch confirmed shows for routing proximity check
  const confirmedShows = deals
    .filter(d => ['confirmed', 'offer', 'negotiating'].includes(d.status) && d.show_date)
    .map(d => ({
      show_date: d.show_date as string,
      region: (d.deal_points as Record<string, string> | null)?.region ?? null,
      state: (d.deal_points as Record<string, string> | null)?.state ?? null,
      city: (d.deal_points as Record<string, string> | null)?.city ?? null,
    }))

  // Only contacts that have a history
  const contactIds = Object.keys(contactHistory)
  if (!contactIds.length) return NextResponse.json({ contacts: [] })

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .in('id', contactIds)

  if (!contacts?.length) return NextResponse.json({ contacts: [] })

  const warmContacts: WarmContact[] = contacts.map(contact => {
    const history = contactHistory[contact.id]
    const artists = Array.from(history.artistSlugs)
    const confirmedCount = history.confirmedCount
    const dealCount = history.deals.length
    const totalValue = history.totalValue

    // Routing: does this contact's state match any confirmed show's state?
    let routingNote: string | null = null
    if (contact.state) {
      const nearby = confirmedShows.find(s => s.state === contact.state || s.region === contact.region)
      if (nearby) {
        routingNote = `Confirmed show in ${nearby.city ?? nearby.state} on ${nearby.show_date} — routing opportunity`
      }
    }

    // Classify relationship
    let relationship: WarmContact['relationship'] = 'warm'
    let label = 'Past Contact'

    if (confirmedCount >= 2) {
      relationship = 'vip'
      label = `${confirmedCount}x Confirmed Shows`
    } else if (confirmedCount === 1 && artists.length === 1 && artists[0] === 'dirtysnatcha') {
      relationship = 'expansion'
      label = 'DS Show — Expand to Roster'
    } else if (history.deals.some(d => ['offer', 'negotiating'].includes(d.status))) {
      relationship = 'active'
      label = 'Active Negotiation'
    } else if (confirmedCount === 1) {
      relationship = 'warm'
      label = '1 Confirmed Show'
    }

    return {
      id: contact.id,
      name: contact.name,
      company: contact.company,
      email: contact.email,
      city: contact.city,
      state: contact.state,
      region: contact.region,
      market_type: contact.market_type,
      pitch_status: contact.pitch_status,
      notes: contact.notes,
      relationship,
      relationship_label: label,
      artists_pitched: artists,
      deal_count: dealCount,
      confirmed_count: confirmedCount,
      total_value: totalValue,
      routing_note: routingNote,
    }
  }).sort((a, b) => {
    const order = { vip: 0, active: 1, expansion: 2, warm: 3 }
    return order[a.relationship] - order[b.relationship]
  })

  return NextResponse.json({ contacts: warmContacts })
}
