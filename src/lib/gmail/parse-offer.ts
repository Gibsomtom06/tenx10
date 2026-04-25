import { groqChat, GROQ_FAST_MODEL } from '@/lib/groq/client'

export interface ParsedOffer {
  artistName: string | null
  venueName: string | null
  venueCity: string | null
  venueState: string | null
  venueCapacity: number | null
  showDate: string | null
  guarantee: number | null
  dealType: 'flat' | 'vs' | 'bonus' | null
  backendPercent: number | null
  promoterName: string | null
  promoterEmail: string | null
  promoterCompany: string | null
  marketingCommitment: number | null
  depositAmount: number | null
  notes: string
}

export async function parseBookingOffer(subject: string, body: string): Promise<ParsedOffer> {
  const text = await groqChat([
    {
      role: 'system',
      content: 'You extract structured booking offer data from emails. Return ONLY valid JSON, no markdown, no explanation, no code fences.',
    },
    {
      role: 'user',
      content: `Extract booking offer details from this email. Return JSON with these exact keys:
{
  "artistName": string | null,
  "venueName": string | null,
  "venueCity": string | null,
  "venueState": string | null,
  "venueCapacity": number | null,
  "showDate": string | null,
  "guarantee": number | null,
  "dealType": "flat" | "vs" | "bonus" | null,
  "backendPercent": number | null,
  "promoterName": string | null,
  "promoterEmail": string | null,
  "promoterCompany": string | null,
  "marketingCommitment": number | null,
  "depositAmount": number | null,
  "notes": string
}

showDate must be ISO format YYYY-MM-DD. guarantee is a number (no $ sign). marketingCommitment is any ad spend dollar amount mentioned.

Subject: ${subject}
Body:
${body}`,
    },
  ], GROQ_FAST_MODEL)

  try {
    return JSON.parse(text) as ParsedOffer
  } catch {
    return {
      artistName: null, venueName: null, venueCity: null, venueState: null,
      venueCapacity: null, showDate: null, guarantee: null, dealType: null,
      backendPercent: null, promoterName: null, promoterEmail: null,
      promoterCompany: null, marketingCommitment: null, depositAmount: null,
      notes: 'Parse failed — review raw email manually',
    }
  }
}

export function extractEmailText(payload: any): string {
  if (!payload) return ''

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64url').toString('utf-8')
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64url').toString('utf-8')
      }
    }
    for (const part of payload.parts) {
      const nested = extractEmailText(part)
      if (nested) return nested
    }
  }

  return ''
}

export function extractEmailHeader(
  headers: Array<{ name?: string | null; value?: string | null }>,
  name: string
): string {
  return headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''
}
