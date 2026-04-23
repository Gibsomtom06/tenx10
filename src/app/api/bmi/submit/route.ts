/**
 * /api/bmi/submit
 * Triggers BMI setlist submission for a completed deal.
 * Runs the Playwright script as a child process.
 * POST { dealId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { dealId } = await request.json() as { dealId: string }
    if (!dealId) return NextResponse.json({ error: 'dealId required' }, { status: 400 })

    // Auth check — only managers/label_managers can trigger
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify deal exists and is completed
    const { data: dealRaw, error } = await supabase
      .from('deals')
      .select('id, status, bmi_submitted, title, show_date')
      .eq('id', dealId)
      .single()

    // Cast to any until migration 016 types are regenerated
    const deal = dealRaw as any

    if (error || !deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    if (deal.status !== 'completed') return NextResponse.json({ error: 'Deal is not completed' }, { status: 400 })
    if (deal.bmi_submitted) return NextResponse.json({ message: 'Already submitted', deal }, { status: 200 })

    // Check env vars before spawning process
    if (!process.env.BMI_USERNAME || !process.env.BMI_PASSWORD) {
      return NextResponse.json({
        error: 'BMI credentials not configured',
        hint: 'Set BMI_USERNAME and BMI_PASSWORD in environment variables'
      }, { status: 500 })
    }

    // Run Playwright script as child process
    const scriptPath = path.join(process.cwd(), 'scripts', 'bmi-submit-setlist.ts')
    const cmd = `npx ts-node "${scriptPath}" ${dealId}`

    // Run async — don't block the response
    execAsync(cmd, {
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        BMI_USERNAME: process.env.BMI_USERNAME,
        BMI_PASSWORD: process.env.BMI_PASSWORD,
      },
      timeout: 120000, // 2 min max
    }).then(() => {
      console.log('[/api/bmi/submit] Playwright script completed for deal', dealId)
    }).catch(err => {
      console.error('[/api/bmi/submit] Playwright script failed:', err.message)
    })

    return NextResponse.json({
      message: 'BMI submission started',
      dealId,
      show: `${deal.title} — ${deal.show_date}`,
      status: 'processing'
    })

  } catch (err) {
    console.error('[/api/bmi/submit]', err)
    return NextResponse.json({ error: 'Submit failed', detail: String(err) }, { status: 500 })
  }
}
