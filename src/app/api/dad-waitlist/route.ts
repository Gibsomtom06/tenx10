import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { email, name, use_case } = await request.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { error } = await supabase.from('dad_waitlist').insert({ email, name, use_case })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ message: "You're already on the list!" }, { status: 200 })
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  return NextResponse.json({ message: 'success' }, { status: 200 })
}
