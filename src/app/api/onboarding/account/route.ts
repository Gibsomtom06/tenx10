import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fullName, labelName } = await request.json()

  const { error } = await supabase.from('profiles').update({
    full_name: fullName,
    ...(labelName ? { avatar_url: null } : {}), // placeholder — label name goes in separate table later
  }).eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
