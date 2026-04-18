/**
 * Gigwell Scraper — pulls all booking data for one artist into gigwell-data-{artist}.json
 *
 * Usage:
 *   npx tsx scripts/scrape-gigwell.ts --artist dirtysnatcha
 *   npx tsx scripts/scrape-gigwell.ts --artist whoisee
 *
 * A browser window opens using your existing Chrome session (Chrome must be closed first).
 * The scraper extracts all bookings, contacts, and venues automatically.
 */

import { chromium } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

// Parse --artist flag, default to dirtysnatcha
const artistArg = process.argv.find(a => a.startsWith('--artist='))?.split('=')[1]
  ?? (process.argv[process.argv.indexOf('--artist') + 1])
  ?? 'dirtysnatcha'

const ARTIST_SLUG = artistArg.toLowerCase().replace(/\s+/g, '-')
const OUTPUT_FILE = path.join(process.cwd(), 'scripts', `gigwell-data-${ARTIST_SLUG}.json`)

function ask(question: string): Promise<string> {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(question, answer => { rl.close(); resolve(answer) })
  })
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

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

async function scrapeBookings(page: import('playwright').Page): Promise<GigwellBooking[]> {
  console.log('  → Navigating to bookings...')
  const bookings: GigwellBooking[] = []

  // Try common Gigwell booking routes
  const bookingPaths = [
    '/bookings',
    '/dashboard/bookings',
    '/gigs',
    '/shows',
  ]

  let loaded = false
  for (const p of bookingPaths) {
    try {
      await page.goto(`https://book.gigwell.com${p}`, { waitUntil: 'networkidle', timeout: 10000 })
      const url = page.url()
      if (url.includes(p) || url.includes('booking') || url.includes('gig')) {
        loaded = true
        break
      }
    } catch { /* try next path */ }
  }

  if (!loaded) {
    console.log('  ⚠ Could not find bookings page automatically — taking screenshot for debugging')
    await page.screenshot({ path: 'scripts/debug-bookings.png' })
    return bookings
  }

  // Handle pagination — keep clicking "next" until done
  let pageNum = 0
  let hasMore = true

  while (hasMore && pageNum < 50) {
    pageNum++
    await sleep(1000)

    // Take a snapshot of the current URL and title for debugging
    console.log(`  → Page ${pageNum}: ${page.url()}`)

    // Try to find booking rows in various table/list formats
    const rows = await page.evaluate(() => {
      const results: GigwellBooking[] = []

      // Try table rows
      const tableRows = document.querySelectorAll('table tbody tr, [class*="booking-row"], [class*="gig-row"], [data-testid*="booking"]')
      tableRows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td, [class*="cell"]'))
        const text = cells.map(c => c.textContent?.trim() ?? '')
        const links = Array.from(row.querySelectorAll('a'))
        const href = links[0]?.getAttribute('href') ?? ''
        const idMatch = href.match(/\/(\d+|[a-f0-9-]{36})\/?$/)

        if (text.some(t => t.length > 0)) {
          results.push({
            gigwellId: idMatch?.[1] ?? undefined,
            title: text[0] || text[1] || undefined,
          })
        }
      })

      // Try card-based layouts
      const cards = document.querySelectorAll('[class*="booking-card"], [class*="gig-card"], [class*="show-card"], [class*="event-card"]')
      cards.forEach(card => {
        const heading = card.querySelector('h1, h2, h3, h4, h5, strong, [class*="title"], [class*="name"]')
        const date = card.querySelector('[class*="date"], time')
        const venue = card.querySelector('[class*="venue"], [class*="location"]')
        results.push({
          title: heading?.textContent?.trim(),
          date: date?.textContent?.trim(),
          venue: venue?.textContent?.trim(),
        })
      })

      return results
    })

    bookings.push(...rows)

    // Try to go to next page
    const nextBtn = await page.$('[aria-label="Next page"], [class*="next"], button:has-text("Next"), a:has-text("Next")')
    if (nextBtn) {
      const disabled = await nextBtn.getAttribute('disabled')
      if (disabled !== null) {
        hasMore = false
      } else {
        await nextBtn.click()
        await sleep(1500)
      }
    } else {
      hasMore = false
    }
  }

  console.log(`  ✓ Found ${bookings.length} booking entries`)
  return bookings
}

