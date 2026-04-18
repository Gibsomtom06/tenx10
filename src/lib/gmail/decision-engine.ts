import type { ParsedOffer } from './parse-offer'

export interface DecisionStep {
  step: number
  name: string
  pass: boolean | null // null = insufficient data
  detail: string
}

export interface CounterOffer {
  guarantee: number
  radiusClause: string
  paymentTerms: string
  hotelBuyout: string | null
}

export interface DecisionResult {
  steps: DecisionStep[]
  recommendation: 'accept' | 'counter' | 'decline'
  reasoning: string
  counter: CounterOffer | null
}

export interface ArtistContext {
  name: string
  minimumGuarantee: number
  homeCity?: string
  existingDates: string[]
}

// DSR platform defaults — artist-level overrides take precedence
const CPT_TARGET = 5
const CPT_KILL = 8
const MIN_MARKETING = 150
const SELL_THROUGH_RATE = 0.6

export function runDecisionEngine(offer: ParsedOffer, artist: ArtistContext): DecisionResult {
  const steps: DecisionStep[] = []

  // Step 1: Floor guarantee
  const guarantee = offer.guarantee ?? 0
  const floorPass = offer.guarantee !== null ? guarantee >= artist.minimumGuarantee : null
  steps.push({
    step: 1,
    name: 'Floor Guarantee',
    pass: floorPass,
    detail: offer.guarantee === null
      ? 'No guarantee amount stated in offer'
      : floorPass
        ? `$${guarantee.toLocaleString()} offer meets $${artist.minimumGuarantee.toLocaleString()} floor`
        : `$${guarantee.toLocaleString()} is below $${artist.minimumGuarantee.toLocaleString()} floor — must counter`,
  })

  // Step 2: Market viability
  const cap = offer.venueCapacity
  let marketPass: boolean | null = cap !== null ? cap >= 100 : null
  let marketDetail = cap === null
    ? 'No venue capacity in offer — request before evaluating'
    : cap >= 500
      ? `Large room (${cap} cap) in ${offer.venueCity ?? 'market'} — strong draw potential`
      : cap >= 200
        ? `Mid-size room (${cap} cap) — viable market`
        : cap >= 100
          ? `Small room (${cap} cap) — verify ticket history with promoter`
          : `Micro venue (${cap} cap) — below minimum viable threshold`
  steps.push({ step: 2, name: 'Market Viability', pass: marketPass, detail: marketDetail })

  // Step 3: CPT projection
  let cptPass: boolean | null = null
  let cptDetail = 'Need both venue capacity and ad spend commitment to project CPT'
  if (offer.marketingCommitment !== null && cap !== null && cap > 0) {
    const projected = Math.floor(cap * SELL_THROUGH_RATE)
    const cpt = offer.marketingCommitment / projected
    cptPass = cpt < CPT_TARGET
    cptDetail = cpt < CPT_TARGET
      ? `Est. CPT $${cpt.toFixed(2)} — below $${CPT_TARGET} target (${projected} tickets @ $${offer.marketingCommitment} ad spend)`
      : cpt < CPT_KILL
        ? `Est. CPT $${cpt.toFixed(2)} — above target, below $${CPT_KILL} kill. Counter: require more ad spend.`
        : `Est. CPT $${cpt.toFixed(2)} — EXCEEDS $${CPT_KILL} KILL THRESHOLD. Require significantly more ad spend or decline.`
  } else if (offer.marketingCommitment === null) {
    cptDetail = 'No ad spend committed by promoter — must require in counter'
  }
  steps.push({ step: 3, name: 'Cost Per Ticket (CPT)', pass: cptPass, detail: cptDetail })

  // Step 4: Calendar & routing
  let calendarPass: boolean | null = null
  let calendarDetail = offer.showDate ? 'No existing dates to check against' : 'No show date in offer'
  if (offer.showDate && artist.existingDates.length > 0) {
    const offerMs = new Date(offer.showDate).getTime()
    const conflicts = artist.existingDates.filter(d => {
      const diffDays = Math.abs((offerMs - new Date(d).getTime()) / 86400000)
      return diffDays < 2
    })
    calendarPass = conflicts.length === 0
    calendarDetail = conflicts.length > 0
      ? `Date conflict: existing show(s) within 2 days of ${offer.showDate}`
      : `No conflicts on ${offer.showDate}`
  } else if (offer.showDate) {
    calendarPass = true
  }
  steps.push({ step: 4, name: 'Calendar & Routing', pass: calendarPass, detail: calendarDetail })

  // Step 5: Promoter credibility
  const hasPromoterInfo = offer.promoterName || offer.promoterCompany || offer.promoterEmail
  steps.push({
    step: 5,
    name: 'Promoter Credibility',
    pass: null,
    detail: hasPromoterInfo
      ? `${offer.promoterName ?? offer.promoterCompany} — no grade on file. Verify rep before confirming.`
      : 'No promoter info in offer — request name, company, references',
  })

  // Step 6: Marketing commitment
  const mkt = offer.marketingCommitment
  const mktPass = mkt !== null ? mkt >= MIN_MARKETING : null
  steps.push({
    step: 6,
    name: 'Marketing Commitment',
    pass: mktPass,
    detail: mkt === null
      ? `No ad spend committed in writing — minimum $${MIN_MARKETING} required`
      : mktPass
        ? `$${mkt} ad spend committed — meets $${MIN_MARKETING} minimum`
        : `$${mkt} ad spend is below $${MIN_MARKETING} minimum — must counter`,
  })

  // Recommendation logic
  const hardFails = steps.filter(s => s.pass === false)
  const totalPasses = steps.filter(s => s.pass === true).length

  let recommendation: 'accept' | 'counter' | 'decline'
  let reasoning: string

  const farBelowFloor = offer.guarantee !== null && guarantee < artist.minimumGuarantee * 0.5
  if (farBelowFloor && hardFails.length >= 3) {
    recommendation = 'decline'
    reasoning = `Offer at $${guarantee.toLocaleString()} is less than 50% of floor with ${hardFails.length} critical failures. Not worth countering.`
  } else if (hardFails.length === 0 && totalPasses >= 4) {
    recommendation = 'accept'
    reasoning = 'All critical criteria met. Accept or counter on terms only (radius, payment timing).'
  } else {
    recommendation = 'counter'
    const issues = hardFails.map(s => s.name).join(', ')
    reasoning = `Counter needed${issues ? ` on: ${issues}` : ''}. ${hardFails.length} step(s) failed, ${steps.filter(s => s.pass === null).length} need more data.`
  }

  const isTravel = artist.homeCity && offer.venueCity &&
    offer.venueCity.toLowerCase() !== artist.homeCity.toLowerCase()

  const counter: CounterOffer | null = recommendation !== 'decline' ? {
    guarantee: Math.max(guarantee, artist.minimumGuarantee),
    radiusClause: '90-day / 150-mile radius clause required',
    paymentTerms: '50% deposit within 5 business days of signing. Balance due night of show before set time.',
    hotelBuyout: isTravel ? '1 hotel room, 1 night — hotel buyout or direct booking required' : null,
  } : null

  return { steps, recommendation, reasoning, counter }
}
