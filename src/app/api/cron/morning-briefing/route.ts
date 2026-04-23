import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const THOMAS_EMAIL = 'thomas@dirtysnatcharecords.com'
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: Request) {
  // Security: Vercel Cron sends this header. Block unauthorized calls.
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const staleCutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()

  // Query all confirmed/upcoming shows within next 7 days
  const { data: upcomingShows } = await supabase
    .from('deals')
    .select('*, artists(name, stage_name), venues(name, city, state)')
    .eq('status', 'confirmed')
    .gte('show_date', todayStr)
    .lte('show_date', in7Days)
    .order('show_date', { ascending: true })

  // Query deals needing response: inquiry/offer status, not updated in 3+ days
  const { data: staleDeals } = await supabase
    .from('deals')
    .select('*, artists(name, stage_name)')
    .in('status', ['inquiry', 'offer'])
    .lt('updated_at', staleCutoff)
    .order('updated_at', { ascending: true })

  // Query confirmed shows with deposits due in next 14 days (not yet paid)
  const { data: depositsRaw } = await supabase
    .from('deals')
    .select('*, artists(name, stage_name)')
    .eq('status', 'confirmed')
    .eq('deposit_paid', false)
    .gte('show_date', todayStr)
    .lte('show_date', in14Days)
    .order('show_date', { ascending: true })

  // Pipeline value across all open deals
  const { data: pipelineDeals } = await supabase
    .from('deals')
    .select('offer_amount, status')
    .in('status', ['inquiry', 'offer', 'negotiating'])

  const shows = upcomingShows ?? []
  const stale = staleDeals ?? []
  const deposits = depositsRaw ?? []
  const pipeline = pipelineDeals ?? []

  const totalPipeline = pipeline.reduce((s: number, d: any) => s + (Number(d.offer_amount) || 0), 0)
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`

  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const html = buildEmail({
    dateStr,
    shows,
    stale,
    deposits,
    totalPipeline,
    fmt,
  })

  const { data, error } = await resend.emails.send({
    from: 'TENx10 Briefing <briefing@tenx10.co>',
    to: THOMAS_EMAIL,
    subject: `Morning Briefing — ${dateStr}`,
    html,
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    id: data?.id,
    shows: shows.length,
    stale: stale.length,
    deposits: deposits.length,
    pipeline: totalPipeline,
  })
}

function buildEmail({
  dateStr,
  shows,
  stale,
  deposits,
  totalPipeline,
  fmt,
}: {
  dateStr: string
  shows: any[]
  stale: any[]
  deposits: any[]
  totalPipeline: number
  fmt: (n: number) => string
}) {
  const showRows = shows.map(d => {
    const pts = (d.deal_points ?? {}) as Record<string, string>
    const city = pts.city ?? d.title ?? '—'
    const state = pts.state ?? ''
    const artist = (d.artists as any)?.stage_name ?? (d.artists as any)?.name ?? '—'
    const date = d.show_date ? new Date(d.show_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'
    const guarantee = d.offer_amount ? fmt(Number(d.offer_amount)) : '—'
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${artist}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${city}${state ? `, ${state}` : ''}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${date}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${guarantee}</td>
    </tr>`
  }).join('')

  const staleRows = stale.map(d => {
    const pts = (d.deal_points ?? {}) as Record<string, string>
    const city = pts.city ?? d.title ?? '—'
    const artist = (d.artists as any)?.stage_name ?? (d.artists as any)?.name ?? '—'
    const daysSince = d.updated_at ? Math.floor((Date.now() - new Date(d.updated_at).getTime()) / (1000 * 60 * 60 * 24)) : '?'
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${artist}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${city}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${d.status}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#dc2626;">${daysSince}d no response</td>
    </tr>`
  }).join('')

  const depositRows = deposits.map(d => {
    const pts = (d.deal_points ?? {}) as Record<string, string>
    const city = pts.city ?? d.title ?? '—'
    const artist = (d.artists as any)?.stage_name ?? (d.artists as any)?.name ?? '—'
    const date = d.show_date ? new Date(d.show_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
    const depositAmt = d.deposit_amount ? fmt(Number(d.deposit_amount)) : fmt(Math.round(Number(d.offer_amount) * 0.5))
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${artist}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${city}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${date}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#d97706;font-weight:600;">${depositAmt} owed</td>
    </tr>`
  }).join('')

  const section = (title: string, badge: string, color: string, tableRows: string, headers: string[], empty: string) => {
    if (!tableRows) {
      return `
        <div style="margin-bottom:32px;">
          <h2 style="font-size:14px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">${title} <span style="background:${color}22;color:${color};padding:2px 8px;border-radius:99px;font-size:12px;">${badge}</span></h2>
          <p style="color:#888;font-size:13px;margin:0;">${empty}</p>
        </div>`
    }
    const ths = headers.map(h => `<th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:600;border-bottom:2px solid #f0f0f0;">${h}</th>`).join('')
    return `
      <div style="margin-bottom:32px;">
        <h2 style="font-size:14px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">${title} <span style="background:${color}22;color:${color};padding:2px 8px;border-radius:99px;font-size:12px;">${badge}</span></h2>
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <thead><tr>${ths}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>`
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">

    <div style="margin-bottom:32px;">
      <p style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px;">TENx10 — Morning Briefing</p>
      <h1 style="font-size:26px;font-weight:700;color:#111;margin:0;">${dateStr}</h1>
    </div>

    <!-- Pipeline stat -->
    <div style="background:#111;color:#fff;border-radius:12px;padding:20px 24px;margin-bottom:32px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <p style="font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px;">Open Pipeline</p>
        <p style="font-size:32px;font-weight:700;margin:0;letter-spacing:-0.02em;">${fmt(totalPipeline)}</p>
      </div>
      <div style="text-align:right;">
        <p style="font-size:11px;color:#888;margin:0 0 4px;">Deals needing attention</p>
        <p style="font-size:28px;font-weight:700;margin:0;color:${stale.length > 0 ? '#f87171' : '#4ade80'};">${stale.length}</p>
      </div>
    </div>

    ${section(
      'Shows This Week',
      `${shows.length}`,
      '#7c3aed',
      showRows,
      ['Artist', 'City', 'Date', 'Guarantee'],
      'No confirmed shows in the next 7 days.'
    )}

    ${section(
      'Needs Your Response',
      `${stale.length}`,
      '#dc2626',
      staleRows,
      ['Artist', 'City', 'Status', 'Last Contact'],
      'All deals are up to date. Good work.'
    )}

    ${section(
      'Deposits Due Soon',
      `${deposits.length}`,
      '#d97706',
      depositRows,
      ['Artist', 'City', 'Show Date', 'Amount Due'],
      'No unpaid deposits due in the next 14 days.'
    )}

    <div style="text-align:center;padding-top:24px;border-top:1px solid #e5e5e5;">
      <a href="https://tenx10.co/dashboard" style="display:inline-block;background:#111;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Open Dashboard</a>
      <p style="font-size:11px;color:#aaa;margin:16px 0 0;">TENx10 · Sent automatically at 7am EST</p>
    </div>

  </div>
</body>
</html>`
}
