import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ArtistInput {
  stageName: string
  legalName?: string
  genre?: string
  floorGuarantee?: string
  artistEmail?: string
  artistPhone?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Accept either a single artist (legacy) or an array
  const artistList: ArtistInput[] = Array.isArray(body.artists)
    ? body.artists
    : [{ stageName: body.stageName, legalName: body.legalName, genre: body.genre, floorGuarantee: body.floorGuarantee, artistEmail: body.artistEmail, artistPhone: body.artistPhone }]

  const valid = artistList.filter(a => a.stageName?.trim())
  if (valid.length === 0) return NextResponse.json({ error: 'No valid artists provided' }, { status: 400 })

  const rows = valid.map(a => ({
    name: a.legalName?.trim() || a.stageName.trim(),
    stage_name: a.stageName.trim(),
    genre: a.genre?.trim() || null,
    email: a.artistEmail?.trim() || null,
    phone: a.artistPhone?.trim() || null,
    manager_id: user.id,
    status: 'active' as const,
    bio: null,
  }))

  const { data, error } = await supabase.from('artists').insert(rows).select('id, stage_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, artists: data })
}
