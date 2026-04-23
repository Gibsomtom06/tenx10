#!/usr/bin/env ts-node
/**
 * scripts/bmi-submit-setlist.ts
 *
 * Playwright automation for BMI Live setlist submission.
 * Reads unsubmitted completed shows from Supabase,
 * logs into BMI Live, submits each setlist, marks bmi_submitted = true.
 *
 * Usage:
 *   npx ts-node scripts/bmi-submit-setlist.ts           # all unsubmitted
 *   npx ts-node scripts/bmi-submit-setlist.ts <deal-id> # specific show
 *
 * Env vars required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   BMI_USERNAME
 *   BMI_PASSWORD
 */

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface SetlistTrack {
  title: string
  isrc?: string
  duration_sec?: number
}

interface Deal {
  id: string
  artist_id: string
  title: string
  show_date: string
  setlist: SetlistTrack[] | null
  bmi_submitted: boolean
  venues: { name: string; city: string; state: string } | null
}

async function getUnsubmittedShows(dealId?: string): Promise<Deal[]> {
  let query = supabase
    .from('deals')
    .select('id, artist_id, title, show_date, setlist, bmi_submitted, venues(name, city, state)')
    .eq('status', 'completed')
    .eq('bmi_submitted', false)
    .not('setlist', 'is', null)
    // Only shows within 6-month submission window
    .gte('show_date', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

  if (dealId) {
    query = query.eq('id', dealId)
  }

  const { data, error } = await query
  if (error) throw new Error('Supabase query failed: ' + error.message)
  return (data ?? []) as unknown as Deal[]
}

async function markSubmitted(dealId: string): Promise<void> {
  const { error } = await supabase
    .from('deals')
    .update({ bmi_submitted: true, bmi_submitted_at: new Date().toISOString() })
    .eq('id', dealId)
  if (error) throw new Error('Failed to mark deal submitted: ' + error.message)
}

async function markTaskComplete(dealId: string): Promise<void> {
  await supabase
    .from('tasks')
    .update({ status: 'completed' })
    .eq('deal_id', dealId)
    .eq('type', 'bmi_setlist')
}

async function submitSetlistToBMI(deal: Deal): Promise<void> {
  const username = process.env.BMI_USERNAME
  const password = process.env.BMI_PASSWORD
  if (!username || !password) throw new Error('BMI_USERNAME / BMI_PASSWORD env vars not set')

  const venue = deal.venues
  const tracks = deal.setlist ?? []
  if (tracks.length === 0) {
    console.log('  No tracks in setlist — skipping')
    return
  }

  console.log(`  Launching browser for: ${deal.title} (${deal.show_date})`)
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // ── Step 1: Log in ────────────────────────────────────────
    console.log('  Logging into BMI...')
    await page.goto('https://www.bmi.com/creators/login', { waitUntil: 'networkidle' })
    await page.fill('input[name="username"], input[id="username"], #username', username)
    await page.fill('input[name="password"], input[id="password"], #password', password)
    await page.click('button[type="submit"], input[type="submit"]')
    await page.waitForNavigation({ waitUntil: 'networkidle' })

    // ── Step 2: Navigate to BMI Live ─────────────────────────
    console.log('  Navigating to BMI Live...')
    await page.goto('https://www.bmi.com/creators/royalty/bmi_live', { waitUntil: 'networkidle' })

    // Click "Add a Performance"
    const addBtn = page.locator('text=Add a Performance, text=Report a Performance, text=Add Performance').first()
    await addBtn.waitFor({ timeout: 10000 })
    await addBtn.click()
    await page.waitForLoadState('networkidle')

    // ── Step 3: Fill performance details ─────────────────────
    console.log('  Filling performance details...')

    // Date
    const [month, day, year] = new Date(deal.show_date + 'T12:00:00Z')
      .toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
      .split('/')
    await page.fill('input[name*="date"], input[id*="date"], #performanceDate', `${month}/${day}/${year}`)

    // Venue
    if (venue) {
      await page.fill('input[name*="venue"], input[id*="venue"]', venue.name)
      await page.fill('input[name*="city"], input[id*="city"]', venue.city)
      await page.selectOption('select[name*="state"], select[id*="state"]', venue.state)
    }

    // ── Step 4: Add tracks ────────────────────────────────────
    console.log(`  Adding ${tracks.length} tracks...`)
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]
      if (i > 0) {
        // Click "Add Another Song"
        const addSongBtn = page.locator('text=Add Another Song, text=Add Song, button:has-text("Add")').last()
        if (await addSongBtn.isVisible()) await addSongBtn.click()
      }
      // Fill track title
      const titleInputs = page.locator('input[name*="title"], input[name*="song"], input[placeholder*="song"], input[placeholder*="title"]')
      await titleInputs.nth(i).fill(track.title)
    }

    // ── Step 5: Submit ────────────────────────────────────────
    console.log('  Submitting...')
    const submitBtn = page.locator('button[type="submit"]:has-text("Submit"), button:has-text("Submit Performance")').first()
    await submitBtn.waitFor({ timeout: 5000 })
    await submitBtn.click()
    await page.waitForLoadState('networkidle')

    // Check for success
    const success = await page.locator('text=successfully, text=Success, text=confirmed').first().isVisible().catch(() => false)
    if (success) {
      console.log('  Submitted successfully')
    } else {
      // Take screenshot for debugging
      await page.screenshot({ path: `/tmp/bmi-debug-${deal.id}.png` })
      console.warn('  Could not confirm submission — screenshot saved to /tmp/bmi-debug-' + deal.id + '.png')
    }

  } finally {
    await browser.close()
  }
}

async function main() {
  const dealId = process.argv[2]
  console.log('BMI Setlist Submitter')
  console.log(dealId ? `Target deal: ${dealId}` : 'Processing all unsubmitted shows...')

  const shows = await getUnsubmittedShows(dealId)
  console.log(`Found ${shows.length} show(s) to submit\n`)

  if (shows.length === 0) {
    console.log('Nothing to submit. All done.')
    return
  }

  for (const deal of shows) {
    console.log(`Processing: ${deal.title} — ${deal.show_date}`)
    try {
      await submitSetlistToBMI(deal)
      await markSubmitted(deal.id)
      await markTaskComplete(deal.id)
      console.log('  Marked complete in Supabase\n')
    } catch (err) {
      console.error(`  FAILED: ${err}\n`)
    }
  }

  console.log('Done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
