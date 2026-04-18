/**
 * Import scraped Gigwell data into Supabase
 *
 * Usage (after running scrape-gigwell.ts):
 *   npx tsx scripts/import-gigwell.ts --artist dirtysnatcha
 *   npx tsx scripts/import-gigwell.ts --artist whoisee
 *
 * Defaults to reading artistSlug from the data file if --artist is not specified.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Parse --artist flag
const artistArg = process.argv.find(a => a.startsWith('--artist='))?.split('=')[1]
  ?? (process.argv.indexOf('--artist') !== -1 ? process.argv[process.argv.indexOf('--artist') + 1] : null)

// Stage name lookup: slug → artist.stage_name in DB
const SLUG_TO_STAGE: Record<string, string> = {
  'dirtysnatcha': 'DirtySnatcha',
  'whoisee':      'WHOiSEE',
  'hvrcrft':      'HVRCRFT',
  'dark-matter':  'Dark Matter',
  'kotrax':       'Kotrax',
  'ozztin':       'OZZTIN',
  'mavic':        'MAVIC',
  'priyanx':      'PRIYANX',
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

function normalizeStatus(status?: string): string {
  if (!status) return 'inquiry'
  const s = status.toLowerCase()
  if (s.includes('confirm') || s.includes('signed') || s.includes('active')) return 'confirmed'
  if (s.includes('cancel')) return 'cancelled'
  if (s.includes('complet') || s.includes('past') || s.includes('done')) return 'completed'
  if (s.includes('offer') || s.includes('pending') || s.includes('proposed')) return 'offer'
  if (s.includes('negotiat')) return 'negotiating'
  return 'inquiry'
}

function parseDate(dateStr?: string): string | null {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  } catch { /* */ }
  return null
}

function parseAmount(val?: number | null | string): number | null {
  if (val == null) return null
  const num = typeof val === 'string' ? parseFloat(val.replace(/[$,]/g, '')) : val
  return isNaN(num) ? null : num
}

async function getOrCreateArtist(slug: string): Promise<string | null> {
  const stageName = SLUG_TO_STAGE[slug]
  if (!stageName) {
    console.error(`✗ Unknown artist slug "${slug}". Add it to SLUG_TO_STAGE in the import script.`)
    return null
  }

  // Try to find existing artist by stage name
  const { data: existing } = await supabase
    .from('artists')
    .select('id')
    .ilike('stage_name', stageName)
    .limit(1)
    .single()

  if (existing) return existing.id

  // Artist not in DB yet — find the manager (Thomas) to set as manager_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single()

  if (!profile) {
    console.error('✗ No profile found to use as manager_id.')
    return null
  }

  console.log(`  Creating new artist record: ${stageName}`)
  const { data: created } = await supabase
    .from('artists')
    .insert({ name: stageName, stage_name: stageName, manager_id: profile.id, status: 'active' })
    .select('id')
    .single()

  return created?.id ?? null
}

async function importContacts(contacts: GigwellContact[]) {
  console.log(`\nImporting ${contacts.length} contacts...`)
  let imported = 0, skipped = 0

  for (const c of contacts) {
    if (!c.name?.trim()) { skipped++; continue }

    const { error } = await supabase
      .from('contacts')
      .upsert({
        name: c.name.trim(),
        company: c.company?.trim() ?? null,
        email: c.email?.trim()?.toLowerCase() ?? null,
        phone: c.phone?.trim() ?? null,
        city: c.city?.trim() ?? null,
        state: c.state?.trim() ?? null,
        pitch_status: 'existing',
        notes: c.gigwellId ? `Imported from Gigwell (ID: ${c.gigwellId})` : 'Imported from Gigwell',
      }, {
        onConflict: 'email',
        ignoreDuplicates: false,
      })

    if (error) {
      // Email conflicts are fine — contact already exists
      if (!error.message.includes('duplicate')) {
        console.log(`  ⚠ Contact "${c.name}": ${error.message}`)
      }
      skipped++
    } else {
      imported++
    }
  }

  console.log(`  ✓ ${imported} imported, ${skipped} skipped/existing`)
}

