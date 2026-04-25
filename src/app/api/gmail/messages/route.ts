import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGmailClientWithPersistence } from '@/lib/gmail/oauth'
import { extractEmailHeader } from '@/lib/gmail/parse-offer'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: conn } = await supabase
    .from('gmail_connections')
    .select('access_token, refresh_token')
    .eq('user_id', user.id)
    .single()

  if (!conn) return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 })

  const gmail = getGmailClientWithPersistence(user.id, conn.access_token, conn.refresh_token, supabase)

  const { data: list } = await gmail.users.messages.list({
    userId: 'me',
    q: 'label:inbox',
    maxResults: 20,
  })

  if (!list.messages?.length) return NextResponse.json({ messages: [] })

  const messages = await Promise.all(
    list.messages.map(async ({ id }) => {
      const { data } = await gmail.users.messages.get({
        userId: 'me',
        id: id!,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      })
      const headers = data.payload?.headers ?? []
      return {
        id: data.id,
        subject: extractEmailHeader(headers, 'Subject') || '(no subject)',
        from: extractEmailHeader(headers, 'From'),
        date: extractEmailHeader(headers, 'Date'),
        snippet: data.snippet ?? '',
        isLikelyOffer: isBookingOffer(
          extractEmailHeader(headers, 'Subject'),
          data.snippet ?? ''
        ),
      }
    })
  )

  return NextResponse.json({ messages })
}

function isBookingOffer(subject: string, snippet: string): boolean {
  const text = `${subject} ${snippet}`.toLowerCase()
  return ['offer', 'booking', 'show', 'gig', 'guarantee', 'venue', 'performance', 'date inquiry']
    .some(kw => text.includes(kw))
}
