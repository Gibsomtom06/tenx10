import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const THOMAS_EMAIL = 'thomas@dirtysnatcharecords.com'
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: Request) {
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  // Security: Vercel Cron sends this header. Block unauthorized calls.
  const authHeader = req.headers.get('authorization')
  const adminSecret = process.env.SUPABASE_SERVICE_ROLE_KEY
  const isCron = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`
  const isAdmin = adminSecret && authHeader === `Bearer ${adminSecret}`
  if (CRON_SECRET && !isCron && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const staleCutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  // Query all confirmed/upcoming shows within next 7 days
  const { data: upcomingShows } = await supabase
    .from('deals')
    .select('*, artists(name, stage_name), venues(name, city, state)')
    .eq('status', 'confirmed')
    .gte('show_date', todayStr)
    .lte('show_date', in7Days)
    .order('show_date', { ascending: true })

  // Query deals needing response: future shows only, in active negotiation, not updated in 3+ days
  const { data: staleDeals } = await supabase
    .from('deals')
    .select('*, artists(name, stage_name)')
    .in('status', ['inquiry', 'offer', 'negotiating'])
    .lt('updated_at', staleCutoff)
    .gte('show_date', todayStr)
    .not('show_date', 'is', null)
    .order('updated_at', { ascending: true })

  // This month's confirmed revenue — all confirmed shows this month (past + future)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const { data: monthDeals } = await supabase
    .from('deals')
    .select('offer_amount')
    .in('status', ['confirmed', 'completed'])
    .gte('show_date', monthStart)
    .lte('show_date', monthEnd)

  // Query confirmed shows with deposits due in next 14 days (not yet paid)
  const { data: depositsRaw } = await supabase
    .from('deals')
    .select('*, artists(name, stage_name)')
    .eq('status', 'confirmed')
    .eq('deposit_paid', false)
    .gte('show_date', todayStr)
    .lte('show_date', in14Days)
    .order('show_date', { ascending: true })

  // Pipeline value: open deals for future shows with actual offer amounts
  const { data: pipelineDeals } = await supabase
    .from('deals')
    .select('offer_amount, status')
    .in('status', ['inquiry', 'offer', 'negotiating'])
    .gte('show_date', todayStr)
    .not('offer_amount', 'is', null)

  // Artists missing PRO registration — writer royalties are uncollectable without this
  const { data: proPendingRaw } = await supabase
    .from('artists')
    .select('stage_name, name')
    .is('pro_affiliation', null)
    .order('stage_name')

  // Open tasks due in the next 30 days
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: openTasksRaw } = await supabase
    .from('tasks')
    .select('title, type, due_date, artists(stage_name)')
    .in('status', ['todo', 'in_progress'])
    .or(`due_date.is.null,due_date.lte.${in30Days}`)
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(20)

  const shows = upcomingShows ?? []
  const stale = staleDeals ?? []
  const deposits = depositsRaw ?? []
  const pipeline = pipelineDeals ?? []
  const proPending = (proPendingRaw ?? []).filter((a: any) => a.stage_name !== 'DSR')
  const openTasks = openTasksRaw ?? []

  const totalPipeline = pipeline.reduce((s: number, d: any) => s + (Number(d.offer_amount) || 0), 0)
  const monthRevenue = (monthDeals ?? []).reduce((s: number, d: any) => s + (Number(d.offer_amount) || 0), 0)
  const MONTHLY_GOAL = 10000
  const revenueGap = Math.max(0, MONTHLY_GOAL - monthRevenue)
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`

  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const html = buildEmail({
    dateStr,
    shows,
    stale,
    deposits,
    totalPipeline,
    monthRevenue,
    revenueGap,
    monthlyGoal: MONTHLY_GOAL,
    proPending,
    openTasks,
    fmt,
  })

  // Send to Discord
  const discordWebhook = process.env.DISCORD_WEBHOOK_URL
  if (discordWebhook) {
    const discordMsg = buildDiscordMessage({ dateStr, shows, stale, deposits, totalPipeline, monthRevenue, revenueGap, monthlyGoal: MONTHLY_GOAL, proPending, openTasks, fmt })
    await fetch(discordWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordMsg),
    }).catch(e => console.error('Discord error:', e))
  }

  // Send email (Resend)
  if (resend) {
    const { error } = await resend.emails.send({
      from: 'TENx10 Briefing <briefing@tenx10.co>',
      to: THOMAS_EMAIL,
      subject: `Morning Briefing — ${dateStr}`,
      html,
    })
    if (error) console.error('Resend error:', error)
  }

  return NextResponse.json({
    ok: true,
    shows: shows.length,
    stale: stale.length,
    deposits: deposits.length,
    pipeline: totalPipeline,
    pro_pending: proPending.length,
    open_tasks: openTasks.length,
  })
}