async function importVenues(venues: GigwellVenue[]) {
  console.log(`\nImporting ${venues.length} venues...`)
  let imported = 0, skipped = 0

  for (const v of venues) {
    if (!v.name?.trim()) { skipped++; continue }

    const { error } = await supabase
      .from('venues')
      .insert({
        name: v.name.trim(),
        city: v.city?.trim() ?? null,
        state: v.state?.trim() ?? null,
        capacity: v.capacity ?? null,
        contact_name: v.contact?.trim() ?? null,
        contact_email: v.email?.trim() ?? null,
      })

    if (error) {
      skipped++
    } else {
      imported++
    }
  }

  console.log(`  ✓ ${imported} imported, ${skipped} skipped/existing`)
}

async function importBookings(bookings: GigwellBooking[], artistId: string, slug = 'dirtysnatcha') {
  console.log(`\nImporting ${bookings.length} bookings...`)
  let imported = 0, skipped = 0

  for (const b of bookings) {
    // Skip entries with no usable data
    if (!b.date && !b.city && !b.title) { skipped++; continue }

    const status = normalizeStatus(b.status)
    const showDate = parseDate(b.date)
    const guarantee = parseAmount(b.guarantee)

    const city = b.city?.trim() ?? ''
    const state = b.state?.trim() ?? ''
    const venue = b.venue?.trim() ?? ''
    const promoterName = b.promoter?.trim() ?? ''

    const title = b.title?.trim() || (city ? `${city}${state ? `, ${state}` : ''}` : 'Imported show')

    const { error } = await supabase
      .from('deals')
      .insert({
        artist_id: artistId,
        title,
        show_date: showDate,
        offer_amount: guarantee,
        status,
        notes: [
          b.notes?.trim(),
          b.gigwellId ? `Gigwell ID: ${b.gigwellId}` : null,
        ].filter(Boolean).join('\n') || null,
        deal_points: {
          city,
          state,
          venue,
          promoterName,
          promoterEmail: b.promoterEmail?.trim() ?? null,
          promoterPhone: b.promoterPhone?.trim() ?? null,
          capacity: b.capacity ?? null,
          importSource: 'gigwell',
          artistSlug: slug,
        },
      })

    if (error) {
      console.log(`  ⚠ "${title}": ${error.message}`)
      skipped++
    } else {
      imported++
    }
  }

  console.log(`  ✓ ${imported} imported, ${skipped} skipped`)
}

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Gigwell → Supabase Import')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Resolve which data file to read
  let dataFile: string
  if (artistArg) {
    dataFile = path.join(process.cwd(), 'scripts', `gigwell-data-${artistArg}.json`)
  } else {
    // Fall back to first matching file
    const files = fs.readdirSync(path.join(process.cwd(), 'scripts'))
      .filter(f => f.startsWith('gigwell-data-') && f.endsWith('.json'))
    if (files.length === 0) {
      console.error('✗ No gigwell-data-*.json files found. Run scrape-gigwell.ts first.')
      process.exit(1)
    }
    dataFile = path.join(process.cwd(), 'scripts', files[0])
    console.log(`No --artist specified — using ${files[0]}\n`)
  }

  if (!fs.existsSync(dataFile)) {
    console.error(`✗ Data file not found: ${dataFile}`)
    console.error(`  Run:  npx tsx scripts/scrape-gigwell.ts --artist ${artistArg ?? '<slug>'}`)
    process.exit(1)
  }

  const raw = fs.readFileSync(dataFile, 'utf-8')
  const data = JSON.parse(raw) as {
    artistSlug: string
    bookings: GigwellBooking[]
    contacts: GigwellContact[]
    venues: GigwellVenue[]
    scrapedAt: string
  }

  const slug = artistArg ?? data.artistSlug ?? 'dirtysnatcha'

  console.log(`Artist:  ${SLUG_TO_STAGE[slug] ?? slug}`)
  console.log(`Scraped: ${data.scrapedAt}`)
  console.log(`  ${data.bookings.length} bookings`)
  console.log(`  ${data.contacts.length} contacts`)
  console.log(`  ${data.venues.length} venues`)

  const artistId = await getOrCreateArtist(slug)
  if (!artistId) {
    console.error(`✗ Could not find or create artist "${slug}" in database.`)
    process.exit(1)
  }
  console.log(`\nArtist ID: ${artistId}`)

  await importContacts(data.contacts)
  await importVenues(data.venues)
  await importBookings(data.bookings, artistId, slug)

  console.log('\n✓ Import complete.')
  console.log('  /artist/pipeline — to see imported deals')
  console.log('  /dashboard/venues — to see imported venues\n')
}

main().catch(err => {
  console.error('Import failed:', err)
  process.exit(1)
})