async function scrapeContacts(page: import('playwright').Page): Promise<GigwellContact[]> {
  console.log('  → Navigating to contacts...')
  const contacts: GigwellContact[] = []

  const contactPaths = ['/contacts', '/dashboard/contacts', '/promoters', '/clients']
  let loaded = false

  for (const p of contactPaths) {
    try {
      await page.goto(`https://book.gigwell.com${p}`, { waitUntil: 'networkidle', timeout: 10000 })
      if (page.url().includes(p) || page.url().includes('contact')) {
        loaded = true
        break
      }
    } catch { /* try next */ }
  }

  if (!loaded) {
    console.log('  ⚠ Could not find contacts page')
    return contacts
  }

  let pageNum = 0
  let hasMore = true

  while (hasMore && pageNum < 50) {
    pageNum++
    await sleep(1000)

    const rows = await page.evaluate(() => {
      const results: GigwellContact[] = []
      const tableRows = document.querySelectorAll('table tbody tr, [class*="contact-row"]')
      tableRows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'))
        const text = cells.map(c => c.textContent?.trim() ?? '')
        if (text.some(t => t.length > 0)) {
          results.push({ name: text[0], company: text[1], email: text[2], phone: text[3], city: text[4], state: text[5] })
        }
      })

      // Card layout fallback
      const cards = document.querySelectorAll('[class*="contact-card"], [class*="person-card"]')
      cards.forEach(card => {
        const name = card.querySelector('[class*="name"]')?.textContent?.trim()
        const email = card.querySelector('[class*="email"], a[href^="mailto"]')?.textContent?.trim()
        const phone = card.querySelector('[class*="phone"]')?.textContent?.trim()
        if (name) results.push({ name, email, phone })
      })

      return results
    })

    contacts.push(...rows)

    const nextBtn = await page.$('[aria-label="Next page"], button:has-text("Next"), a:has-text("Next")')
    if (nextBtn) {
      const disabled = await nextBtn.getAttribute('disabled')
      if (disabled !== null) hasMore = false
      else { await nextBtn.click(); await sleep(1500) }
    } else {
      hasMore = false
    }
  }

  console.log(`  ✓ Found ${contacts.length} contacts`)
  return contacts
}

async function scrapeVenues(page: import('playwright').Page): Promise<GigwellVenue[]> {
  console.log('  → Navigating to venues...')
  const venues: GigwellVenue[] = []

  const venuePaths = ['/venues', '/dashboard/venues', '/locations']
  let loaded = false

  for (const p of venuePaths) {
    try {
      await page.goto(`https://book.gigwell.com${p}`, { waitUntil: 'networkidle', timeout: 10000 })
      if (page.url().includes(p) || page.url().includes('venue')) {
        loaded = true
        break
      }
    } catch { /* try next */ }
  }

  if (!loaded) {
    console.log('  ⚠ Could not find venues page')
    return venues
  }

  let pageNum = 0
  let hasMore = true

  while (hasMore && pageNum < 20) {
    pageNum++
    await sleep(1000)

    const rows = await page.evaluate(() => {
      const results: GigwellVenue[] = []
      const tableRows = document.querySelectorAll('table tbody tr, [class*="venue-row"]')
      tableRows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'))
        const text = cells.map(c => c.textContent?.trim() ?? '')
        if (text.some(t => t.length > 0)) {
          const capMatch = text.find(t => /^\d{2,5}$/.test(t.replace(/,/g, '')))
          results.push({
            name: text[0],
            city: text[1],
            state: text[2],
            capacity: capMatch ? parseInt(capMatch.replace(/,/g, ''), 10) : null,
          })
        }
      })

      const cards = document.querySelectorAll('[class*="venue-card"]')
      cards.forEach(card => {
        const name = card.querySelector('[class*="name"]')?.textContent?.trim()
        const location = card.querySelector('[class*="location"], [class*="city"]')?.textContent?.trim()
        if (name) results.push({ name, city: location })
      })

      return results
    })

    venues.push(...rows)

    const nextBtn = await page.$('[aria-label="Next page"], button:has-text("Next"), a:has-text("Next")')
    if (nextBtn) {
      const disabled = await nextBtn.getAttribute('disabled')
      if (disabled !== null) hasMore = false
      else { await nextBtn.click(); await sleep(1500) }
    } else {
      hasMore = false
    }
  }

  console.log(`  ✓ Found ${venues.length} venues`)
  return venues
}