function buildDiscordMessage({ dateStr, shows, stale, deposits, totalPipeline, monthRevenue, revenueGap, monthlyGoal, proPending, openTasks, fmt }: {
  dateStr: string, shows: any[], stale: any[], deposits: any[], totalPipeline: number,
  monthRevenue: number, revenueGap: number, monthlyGoal: number, proPending: any[], openTasks: any[], fmt: (n: number) => string
}) {
  const fields = []

  fields.push({
    name: '📅 ' + dateStr,
    value: [
      `**This Month:** ${fmt(monthRevenue)} ${revenueGap > 0 ? `— ${fmt(revenueGap)} short of ${fmt(monthlyGoal)} goal 🔴` : '— Goal hit ✅'}`,
      `**Open Pipeline:** ${fmt(totalPipeline)}`,
      `**Needs Response:** ${stale.length > 0 ? `${stale.length} deals 🔴` : 'All clear ✅'}`,
    ].join('\n'),
    inline: false,
  })

  if (shows.length > 0) {
    const showLines = shows.map((d: any) => {
      const pts = (d.deal_points ?? {}) as Record<string, string>
      const city = pts.city ?? d.title ?? '—'
      const state = pts.state ? `, ${pts.state}` : ''
      const artist = (d.artists as any)?.stage_name ?? (d.artists as any)?.name ?? '—'
      const date = d.show_date ? new Date(d.show_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
      const guarantee = d.offer_amount ? fmt(Number(d.offer_amount)) : '—'
      return `• ${date} — ${artist} @ ${city}${state} (${guarantee})`
    }).join('\n')
    fields.push({ name: `🎤 Shows This Week (${shows.length})`, value: showLines, inline: false })
  }

  if (stale.length > 0) {
    const staleLines = stale.map((d: any) => {
      const pts = (d.deal_points ?? {}) as Record<string, string>
      const city = pts.city ?? d.title ?? '—'
      const artist = (d.artists as any)?.stage_name ?? (d.artists as any)?.name ?? '—'
      const days = d.updated_at ? Math.floor((Date.now() - new Date(d.updated_at).getTime()) / 86400000) : '?'
      return `• ${artist} — ${city} (${d.status}, ${days}d silent)`
    }).join('\n')
    fields.push({ name: `⚠️ Needs Response (${stale.length})`, value: staleLines, inline: false })
  }

  if (deposits.length > 0) {
    const depositLines = deposits.map((d: any) => {
      const pts = (d.deal_points ?? {}) as Record<string, string>
      const city = pts.city ?? d.title ?? '—'
      const artist = (d.artists as any)?.stage_name ?? (d.artists as any)?.name ?? '—'
      const amt = d.deposit_amount ? fmt(Number(d.deposit_amount)) : fmt(Math.round(Number(d.offer_amount) * 0.5))
      return `• ${artist} — ${city} (${amt} owed)`
    }).join('\n')
    fields.push({ name: `💰 Deposits Due (${deposits.length})`, value: depositLines, inline: false })
  }

  if (proPending.length > 0) {
    const proLines = proPending.map((a: any) => `• ${a.stage_name} — no PRO registration (writer royalties uncollectable)`).join('\n')
    fields.push({ name: `📋 PRO Registration Needed (${proPending.length})`, value: proLines, inline: false })
  }

  if (openTasks.length > 0) {
    const taskLines = openTasks.map((t: any) => {
      const artist = (t.artists as any)?.stage_name ? ` [${(t.artists as any).stage_name}]` : ''
      const due = t.due_date ? ` — due ${new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''
      return `• ${t.title}${artist}${due}`
    }).join('\n')
    fields.push({ name: `✅ Open Tasks (${openTasks.length})`, value: taskLines, inline: false })
  }

  fields.push({ name: '​', value: '[Open Dashboard →](https://tenx10.co/dashboard)', inline: false })

  return {
    embeds: [{
      title: 'TENx10 Morning Briefing',
      color: 0x7c3aed,
      fields,
      footer: { text: 'Sent automatically at 7am EST' },
    }],
  }
}

function buildEmail({
  dateStr,
  shows,
  stale,
  deposits,
  totalPipeline,
  monthRevenue,
  revenueGap,
  monthlyGoal,
  proPending,
  openTasks,
  fmt,
}: {
  dateStr: string
  shows: any[]
  stale: any[]
  deposits: any[]
  totalPipeline: number
  monthRevenue: number
  revenueGap: number
  monthlyGoal: number
  proPending: any[]
  openTasks: any[]
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

    <!-- Stats bar -->
    <div style="background:#111;color:#fff;border-radius:12px;padding:20px 24px;margin-bottom:32px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
        <div>
          <p style="font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px;">This Month</p>
          <p style="font-size:28px;font-weight:700;margin:0;letter-spacing:-0.02em;">${fmt(monthRevenue)}</p>
          <p style="font-size:12px;color:${revenueGap > 0 ? '#f87171' : '#4ade80'};margin:4px 0 0;">${revenueGap > 0 ? `${fmt(revenueGap)} short of ${fmt(monthlyGoal)} goal` : 'Goal hit'}</p>
        </div>
        <div>
          <p style="font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px;">Open Pipeline</p>
          <p style="font-size:28px;font-weight:700;margin:0;letter-spacing:-0.02em;">${fmt(totalPipeline)}</p>
        </div>
        <div style="text-align:right;">
          <p style="font-size:11px;color:#888;margin:0 0 4px;">Needs response</p>
          <p style="font-size:28px;font-weight:700;margin:0;color:${stale.length > 0 ? '#f87171' : '#4ade80'};">${stale.length}</p>
        </div>
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

    ${proPending.length > 0 ? `
    <div style="margin-bottom:32px;">
      <h2 style="font-size:14px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">PRO Registration Needed <span style="background:#dc262622;color:#dc2626;padding:2px 8px;border-radius:99px;font-size:12px;">${proPending.length}</span></h2>
      <p style="color:#666;font-size:12px;margin:0 0 10px;">These artists have no PRO on file. Writer royalties are uncollectable until they register.</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <thead><tr><th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:600;border-bottom:2px solid #f0f0f0;">Artist</th><th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:600;border-bottom:2px solid #f0f0f0;">Action</th></tr></thead>
        <tbody>${proPending.map((a: any) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:600;">${a.stage_name}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#dc2626;">Register BMI (free) or ASCAP ($50) — send IPI to thomas@dirtysnatcha.com</td></tr>`).join('')}</tbody>
      </table>
    </div>` : ''}

    ${openTasks.length > 0 ? `
    <div style="margin-bottom:32px;">
      <h2 style="font-size:14px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Open Tasks <span style="background:#6366f122;color:#6366f1;padding:2px 8px;border-radius:99px;font-size:12px;">${openTasks.length}</span></h2>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <thead><tr><th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:600;border-bottom:2px solid #f0f0f0;">Task</th><th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:600;border-bottom:2px solid #f0f0f0;">Artist</th><th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:600;border-bottom:2px solid #f0f0f0;">Due</th></tr></thead>
        <tbody>${openTasks.map((t: any) => {
          const artist = (t.artists as any)?.stage_name ?? '—'
          const due = t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
          return `<tr><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${t.title}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#888;">${artist}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#888;">${due}</td></tr>`
        }).join('')}</tbody>
      </table>
    </div>` : ''}

    <div style="text-align:center;padding-top:24px;border-top:1px solid #e5e5e5;">
      <a href="https://tenx10.co/dashboard" style="display:inline-block;background:#111;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Open Dashboard</a>
      <p style="font-size:11px;color:#aaa;margin:16px 0 0;">TENx10 · Sent automatically at 7am EST</p>
    </div>

  </div>
</body>
</html>`
}
