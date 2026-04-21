/**
 * Gigwell Scraper — headless, credential-based, API-interception strategy
 *
 * Usage:
 *   npx tsx scripts/scrape-gigwell.ts --artist dirtysnatcha
 *   npx tsx scripts/scrape-gigwell.ts --artist whoisee
 *
 * Requires in .env.local:
 *   GIGWELL_EMAIL_DIRTYSNATCHA=your@email.com
 *   GIGWELL_PASS_DIRTYSNATCHA=yourpassword
 *   GIGWELL_EMAIL_WHOISEE=walter@email.com
 *   GIGWELL_PASS_WHOISEE=password
 */

import { chromium, type Page, type BrowserContext } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// ── CLI args ──────────────────────────────────────────────────────────────────
const artistArg =
  process.argv.find(a => a.startsWith('--artist='))?.split('=')[1] ??
  (process.argv.indexOf('--artist') !== -1
    ? process.argv[process.argv.indexOf('--artist') + 1]
    : 'dirtysnatcha')

const ARTIST_SLUG = artistArg.toLowerCase().replace(/\s+/g, '-')
const OUTPUT_DIR  = path.join(process.cwd(), 'scripts')
const OUTPUT_FILE = path.join(OUTPUT_DIR, `gigwell-data-${ARTIST_SLUG}.json`)
const COOKIE_FILE = path.join(OUTPUT_DIR, `gigwell-cookies-${ARTIST_SLUG}.json`)

const GIGWELL_BASE = 'https://book.gigwell.com'

// ── Types ─────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

interface GigwellBooking {
  gigwellId?: string
  title?: string
  artist?: string
  date?: string
  city?: string
  state?: string
  venue?: string
  capacity?: number | null
  guarantee?: number | null
  status?: string
  promoter?: string
  promoterEmail?: string
  promoterPhone?: string
  notes?: string
}

interface GigwellContact {
  gigwellId?: string
  name?: string
  company?: string
  email?: string
  phone?: string
  city?: string
  state?: string
  role?: string
}

interface GigwellVenue {
  gigwellId?: string
  name?: string
  city?: string
  state?: string
  capacity?: number | null
  address?: string
  contact?: string
  email?: string
  phone?: string
}

interface ScrapedData {
  scrapedAt: string
  artistSlug: string
  bookings: GigwellBooking[]
  contacts: GigwellContact[]
  venues: GigwellVenue[]
}

// ── Cookie helpers ────────────────────────────────────────────────────────────
async function loadCookies(ctx: BrowserContext) {
  if (fs.existsSync(COOKIE_FILE)) {
    try {
      const raw = fs.readFileSync(COOKIE_FILE, 'utf-8')
      await ctx.addCookies(JSON.parse(raw))
      console.log(`✓ Restored cookies from ${path.basename(COOKIE_FILE)}`)
    } catch { /* non-fatal */ }
  }
}

