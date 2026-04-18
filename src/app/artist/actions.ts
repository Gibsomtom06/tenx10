'use server'

import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { revalidatePath } from 'next/cache'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'

export async function updateShowOps(dealId: string, patch: Record<string, unknown>) {
  const supabase = await createClient()
  const access = await getArtistAccess(supabase)
  if (!access) throw new Error('Unauthorized')

  const { data: deal } = await supabase
    .from('deals')
    .select('deal_points, artist_id')
    .eq('id', dealId)
    .single()

  if (!deal || deal.artist_id !== access.artistId) throw new Error('Not found')

  const current = (deal.deal_points as Record<string, unknown>) ?? {}
  const merged = { ...current, ...patch } as import('@/types/database').Json

  await supabase.from('deals').update({ deal_points: merged }).eq('id', dealId)
  revalidatePath('/artist/ops')
  revalidatePath(`/artist/advance/${dealId}`)
}

export async function addThreadMessage(
  threadId: string,
  body: string,
  direction: 'inbound' | 'outbound' | 'internal' = 'internal'
) {
  const supabase = await createClient()
  const access = await getArtistAccess(supabase)
  if (!access) throw new Error('Unauthorized')

  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('deal_messages').insert({
    thread_id: threadId,
    sender_name: access.memberName,
    sender_email: user?.email ?? undefined,
    direction,
    body,
  })

  const { data: thread } = await supabase
    .from('deal_threads')
    .select('deal_id')
    .eq('id', threadId)
    .single()

  if (thread) revalidatePath(`/artist/advance/${thread.deal_id}`)
}

export async function parseAttachment(attachmentId: string) {
  const supabase = await createClient()
  const access = await getArtistAccess(supabase)
  if (!access) throw new Error('Unauthorized')

  const { data: attachment } = await supabase
    .from('deal_attachments')
    .select('*')
    .eq('id', attachmentId)
    .single()

  if (!attachment) throw new Error('Attachment not found')

  const { data: fileData } = await supabase.storage
    .from('show-attachments')
    .download(attachment.storage_path)

  if (!fileData) throw new Error('File not found in storage')

  const bytes = await fileData.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: attachment.mime_type as 'application/pdf', data: base64 },
        } as any,
        {
          type: 'text',
          text: `Extract all booking offer details from this document. Return ONLY valid JSON with these fields (use null for missing):
{
  "city": string|null,
  "state": string|null,
  "venue": string|null,
  "show_date": "YYYY-MM-DD"|null,
  "offer_amount": number|null,
  "promoterName": string|null,
  "promoterEmail": string|null,
  "promoterPhone": string|null,
  "doors": string|null,
  "loadIn": string|null,
  "soundCheck": string|null,
  "setTime": string|null,
  "hotel": boolean|null,
  "hotelName": string|null,
  "depositAmount": string|null,
  "ticketLink": string|null,
  "support": string|null
}`,
        },
      ],
    }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
  let parsed: Record<string, unknown> = {}
  try { parsed = JSON.parse(raw) } catch { /* continue with empty */ }

  await supabase
    .from('deal_attachments')
    .update({ parsed_data: parsed as import('@/types/database').Json })
    .eq('id', attachmentId)

  revalidatePath(`/artist/advance/${attachment.deal_id}`)
  return parsed
}
