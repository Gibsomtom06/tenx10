import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OutreachBriefing } from '@/app/api/outreach/briefing/route'
import type { MarketEstimate } from '@/app/api/outreach/market-estimate/route'
import type { WarmContact } from '@/app/api/outreach/warm-contacts/route'
import type { PitchArtistSlug } from '@/lib/outreach/artist-profiles'

export interface AgentDecisionStep {
  label: string
  pass: boolean | 'warn'
}

export interface AgentOpportunity {
  city: string
  state: string
  artistSlug: string
  artistName: string
  contactId: string | null
  contactName: string | null
  source: 'routing' | 'warm' | 'market'
  estimate?: Pick<MarketEstimate, 'recommendedGuarantee' | 'ticketRange' | 'cptProjection' | 'marketTier' | 'pitchAnchor'>
  steps: AgentDecisionStep[]
  decision: 'approved' | 'skipped'
  skipReason?: string
  pitchType: 'warm' | 'cold'
}

export interface AgentPitch {
  city: string
  state: string
  artistSlug: string
  contactName: string | null
  draftSubject?: string
  dealId?: string | null
  error?: string
}

export interface AgentSummary {
  analyzed: number
  approved: number
  skipped: number
  pitchesGenerated: number
  opportunities: AgentOpportunity[]
  pitches: AgentPitch[]
}

function evaluateOpportunity(
  estimate: MarketEstimate,
  warmContact?: WarmContact | null,
): { skip: boolean; reason?: string; steps: AgentDecisionStep[]; pitchType: 'warm' | 'cold' } {
  const steps: AgentDecisionStep[] = []

  if (estimate.recommendedGuarantee.high < 1500) {
    return {
      skip: true,
      reason: `Below $1,500 guarantee floor (projected max: $${estimate.recommendedGuarantee.high})`,
      steps,
      pitchType: 'cold',
    }
  }
  steps.push({ label: 'Guarantee floor ≥ $1,500', pass: true })

  if (estimate.ticketRange.high < 40 && estimate.marketTier === 'tertiary') {
    return {
      skip: true,
      reason: `Low ticket ceiling (${estimate.ticketRange.high} max) in tertiary market`,
      steps,
      pitchType: 'cold',
    }
  }
  steps.push({ label: `Market viability — ${estimate.marketTier}`, pass: true })

  if (estimate.cptProjection > 8) {
    return {
      skip: true,
      reason: `CPT $${estimate.cptProjection} exceeds $8 kill threshold`,
      steps,
      pitchType: 'cold',
    }
  }
  steps.push({ label: `CPT $${estimate.cptProjection}`, pass: estimate.cptProjection < 5 ? true : 'warn' })

  steps.push({ label: 'Calendar / routing logic', pass: true })

  const isWarm = warmContact?.relationship === 'vip' || warmContact?.relationship === 'active'
  steps.push({ label: isWarm ? 'Warm relationship' : 'Cold outreach', pass: isWarm ? true : 'warn' })

  steps.push({ label: 'Marketing commitment — verify in pitch response', pass: 'warn' })

  return { skip: false, steps, pitchType: isWarm ? 'warm' : 'cold' }
}

interface Candidate {
  city: string
  state: string
  artistSlug: PitchArtistSlug
  artistName: string
  contactId: string | null
  contactName: string | null
  source: 'routing' | 'warm' | 'market'
}

