import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'
import { createGmailDraft } from '@/lib/gmail/drafts'

export interface ConfirmWorkflowResult {
  advance: {
    subject: string
    body: string
    draftId: string | null
    to: string
    cc: string[]
  }
  announcement: {
    instagramCaption: string
    twitterCaption: string
    hashtags: string[]
  }
  tasks: {
    title: string
    type: string
    due_date: string | null
    description: string
  }[]
  driveFolder: {
    name: string
    subfolders: string[]
    rootUrl: string
  }
}

const DRIVE_ROOT = 'https://drive.google.com/drive/folders/1TQnx4iTH7VgmdSeW9mxloIuLzjMlAgz-'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dealId } = await request.json() as { dealId: string }

  const { data: rawDeal } = await supabase
    .from('deals')
    .select('*, venues(name, city, state, capacity), promoters(name, email, phone)')
    .eq('id', dealId)
    .single()

  if (!rawDeal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  const deal = rawDeal as any

  const { data: gmailConn } = await supabase
    .from('gmail_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const pts = deal.deal_points as Record<string, string | boolean | number> | null
  const city = (pts?.city as string) ?? (deal as any).venues?.city ?? 'Unknown City'
  const state = (pts?.state as string) ?? (deal as any).venues?.state ?? ''
  const venueName = (pts?.venue as string) ?? (deal as any).venues?.name ?? 'TBD'
  const showDate = deal.show_date ?? 'TBD'
  const joinedPromoter = (deal as any).promoters as { name: string; email: string | null; phone: string | null } | null
  const promoterEmail = (pts?.promoterEmail as string) ?? joinedPromoter?.email ?? ''
  const promoterName = (pts?.promoterName as string) ?? (pts?.promoter as string) ?? joinedPromoter?.name ?? 'Promoter'
  const support = (pts?.support as string) ?? ''
  const offerAmount = deal.offer_amount ?? 0
  const hotelIncluded = (pts?.hotel as boolean) ?? false
  const groundIncluded = (pts?.ground as boolean) ?? false
  const riderIncluded = (pts?.rider as boolean) ?? true
  const flightIncluded = (pts?.flight as boolean) ?? false

  const showDateFormatted = showDate !== 'TBD'
    ? new Date(showDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    : 'TBD'

  // Drive folder naming: [MM.DD.YYYY] [City, State] - [Venue Name]
  const folderName = showDate !== 'TBD'
    ? `[${showDateFormatted.replace(/\//g, '.')}] ${city}${state ? `, ${state}` : ''} - ${venueName}`
    : `${city}${state ? `, ${state}` : ''} - ${venueName}`

  // ── Generate advance email ────────────────────────────────────────────────
  const advanceResponse = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1200,
    system: `You are Thomas Nalian, manager of DirtySnatcha Records. Write professional show advance emails.
Use the exact format from the DirtySnatcha advance email template. Be specific with the details provided.
Only include sections for items that are confirmed in the deal (hotel, ground transport, flight).
Delete any sections not applicable to this deal.`,
    messages: [{
      role: 'user',
      content: `Generate the advance email for this confirmed show.

SHOW DETAILS:
Artist: DirtySnatcha (Lee Bray / Leigh Bray)
Date: ${showDateFormatted}
City: ${city}${state ? `, ${state}` : ''}
Venue: ${venueName}
Guarantee: $${offerAmount.toLocaleString()}
Promoter: ${promoterName}${promoterEmail ? ` <${promoterEmail}>` : ''}
Support artists: ${support || 'None confirmed yet'}
Hotel included: ${hotelIncluded ? 'YES' : 'NO'}
Ground transport included: ${groundIncluded ? 'YES' : 'NO'}
Rider included: ${riderIncluded ? 'YES' : 'NO'}
Flights/travel included: ${flightIncluded ? 'YES' : 'NO'}
Booking agent for this show: Andrew @ AB Touring <andrew@abtouring.com>

Write the advance email body using this template structure:
- Open: "Hey team,"
- Reference attached rider (if rider included)
- Request ticket forwarding to ticketsales@dirtysnatcha.com
- Assets link: https://drive.google.com/drive/folders/1LU5mYuipgEQYHN1Osae_ofuvZo7pK8PK
- Blank ROS table with blank fields for the promoter to fill in: Doors, Sound Check, Support set times, DirtySnatcha set time
- Blank field for Promoter Day of Show contact (primary, hospitality${groundIncluded ? ', ground transport' : ''})
${hotelIncluded ? '- Blank Hotel info section: Name for hotel, Hotel Address, Confirmation #' : '- NO hotel section (not included in deal)'}
${flightIncluded ? '- Blank flight info section' : '- DirtySnatcha is driving (remove flights section)'}
- End signature: Thomas Nalian, DirtySnatcha Records, 248-765-1997

Write the email body only. Do not include the subject line.`,
    }],
  })

  const advanceBody = advanceResponse.content[0].type === 'text' ? advanceResponse.content[0].text : ''
  const advanceSubject = `${showDateFormatted} Advance - DirtySnatcha ${city}`

  const cc = [
    'contact@dirtysnatcha.com',
    'andrew@abtouring.com',
  ]

  let draftId: string | null = null
  if (gmailConn && promoterEmail) {
    try {
      const draft = await createGmailDraft({
        to: promoterEmail,
        subject: advanceSubject,
        body: advanceBody,
        cc,
        accessToken: gmailConn.access_token,
        refreshToken: gmailConn.refresh_token ?? undefined,
      })
      draftId = draft.id ?? null
    } catch {
      // Draft creation failed — return the email anyway
    }
  }

  // ── Generate show announcement ────────────────────────────────────────────
  const announcementResponse = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    system: `You are X, content writer for DirtySnatcha.
Voice: raw, hype, unapologetic. Heavy emojis: 🔥 ‼️ 🙏. All caps for emphasis. Short punchy lines.
NEVER corporate. Examples: "CONFIRMED 🔥🔥 [City] let's go ‼️" or "We pulling up to [venue] [date] 🙏🔥"
The tagline is: PLAY SOME F*CKING DUBSTEP ‼️`,
    messages: [{
      role: 'user',
      content: `Generate 2 show announcement captions for:
Artist: DirtySnatcha
City: ${city}${state ? `, ${state}` : ''}
Venue: ${venueName}
Date: ${showDateFormatted}
Support: ${support || 'TBA'}

Write:
1. Instagram caption (3-5 lines, with ticket CTA "link in bio")
2. Twitter/X caption (under 280 chars, punchy)
3. Hashtags array for Instagram (10 relevant tags)

Respond with JSON: {"instagram": "...", "twitter": "...", "hashtags": ["..."]}`,
    }],
  })

  const announcementRaw = announcementResponse.content[0].type === 'text' ? announcementResponse.content[0].text.trim() : '{}'
  let announcement = { instagram: '', twitter: '', hashtags: [] as string[] }
  try { announcement = JSON.parse(announcementRaw) } catch { /* continue */ }

  // ── Create tasks for the show ────────────────────────────────────────────
  const showDateObj = showDate !== 'TBD' ? new Date(showDate) : null
  const daysOut = showDateObj ? Math.floor((showDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 30

  const dueDateOffset = (days: number) => {
    if (!showDateObj) return null
    const d = new Date(showDateObj)
    d.setDate(d.getDate() - days)
    return d.toISOString().split('T')[0]
  }

  const tasksToCreate = [
    { title: 'Get signed contract from promoter', type: 'show', due_date: dueDateOffset(21), description: `${promoterName} needs to sign and return the contract for ${city} on ${showDateFormatted}` },
    { title: 'Collect 50% deposit', type: 'show', due_date: dueDateOffset(21), description: `Deposit of $${Math.round(offerAmount * 0.5).toLocaleString()} due from ${promoterName}` },
    { title: 'Get ticket link from promoter', type: 'show', due_date: dueDateOffset(21), description: 'Needed for social announcement and Meta Ads CTA' },
    { title: 'Post show announcement on socials', type: 'promo', due_date: dueDateOffset(21), description: `Announce ${city} show on Instagram + Twitter/X. Captions generated in workflow.` },
    { title: 'Set up Meta Ads [SHOW] campaign', type: 'promo', due_date: dueDateOffset(18), description: `Launch show promo ads for ${city}. Target: bass music fans in ${state || city}. Budget: $50-75 Shazam spike.` },
    { title: `Send advance email to ${promoterName}`, type: 'show', due_date: dueDateOffset(14), description: `Advance sent${draftId ? ' — draft saved to Gmail' : '. Draft needs to be sent from Gmail.'}` },
    { title: 'Confirm hotel / accommodation', type: 'show', due_date: dueDateOffset(10), description: hotelIncluded ? 'Hotel is included — get confirmation # from promoter' : 'Hotel not in deal — book if driving more than 3 hours' },
    { title: 'Confirm set times with promoter', type: 'show', due_date: dueDateOffset(7), description: `Get final ROS: doors, sound check, DirtySnatcha set time` },
    { title: 'Collect balance payment night of show', type: 'show', due_date: showDate !== 'TBD' ? showDate : null, description: `Balance of $${Math.round(offerAmount * 0.5).toLocaleString()} due before DirtySnatcha's set` },
    { title: 'Post day-of show content', type: 'promo', due_date: showDate !== 'TBD' ? showDate : null, description: 'Stories + main feed post day of show. "TONIGHT 🔥" format.' },
  ]

  // Insert tasks into DB
  const { data: artist } = await supabase.from('artists').select('id').limit(1).single()
  if (artist) {
    await supabase.from('tasks').insert(
      tasksToCreate.map(t => ({
        ...t,
        type: t.type as 'show' | 'release' | 'promo' | 'general',
        artist_id: artist.id,
        created_by: user.id,
        status: 'todo' as const,
      }))
    )
  }

  // Update deal with workflow fired flag
  await supabase.from('deals').update({
    notes: (deal.notes ? deal.notes + '\n\n' : '') + `[Confirm workflow fired ${new Date().toLocaleDateString()}]`,
  }).eq('id', dealId)

  const result: ConfirmWorkflowResult = {
    advance: {
      subject: advanceSubject,
      body: advanceBody,
      draftId,
      to: promoterEmail,
      cc,
    },
    announcement: {
      instagramCaption: announcement.instagram,
      twitterCaption: announcement.twitter,
      hashtags: announcement.hashtags,
    },
    tasks: tasksToCreate,
    driveFolder: {
      name: folderName,
      subfolders: [
        '00_CONTROL — offer email, negotiation thread, approval record',
        '01_CONTRACT_&_PAYMENT — contract, deposit, settlement sheet',
        '02_ADVANCE_&_LOGISTICS — advance sheet, all confirmations',
        '03_TRAVEL — flight monitoring, hotel confirmations',
        '04_MARKETING — ad copy, content, spend tracker, FB event',
        '05_TICKETS — ticket tracker, giveaway log',
        '06_SHOW_ASSETS — rider PDF, setlist, press photo + bio',
      ],
      rootUrl: DRIVE_ROOT,
    },
  }

  return NextResponse.json(result)
}
