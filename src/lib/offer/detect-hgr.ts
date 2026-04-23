/**
 * Detect Hotel / Ground / Rider (HGR) inclusion in an offer's notes/deal_points.
 *
 * HGR is industry shorthand for the three non-guarantee comp line items a
 * promoter can throw in to sweeten a deal:
 *   - Hotel  — lodging covered (common for out-of-town headliners)
 *   - Ground — airport pickup / day-of transport
 *   - Rider  — hospitality buyout, food/drink/green room stock
 *
 * Rules:
 *   - Positive hits: "hotel covered/included/provided/buyout", "HGR", "hot ground rider"
 *   - Explicit negative: "no hotel", "hotel not included", "rider declined"
 *   - Buyout flags = still a "yes" (promoter paid cash instead of booking it)
 *
 * Used by:
 *   - /dashboard/contracts (per-contract badge row)
 *   - /artist/pipeline (quick flag per deal)
 *   - /api/gmail/process-offer (stamps deal_points on ingest)
 */

export interface HGRFlags {
  hotel: boolean | null;   // null = not mentioned, true = included, false = explicitly excluded
  ground: boolean | null;
  rider: boolean | null;
  confidence: 'high' | 'medium' | 'low';  // high = unambiguous text match, low = inferred
  raw_excerpts: string[];                  // quoted lines that triggered detection
}

const HOTEL_POS = /\b(hotel|lodging|accommodations?|room)\b.{0,40}\b(included|covered|provided|paid|buyout|reimburs|comp)\b/i;
const HOTEL_NEG = /\b(no|without|not\s+(?:including|provided))\s+hotel\b|\bhotel:\s*no\b|\bhotel\s+not\s+(?:included|provided|covered)\b/i;
const HOTEL_BUYOUT = /\$\d+\s+hotel\s+buyout|hotel\s+buyout\s+\$?\d+/i;

const GROUND_POS = /\b(ground|transport|airport|shuttle|car\s+service|uber\s+credits?|ride\s+(?:to|from)\s+(?:hotel|airport|venue))\b.{0,40}\b(included|covered|provided|paid|reimburs|comp)\b|\bground:\s*(?:yes|included|comped)\b|ground\s+covered/i;
const GROUND_NEG = /\bno\s+ground\b|\bground:\s*no\b|\bground\s+not\s+(?:included|provided)\b/i;

const RIDER_POS = /\b(rider|hospitality|catering|food.{0,20}(?:buyout|comp|included)|drink.{0,20}(?:buyout|comp|included)|green\s+room\s+stock)\b.{0,40}(?:included|covered|provided|stocked|buyout|\$\d+)|\$\d+\s+(?:rider|hospitality|food)\s+buyout|food[,\s]+drink|\bper\s+artist\s+in\s+lieu\s+of\s+rider/i;
const RIDER_NEG = /\bno\s+(?:rider|hospitality|catering)\b|\brider\s+declined\b|\brider:\s*no\b/i;

// "HGR" as an acronym appears in promoter emails frequently — treat as "all three included"
const HGR_ACRONYM = /\+\s*HGR\b|\bHGR\s+(?:included|covered|provided)\b|\bwith\s+HGR\b/i;

function testWithExcerpt(text: string, rx: RegExp): { hit: boolean; excerpt: string | null } {
  const m = text.match(rx);
  if (!m) return { hit: false, excerpt: null };
  // Capture ~60 chars of context around the hit
  const idx = m.index ?? 0;
  const start = Math.max(0, idx - 10);
  const end = Math.min(text.length, idx + m[0].length + 20);
  return { hit: true, excerpt: text.slice(start, end).trim() };
}

/**
 * Detect HGR inclusion in free-form offer text.
 * Text sources (pass all concatenated): deal.notes, deal_points.notes, contract.body
 */
export function detectHGR(text: string | null | undefined): HGRFlags {
  if (!text || !text.trim()) {
    return { hotel: null, ground: null, rider: null, confidence: 'low', raw_excerpts: [] };
  }

  const excerpts: string[] = [];
  const hgrMatch = testWithExcerpt(text, HGR_ACRONYM);
  if (hgrMatch.hit) excerpts.push(hgrMatch.excerpt!);

  // Hotel
  const hotelBuyout = testWithExcerpt(text, HOTEL_BUYOUT);
  const hotelNeg = testWithExcerpt(text, HOTEL_NEG);
  const hotelPos = testWithExcerpt(text, HOTEL_POS);
  let hotel: boolean | null = null;
  if (hotelNeg.hit) { hotel = false; excerpts.push(hotelNeg.excerpt!); }
  else if (hotelBuyout.hit) { hotel = true; excerpts.push(hotelBuyout.excerpt!); }
  else if (hotelPos.hit) { hotel = true; excerpts.push(hotelPos.excerpt!); }
  else if (hgrMatch.hit) { hotel = true; }

  // Ground
  const groundNeg = testWithExcerpt(text, GROUND_NEG);
  const groundPos = testWithExcerpt(text, GROUND_POS);
  let ground: boolean | null = null;
  if (groundNeg.hit) { ground = false; excerpts.push(groundNeg.excerpt!); }
  else if (groundPos.hit) { ground = true; excerpts.push(groundPos.excerpt!); }
  else if (hgrMatch.hit) { ground = true; }

  // Rider
  const riderNeg = testWithExcerpt(text, RIDER_NEG);
  const riderPos = testWithExcerpt(text, RIDER_POS);
  let rider: boolean | null = null;
  if (riderNeg.hit) { rider = false; excerpts.push(riderNeg.excerpt!); }
  else if (riderPos.hit) { rider = true; excerpts.push(riderPos.excerpt!); }
  else if (hgrMatch.hit) { rider = true; }

  // Confidence grading
  const explicitHits = [hotelPos.hit, hotelNeg.hit, hotelBuyout.hit, groundPos.hit, groundNeg.hit, riderPos.hit, riderNeg.hit].filter(Boolean).length;
  let confidence: HGRFlags['confidence'] = 'low';
  if (hgrMatch.hit || explicitHits >= 2) confidence = 'high';
  else if (explicitHits === 1) confidence = 'medium';

  return { hotel, ground, rider, confidence, raw_excerpts: excerpts };
}

/**
 * Compact one-line summary for display alongside a deal / contract row.
 * Examples: "H G R", "H - -", "no H G R", "unknown"
 */
export function hgrSummary(flags: HGRFlags): string {
  const pieces: string[] = [];
  const mark = (label: string, v: boolean | null) => {
    if (v === true) pieces.push(label);
    else if (v === false) pieces.push('no ' + label.toLowerCase());
    else pieces.push('—');
  };
  mark('H', flags.hotel);
  mark('G', flags.ground);
  mark('R', flags.rider);
  return pieces.join(' ');
}

/** True if at least one of H/G/R is explicitly confirmed included. */
export function hasAnyHGR(flags: HGRFlags): boolean {
  return flags.hotel === true || flags.ground === true || flags.rider === true;
}

/** True if ALL three are explicitly confirmed included (fullest comp). */
export function hasFullHGR(flags: HGRFlags): boolean {
  return flags.hotel === true && flags.ground === true && flags.rider === true;
}