async function deepScrapeBooking(page: import('playwright').Page, url: string): Promise<Partial<GigwellBooking>> {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })
    return await page.evaluate(() => {
      const get = (sel: string) => document.querySelector(sel)?.textContent?.trim() ?? undefined

      // Try to extract fields from various possible selectors
      const dateEl = document.querySelector('[class*="date"] time, [data-field="date"], [class*="show-date"]')
      const venueEl = document.querySelector('[class*="venue"], [data-field="venue"]')
      const cityEl = document.querySelector('[class*="city"], [data-field="city"]')
      const stateEl = document.querySelector('[class*="state"], [data-field="state"]')
      const amountEl = document.querySelector('[class*="guarantee"], [class*="amount"], [data-field="guarantee"]')
      const promoterEl = document.querySelector('[class*="promoter"], [class*="buyer"], [data-field="promoter"]')
      const statusEl = document.querySelector('[class*="status"] span, [data-field="status"]')
      const notesEl = document.querySelector('[class*="notes"] p, [data-field="notes"]')

      const amountText = amountEl?.textContent?.trim()
      const amountNum = amountText ? parseFloat(amountText.replace(/[$,]/g, '')) : null

      const capText = document.querySelector('[class*="capacity"]')?.textContent?.trim()
      const capNum = capText ? parseInt(capText.replace(/,/g, ''), 10) : null

      return {
        date: dateEl?.getAttribute('datetime') ?? dateEl?.textContent?.trim(),
        venue: venueEl?.textContent?.trim(),
        city: cityEl?.textContent?.trim(),
        state: stateEl?.textContent?.trim(),
        guarantee: isNaN(amountNum ?? NaN) ? null : amountNum,
        promoter: promoterEl?.textContent?.trim(),
        status: statusEl?.textContent?.trim(),
        notes: notesEl?.textContent?.trim(),
        capacity: isNaN(capNum ?? NaN) ? null : capNum,
      } as Partial<GigwellBooking>
    })
  } catch {
    return {}
  }
}

// Windows Chrome user data directory
const CHROME_USER_DATA = path.join(
  process.env.LOCALAPPDATA ?? 'C:\\Users\\Slash\\AppData\\Local',
  'Google', 'Chrome', 'User Data'
)

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Gigwell Scraper — ${ARTIST_SLUG}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Use a temp profile so we don't conflict with a running Chrome instance
  const tempDir = path.join(process.cwd(), 'scripts', '.chrome-temp')
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

  let browser: import('playwright').Browser | null = null
  let context: import('playwright').BrowserContext

  try {
    context = await chromium.launchPersistentContext(tempDir, {
      channel: 'chrome',
      headless: false,
      slowMo: 50,
      viewport: { width: 1400, height: 900 },
    })
  } catch {
    // Chrome not available — fall back to bundled Chromium
    console.log('Using bundled Chromium (Chrome not available or busy).')
    browser = await chromium.launch({ headless: false, slowMo: 50 })
    context = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  }

  // Restore saved cookies if they exist (from a previous login)
  const cookiesPath = path.join(process.cwd(), 'scripts', `gigwell-cookies-${ARTIST_SLUG}.json`)
  if (fs.existsSync(cookiesPath)) {
    try {
      const saved = JSON.parse(fs.readFileSync(cookiesPath, 'utf-8'))
      await context.addCookies(saved)
      console.log(`✓ Restored saved session from ${path.basename(cookiesPath)}`)
    } catch { /* non-fatal — will need manual login */ }
  }

  const page = await context.newPage()

  console.log('Opening Gigwell...')
  await page.goto('https://book.gigwell.com/dashboard', { waitUntil: 'networkidle', timeout: 30000 })

  // If not logged in, wait for manual login
  const currentUrl = page.url()
  if (currentUrl.includes('login') || currentUrl.includes('sign') || currentUrl.includes('auth')) {
    console.log('\n✋ Not logged in — please log in to Gigwell in the browser window.')
    console.log('   Come back here and press Enter once you\'re on the dashboard.\n')
    await ask('Press Enter when logged in...')
  } else {
    console.log('✓ Already logged in — proceeding with scrape.\n')
    await sleep(1000)
  }

  // Save cookies for future runs (avoids needing to log in again)
  try {
    const cookies = await context.cookies()
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2))
    console.log(`✓ Session saved — future runs won't need login`)
  } catch { /* non-fatal */ }

  console.log('\nStarting data extraction...\n')

  // Take a full-page screenshot of the dashboard for reference
  await page.screenshot({ path: 'scripts/gigwell-dashboard.png', fullPage: true })
  console.log('✓ Dashboard screenshot saved to scripts/gigwell-dashboard.png')

  // Scrape all sections
  const bookings = await scrapeBookings(page)
  const contacts = await scrapeContacts(page)
  const venues = await scrapeVenues(page)

  const data: ScrapedData = {
    scrapedAt: new Date().toISOString(),
    artistSlug: ARTIST_SLUG,
    bookings,
    contacts,
    venues,
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2))
  console.log(`\n✓ Data saved to ${OUTPUT_FILE}`)
  console.log(`  ${bookings.length} bookings`)
  console.log(`  ${contacts.length} contacts`)
  console.log(`  ${venues.length} venues`)
  console.log('\nNext step: run  npx tsx scripts/import-gigwell.ts\n')

  await context.close()
  if (browser) await browser.close()
}

main().catch(err => {
  console.error('Scrape failed:', err)
  process.exit(1)
})