function extractCandidates(briefing: OutreachBriefing): Candidate[] {
  const seen = new Set<string>()
  const results: Candidate[] = []

  function add(c: Candidate) {
    const key = `${c.city.toLowerCase()}-${c.artistSlug}`
    if (seen.has(key)) return
    seen.add(key)
    results.push(c)
  }

  for (const window of briefing.routingWindows ?? []) {
    for (const stop of window.stops ?? []) {
      const promoter = stop.promoters?.find(p => p.contactId) ?? stop.promoters?.[0] ?? null
      add({
        city: stop.city,
        state: stop.state,
        artistSlug: stop.suggestedArtistSlug as PitchArtistSlug,
        artistName: stop.suggestedArtistName,
        contactId: promoter?.contactId ?? null,
        contactName: promoter?.name ?? null,
        source: 'routing',
      })
    }
  }

  for (const alert of briefing.warmAlerts ?? []) {
    add({
      city: alert.city ?? '',
      state: '',
      artistSlug: alert.suggestedArtistSlug as PitchArtistSlug,
      artistName: alert.suggestedArtistName,
      contactId: alert.contactId,
      contactName: alert.contactName,
      source: 'warm',
    })
  }

  for (const market of briefing.newMarkets ?? []) {
    const promoter = market.promoters?.find(p => p.contactId) ?? market.promoters?.[0] ?? null
    add({
      city: market.city,
      state: market.state,
      artistSlug: market.suggestedArtistSlug as PitchArtistSlug,
      artistName: market.suggestedArtistName,
      contactId: promoter?.contactId ?? null,
      contactName: promoter?.name ?? null,
      source: 'market',
    })
  }

  return results
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const body = await request.json() as { artistSlug?: string; maxPitches?: number }
  const maxPitches = body.maxPitches ?? 5

  const origin = new URL(request.url).origin
  const cookieHeader = request.headers.get('cookie') ?? ''
  const fetchHeaders = { 'Cookie': cookieHeader, 'Content-Type': 'application/json' }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      const opportunities: AgentOpportunity[] = []
      const pitches: AgentPitch[] = []
      let pitchCount = 0

      try {
        emit({ type: 'status', message: 'Fetching tour routing, warm contacts, and market data...' })

        const [briefingRes, warmRes] = await Promise.all([
          fetch(`${origin}/api/outreach/briefing`, { headers: fetchHeaders }),
          fetch(`${origin}/api/outreach/warm-contacts`, { headers: fetchHeaders }),
        ])

        if (!briefingRes.ok) {
          emit({ type: 'error', message: 'Failed to fetch briefing — check API logs' })
          controller.close()
          return
        }

        const briefing: OutreachBriefing = await briefingRes.json()
        const warmData: { contacts: WarmContact[] } = warmRes.ok ? await warmRes.json() : { contacts: [] }
        const warmByContactId = new Map(warmData.contacts.map(c => [c.id, c]))

        const candidates = extractCandidates(briefing)

        emit({
          type: 'status',
          message: `Briefing loaded — ${candidates.length} opportunities identified. Running 6-step analysis...`,
        })

        for (const candidate of candidates) {
          if (pitchCount >= maxPitches && opportunities.filter(o => o.decision === 'approved').length > 0) break

          emit({
            type: 'status',
            message: `Evaluating ${candidate.city}${candidate.state ? `, ${candidate.state}` : ''} (${candidate.artistName})...`,
          })

          // Fetch market estimate
          let estimate: MarketEstimate | null = null
          try {
            const estRes = await fetch(`${origin}/api/outreach/market-estimate`, {
              method: 'POST',
              headers: fetchHeaders,
              body: JSON.stringify({
                artistSlug: candidate.artistSlug,
                city: candidate.city,
                state: candidate.state || 'US',
              }),
            })
            if (estRes.ok) estimate = await estRes.json()
          } catch {
            // continue without estimate — will likely skip
          }

          if (!estimate) {
            const skipped: AgentOpportunity = {
              ...candidate,
              steps: [],
              decision: 'skipped',
              skipReason: 'Market estimate unavailable',
              pitchType: 'cold',
            }
            opportunities.push(skipped)
            emit({ type: 'skip', data: skipped })
            continue
          }

          const warmContact = candidate.contactId ? warmByContactId.get(candidate.contactId) ?? null : null
          const evaluation = evaluateOpportunity(estimate, warmContact)

          const opportunity: AgentOpportunity = {
            ...candidate,
            estimate: {
              recommendedGuarantee: estimate.recommendedGuarantee,
              ticketRange: estimate.ticketRange,
              cptProjection: estimate.cptProjection,
              marketTier: estimate.marketTier,
              pitchAnchor: estimate.pitchAnchor,
            },
            steps: evaluation.steps,
            decision: evaluation.skip ? 'skipped' : 'approved',
            skipReason: evaluation.reason,
            pitchType: evaluation.pitchType,
          }

          opportunities.push(opportunity)

          if (evaluation.skip) {
            emit({ type: 'skip', data: opportunity })
            continue
          }

          emit({ type: 'opportunity', data: opportunity })

          // Generate pitch if we have a contactId and haven't hit the limit
          if (candidate.contactId && pitchCount < maxPitches) {
            emit({
              type: 'status',
              message: `Generating ${evaluation.pitchType} pitch for ${candidate.city}...`,
            })

            try {
              const pitchRes = await fetch(`${origin}/api/outreach/generate-pitch`, {
                method: 'POST',
                headers: fetchHeaders,
                body: JSON.stringify({
                  contactId: candidate.contactId,
                  artistSlug: candidate.artistSlug,
                  notes: `Auto-generated by Booking Agent. Source: ${candidate.source} opportunity. ${estimate.pitchAnchor}`,
                }),
              })

              const pitchData = await pitchRes.json()

              if (pitchRes.status === 409) {
                const pitch: AgentPitch = {
                  city: candidate.city,
                  state: candidate.state,
                  artistSlug: candidate.artistSlug,
                  contactName: candidate.contactName,
                  error: 'Already pitched to this contact recently (30-day window)',
                }
                pitches.push(pitch)
                emit({ type: 'pitch', data: pitch })
              } else if (!pitchRes.ok) {
                const pitch: AgentPitch = {
                  city: candidate.city,
                  state: candidate.state,
                  artistSlug: candidate.artistSlug,
                  contactName: candidate.contactName,
                  error: pitchData.error ?? 'Pitch generation failed',
                }
                pitches.push(pitch)
                emit({ type: 'pitch', data: pitch })
              } else {
                pitchCount++
                const pitch: AgentPitch = {
                  city: candidate.city,
                  state: candidate.state,
                  artistSlug: candidate.artistSlug,
                  contactName: candidate.contactName,
                  draftSubject: pitchData.draft?.subject,
                  dealId: pitchData.dealId,
                }
                pitches.push(pitch)
                emit({ type: 'pitch', data: pitch })
              }
            } catch {
              const pitch: AgentPitch = {
                city: candidate.city,
                state: candidate.state,
                artistSlug: candidate.artistSlug,
                contactName: candidate.contactName,
                error: 'Pitch request failed',
              }
              pitches.push(pitch)
              emit({ type: 'pitch', data: pitch })
            }
          }
        }

        const summary: AgentSummary = {
          analyzed: opportunities.length,
          approved: opportunities.filter(o => o.decision === 'approved').length,
          skipped: opportunities.filter(o => o.decision === 'skipped').length,
          pitchesGenerated: pitchCount,
          opportunities,
          pitches,
        }

        emit({ type: 'done', data: summary })
      } catch (err) {
        emit({ type: 'error', message: err instanceof Error ? err.message : 'Agent encountered an unexpected error' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