async function saveCookies(ctx: BrowserContext) {
  try {
    const cookies = await ctx.cookies()
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2))
    console.log('✓ Session cookies saved')
  } catch { /* non-fatal */ }
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function ensureLoggedIn(ctx: BrowserContext, email: string, password: string) {
  const page = await ctx.newPage()
  await page.goto(`${GIGWELL_BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await sleep(1500)

  const url = page.url()
  const isLoginPage = url.includes('/login') || url.includes('/sign') || url.includes('/auth')
    || await page.locator('input[placeholder="Email"], input[type="email"]').isVisible().catch(() => false)

  if (isLoginPage) {
    console.log('  Logging in with email/password...')
    try {
      // Fill email — Gigwell uses placeholder "Email"
      await page.locator('input[placeholder="Email"], input[type="email"]').fill(email, { timeout: 8000 })
      await sleep(400)
      // Fill password
      await page.locator('input[placeholder="Password"], input[type="password"]').fill(password, { timeout: 8000 })
      await sleep(400)
      // Click "LOGIN WITH EMAIL" button
      await page.locator('button:has-text("LOGIN WITH EMAIL"), button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")').first().click({ timeout: 8000 })
      // Wait for navigation away from login
      await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 20000 })
      await page.waitForLoadState('load', { timeout: 15000 })
      await sleep(2000)
      console.log(`  ✓ Logged in — now at: ${page.url()}`)
    } catch (e) {
      await page.screenshot({ path: 'scripts/gigwell-login-debug.png' })
      console.error('  ✗ Login failed — debug screenshot saved:', e)
    }
  } else {
    console.log(`  ✓ Already authenticated (${url})`)
  }

  await page.close()
}

// ── API response interceptor ──────────────────────────────────────────────────
interface Intercepted {
  bookings: AnyRecord[]
  contacts: AnyRecord[]
  venues: AnyRecord[]
  raw: { url: string; data: unknown }[]
}

function attachInterceptor(page: Page): Intercepted {
  const result: Intercepted = { bookings: [], contacts: [], venues: [], raw: [] }

  const BOOKING_PAT  = /\/(bookings?|gigs?|shows?|deals?|events?)(\?|\/|$)/i
  const CONTACT_PAT  = /\/(contacts?|promoters?|clients?|people|users?)(\?|\/|$)/i
  const VENUE_PAT    = /\/(venues?|locations?|places?)(\?|\/|$)/i

  page.on('response', async (response) => {
    const url = response.url()
    const ct  = response.headers()['content-type'] ?? ''
    if (!ct.includes('json')) return
    // Skip analytics/tracking/fonts — capture everything else
    if (/google-analytics|gtm\.|segment\.|mixpanel|hotjar|fonts\.|cdn\.jsdelivr/i.test(url)) return

    try {
      const json = await response.json()
      const items: AnyRecord[] = Array.isArray(json)
        ? json
        : (json?.data ?? json?.results ?? json?.items ?? json?.records ?? [])

      if (items.length > 0) {
        result.raw.push({ url, data: json })
        if (BOOKING_PAT.test(url))  result.bookings.push(...items)
        if (CONTACT_PAT.test(url))  result.contacts.push(...items)
        if (VENUE_PAT.test(url))    result.venues.push(...items)
      }
    } catch { /* non-JSON response */ }
  })

  return result
}

// ── Navigate with pagination + tab iteration ──────────────────────────────────
async function navigateAndPaginate(page: Page, startUrl: string) {
  await page.goto(startUrl, { waitUntil: 'load', timeout: 20000 })
  await sleep(3000) // let SPA data load after DOM is ready

  // Click through any [role="tab"] tabs on the page
  try {
    const tabs = page.locator('[role="tab"]')
    const count = await tabs.count()
    for (let i = 0; i < count; i++) {
      try {
        await tabs.nth(i).click({ timeout: 3000 })
        await page.waitForLoadState('load', { timeout: 8000 })
        await sleep(800)
        await paginateCurrentView(page)
      } catch { /* tab may be inactive or removed */ }
    }
  } catch { /* no tabs */ }

  // Final pass on the default view
  await paginateCurrentView(page)
}

async function paginateCurrentView(page: Page) {
  for (let pageNum = 0; pageNum < 50; pageNum++) {
    await sleep(600)

    // Scroll to load lazy content
    await page.evaluate(() => { window.scrollBy(0, window.innerHeight) })
    await sleep(400)

    const nextBtn = page.locator(
      'button[aria-label="Next page"], .pagination-next, button:has-text("Next"), a:has-text("Next")'
    ).first()

    const isDisabled = await nextBtn.isDisabled().catch(() => true)
    const isVisible  = await nextBtn.isVisible().catch(() => false)

    if (!isVisible || isDisabled) break

    try {
      await nextBtn.click({ timeout: 3000 })
      await page.waitForLoadState('load', { timeout: 8000 })
    } catch { break }
  }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// ── Transform raw API records → typed structs ─────────────────────────────────
function toBooking(r: AnyRecord): GigwellBooking {
  const money = (v: unknown) => {
    const n = parseFloat(String(v ?? '').replace(/[$,]/g, ''))
    return isNaN(n) ? null : n
  }
  const int = (v: unknown) => {
    const n = parseInt(String(v ?? '').replace(/,/g, ''), 10)
    return isNaN(n) ? null : n
  }

  // Gigwell nests booking data inside eventDetail
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ed: AnyRecord = (r.eventDetail as AnyRecord) ?? r
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const od: AnyRecord = (r.offerDetail as AnyRecord) ?? {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inv: AnyRecord = (r.invoiceSummary as AnyRecord) ?? {}

  const buyer = Array.isArray(ed.buyers) && ed.buyers.length > 0
    ? String(ed.buyers[0])
    : (ed.buyerTitle ?? undefined)

  return {
    gigwellId:     String(r.inquiryId ?? r.id ?? r._id ?? ''),
    title:         ed.summary ?? ed.description ?? undefined,
    artist:        ed.artistTitle ?? (Array.isArray(ed.artists) ? String(ed.artists[0]) : undefined),
    date:          ed.startDateTime ?? ed.localDate ?? ed.performanceDateTime ?? undefined,
    city:          ed.eventCity ?? ed.city ?? undefined,
    state:         ed.eventState ?? ed.state ?? undefined,
    venue:         ed.venueTitle ?? ed.venue ?? ed.venue_name ?? undefined,
    capacity:      int(ed.capacity ?? ed.venue_capacity),
    guarantee:     money(od.guarantee ?? od.fee ?? od.artistFee ?? inv.totalArtistFee ?? r.guarantee),
    status:        ed.status ?? ed.workflowStatus ?? r.status ?? undefined,
    promoter:      buyer,
    promoterEmail: od.promoterEmail ?? od.buyer_email ?? undefined,
    promoterPhone: od.promoterPhone ?? od.buyer_phone ?? undefined,
    notes:         ed.sharedNotes ?? ed.description ?? r.notes ?? undefined,
  }
}

function toContact(r: AnyRecord): GigwellContact {
  const first = String(r.first_name ?? r.firstname ?? '')
  const last  = String(r.last_name  ?? r.lastname  ?? '')
  const name  = String(r.name ?? r.full_name ?? `${first} ${last}`.trim())
  return {
    gigwellId: String(r.id ?? r._id ?? ''),
    name:      name || undefined,
    company:   r.company ?? r.company_name ?? r.organization ?? undefined,
    email:     r.email ?? undefined,
    phone:     r.phone ?? r.phone_number ?? undefined,
    city:      r.city ?? undefined,
    state:     r.state ?? undefined,
    role:      r.role ?? r.type ?? r.contact_type ?? undefined,
  }
}

function toVenue(r: AnyRecord): GigwellVenue {
  const cap = parseInt(String(r.capacity ?? '').replace(/,/g, ''), 10)
  return {
    gigwellId: String(r.id ?? r._id ?? r.venue_id ?? ''),
    name:      r.name ?? r.venue_name ?? undefined,
    city:      r.city ?? r.venue_city ?? undefined,
    state:     r.state ?? r.venue_state ?? undefined,
    capacity:  isNaN(cap) ? null : cap,
    address:   r.address ?? r.street ?? undefined,
    contact:   r.contact ?? r.contact_name ?? undefined,
    email:     r.email ?? r.contact_email ?? undefined,
    phone:     r.phone ?? r.contact_phone ?? undefined,
  }
}

function dedup<T extends { gigwellId?: string }>(arr: T[], keyFn: (t: T) => string): T[] {
  const seen = new Set<string>()
  return arr.filter(t => {
    const k = keyFn(t)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

// ── Main scrape ───────────────────────────────────────────────────────────────
async function scrapeIdentity(email: string, password: string): Promise<ScrapedData> {
  console.log(`\n  Artist: ${ARTIST_SLUG}`)
  console.log(`  Email:  ${email}\n`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } })

  try {
    await loadCookies(context)
    await ensureLoggedIn(context, email, password)
    await saveCookies(context)

    // ── Discover account ID, entity ID, and auth headers from live requests ──
    const probePage = await context.newPage()
    let accountId    = ''
    let entityId     = ''
    let capturedHeaders: Record<string, string> = {}

    // Capture API requests to api.gigwell.com to extract account/entity IDs and auth headers
    const onRequest = (req: import('playwright').Request) => {
      const url = req.url()
      if (!url.includes('api.gigwell.com') || !url.includes('/calendar')) return

      const hdrs = req.headers()
      // Always update auth headers when we see a calendar request
      if (hdrs.authorization) capturedHeaders = hdrs

      // Extract account ID (always present in URL)
      const accountMatch = url.match(/\/account\/(\d+)\//)
      if (accountMatch) accountId = accountMatch[1]

      // Extract entity ID (filterEntityId param)
      const entityMatch = url.match(/filterEntityId=(\d+)/)
      if (entityMatch) entityId = entityMatch[1]
    }
    probePage.on('request', onRequest)

    await probePage.goto(`${GIGWELL_BASE}/dashboard`, { waitUntil: 'load', timeout: 25000 })
    await sleep(4000)

    // If not dirtysnatcha, switch profiles via the entity switcher dropdown
    if (ARTIST_SLUG !== 'dirtysnatcha' && accountId) {
      console.log(`  → Switching Gigwell profile to ${ARTIST_SLUG}...`)
      // Reset entity tracking so we capture the new entity ID after switch
      accountId = ''
      entityId  = ''

      // Entity switcher: "dirtysnatcha" label near the search bar at top of dashboard
      try {
        // Try clicking the entity/artist name label near the top nav
        const entityLabel = probePage.locator(
          'button:has-text("dirtysnatcha"), [aria-label*="entity"], .entity-select, ' +
          'nav button, header select, [class*="entity"] button, [class*="artist"] button'
        ).first()

        if (await entityLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
          await entityLabel.click()
          await sleep(800)
        } else {
          // Try clicking around top-center where "dirtysnatcha" appeared in screenshot
          await probePage.mouse.click(200, 60)
          await sleep(800)
          await probePage.screenshot({ path: path.join(OUTPUT_DIR, `gigwell-switcher-after-click.png`) })
        }

        // Look for WHOiSEE in dropdown
        const option = probePage.locator('[role="option"], li, button, a, div')
          .filter({ hasText: /WHO\s*i\s*SEE|whoisee/i }).first()

        if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
          await option.click()
          await sleep(2000)
          // Force fresh calendar load by navigating away and back
          entityId = '' // reset to capture new one
          await probePage.goto(`${GIGWELL_BASE}/calendar`, { waitUntil: 'load', timeout: 15000 }).catch(() => {})
          await sleep(2000)
          await probePage.goto(`${GIGWELL_BASE}/dashboard`, { waitUntil: 'load', timeout: 15000 }).catch(() => {})
          await sleep(4000)
          console.log(`  ✓ Switched profile — entity now: ${entityId || 'not yet captured'}`)
        } else {
          await probePage.screenshot({ path: path.join(OUTPUT_DIR, `gigwell-switcher-debug.png`) })
          console.warn(`  ⚠ WHOiSEE option not found — screenshot saved for manual inspection`)
        }
      } catch (e) {
        console.warn('  ⚠ Profile switch failed:', e)
        await probePage.screenshot({ path: path.join(OUTPUT_DIR, `gigwell-switcher-debug.png`) }).catch(() => {})
      }
    }

    await probePage.close()

    if (!accountId) {
      console.warn('  ⚠ Could not auto-detect entity IDs — using known DirtySnatcha values')
      accountId = '818369'
      entityId  = '303789'
    }
    console.log(`  ✓ Account ${accountId} / Entity ${entityId}`)

    console.log(`  Headers captured: ${Object.keys(capturedHeaders).length} (${Object.keys(capturedHeaders).slice(0, 5).join(', ')})`)

    // ── Helper: call Gigwell API using captured auth headers ──────────────────
    async function apiGet(url: string, debug = false): Promise<AnyRecord[]> {
      try {
        const resp = await context.request.get(url, { headers: capturedHeaders })
        if (debug) console.log(`    API ${resp.status()} ${url.substring(0, 100)}`)
        if (!resp.ok()) {
          if (debug) console.log('    Body:', (await resp.text()).substring(0, 200))
          return []
        }
        const json = await resp.json() as { data?: AnyRecord[]; status?: string }
        const items = json?.data
        if (debug) console.log(`    Response keys: ${Object.keys(json as object)}; data length: ${Array.isArray(items) ? items.length : 'not array'}`)
        return Array.isArray(items) ? items : []
      } catch (e) {
        if (debug) console.log('    Error:', e)
        return []
      }
    }

    // ── Direct API harvest ────────────────────────────────────────────────────
    console.log('  → Fetching all bookings via API...')
    const rawBookings: AnyRecord[] = []

    // Try going backwards in 6-month windows from today + 1yr future to 3 years back
    // Gigwell's calendar may only return data for a date window it understands
    const now = new Date()
    const windowStarts: Date[] = []
    // Future: today forward
    windowStarts.push(new Date(now.getFullYear(), now.getMonth(), 1))
    // Past: go back in 6-month increments for 5 years
    for (let i = 1; i <= 10; i++) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i * 6)
      windowStarts.push(d)
    }

    const statusSets = ['confirmed,tentative,blocked', 'cancelled,declined']
    for (const statuses of statusSets) {
      for (const windowStart of windowStarts) {
        const utcStart = windowStart.toISOString()
        const url = `https://api.gigwell.com/api/account/${accountId}/calendar?utcStartDate=${encodeURIComponent(utcStart)}&filterEntityId=${entityId}&limit=200&statuses=${statuses}`
        const batch = await apiGet(url, windowStart === windowStarts[0] && statuses.startsWith('confirmed'))
        rawBookings.push(...batch)
      }
    }
    console.log(`  ✓ ${rawBookings.length} raw booking records fetched`)

    // Contacts — try multiple endpoint variations, debug first attempt
    console.log('  → Fetching contacts via API...')
    const rawContacts: AnyRecord[] = []
    const contactEndpoints = [
      `/contacts`, `/buyers`, `/promoters`, `/roster`, `/clients`,
      `/entities?type=buyer`, `/entities?type=contact`,
    ]
    for (const path_ of contactEndpoints) {
      const url = `https://api.gigwell.com/api/account/${accountId}${path_}?limit=500`
      const batch = await apiGet(url, path_ === '/contacts')
      rawContacts.push(...batch)
    }

    // Fallback: extract unique buyers from bookings
    if (rawContacts.length === 0) {
      console.log('  ℹ Extracting contacts from bookings...')
      const seen = new Set<string>()
      for (const b of rawBookings) {
        const ed = (b.eventDetail as AnyRecord) ?? b
        const buyer = ed.buyerTitle ?? (Array.isArray(ed.buyers) ? ed.buyers[0] : null)
        const buyerId = Array.isArray(ed.buyerEntityIds) ? ed.buyerEntityIds[0] : null
        if (buyer && !seen.has(String(buyer))) {
          seen.add(String(buyer))
          rawContacts.push({ id: buyerId ?? buyer, name: buyer, company: buyer, role: 'buyer' })
        }
      }
    }
    console.log(`  ✓ ${rawContacts.length} raw contact records`)

    // Venues — extract from bookings since API endpoint may differ
    console.log('  → Fetching venues via API...')
    const rawVenues: AnyRecord[] = []
    const venueEndpoints = ['/venues', '/locations', '/entities?type=venue']
    for (const path_ of venueEndpoints) {
      const url = `https://api.gigwell.com/api/account/${accountId}${path_}?limit=500`
      const batch = await apiGet(url, path_ === '/venues')
      rawVenues.push(...batch)
    }

    // Fallback: extract unique venues from bookings
    if (rawVenues.length === 0) {
      console.log('  ℹ Extracting venues from bookings...')
      const seen = new Set<string>()
      for (const b of rawBookings) {
        const ed = (b.eventDetail as AnyRecord) ?? b
        const venueName = ed.venueTitle
        const venueId   = ed.venueEntityId
        if (venueName && !seen.has(String(venueName))) {
          seen.add(String(venueName))
          rawVenues.push({
            id: venueId ?? venueName,
            name: venueName,
            city: ed.eventCity,
            state: ed.eventState,
            capacity: ed.capacity,
          })
        }
      }
    }
    console.log(`  ✓ ${rawVenues.length} raw venue records`)

    // ── Save raw dump ─────────────────────────────────────────────────────────
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `gigwell-raw-${ARTIST_SLUG}.json`),
      JSON.stringify({ bookings: rawBookings, contacts: rawContacts, venues: rawVenues }, null, 2)
    )

    const mainPage = { close: async () => {} } // no separate mainPage needed

    // ── Build typed output ────────────────────────────────────────────────────
    const bookings = dedup(
      rawBookings.map(toBooking).filter(b => b.date || b.venue || b.city),
      b => `${b.gigwellId}|${b.date}|${b.venue}`
    )
    const contacts = dedup(
      rawContacts.map(toContact).filter(c => c.name?.trim()),
      c => `${c.gigwellId}|${c.email}|${c.name}`
    )
    const venues = dedup(
      rawVenues.map(toVenue).filter(v => v.name?.trim()),
      v => `${v.gigwellId}|${v.name}|${v.city}`
    )

    console.log(`\n  ✓ ${bookings.length} bookings | ${contacts.length} contacts | ${venues.length} venues`)

    return {
      scrapedAt: new Date().toISOString(),
      artistSlug: ARTIST_SLUG,
      bookings,
      contacts,
      venues,
    }
  } finally {
    await context.close()
    await browser.close()
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────
async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Gigwell Scraper — ${ARTIST_SLUG}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const envKey = ARTIST_SLUG.toUpperCase().replace(/-/g, '_')
  const email    = process.env[`GIGWELL_EMAIL_${envKey}`]
  const password = process.env[`GIGWELL_PASS_${envKey}`]

  if (!email || !password) {
    console.error(`\n✗ Missing credentials. Add to .env.local:\n`)
    console.error(`  GIGWELL_EMAIL_${envKey}=your@email.com`)
    console.error(`  GIGWELL_PASS_${envKey}=yourpassword\n`)
    process.exit(1)
  }

  try {
    const data = await scrapeIdentity(email, password)
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2))
    console.log(`\n✓ Saved to ${OUTPUT_FILE}`)
    console.log('  Next: npx tsx scripts/import-gigwell.ts --artist', ARTIST_SLUG)
  } catch (err) {
    console.error('\n✗ Scrape failed:', err)
    process.exit(1)
  }
}

main()
