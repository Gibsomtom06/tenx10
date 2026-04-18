import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params
  const supabase = await createClient()
  const access = await getArtistAccess(supabase)
  if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user } } = await supabase.auth.getUser()

  // Verify this deal belongs to the user's artist
  const { data: deal } = await supabase
    .from('deals')
    .select('artist_id')
    .eq('id', dealId)
    .single()

  if (!deal || deal.artist_id !== access.artistId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const threadId = formData.get('threadId') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'bin'
  const storagePath = `${access.artistId}/${dealId}/${crypto.randomUUID()}.${ext}`

  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('show-attachments')
    .upload(storagePath, bytes, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: attachment } = await supabase
    .from('deal_attachments')
    .insert({
      deal_id: dealId,
      thread_id: threadId ?? undefined,
      filename: file.name,
      mime_type: file.type,
      storage_path: storagePath,
      uploaded_by: user?.id,
    })
    .select()
    .single()

  return NextResponse.json({ attachment })
}
