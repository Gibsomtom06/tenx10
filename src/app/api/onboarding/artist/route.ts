import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stageName, legalName, genre, floorGuarantee, artistEmail, artistPhone } = await request.json()

  const { error } = await supabase.from('artists').insert({
    name: legalName || stageName,
    stage_name: stageName,
    genre: genre || null,
    email: artistEmail || null,
    phone: artistPhone || null,
    manager_id: user.id,
    status: 'active',
    bio: null,
    // store floor guarantee in deal_points context — not a direct column yet
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
