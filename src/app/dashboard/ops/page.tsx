import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TriggerBriefingButton } from '../briefing/TriggerBriefingButton'
import {
  Bot, Zap, CheckSquare, DollarSign, Music2, Globe, Package,
  ExternalLink, CheckCircle2, Clock, AlertCircle,
  TrendingUp, Lightbulb, Server, AlertTriangle, ArrowRight,
} from 'lucide-react'

export const metadata = { title: '10 Research Group — Command Center' }

// ─── Work log: past 48h ───────────────────────────────────────────────────────
// Add entries here as work is completed. verifyHref = page/feature to check.

const WORK_LOG = [
  {
    id: 'briefing-trigger',
    label: 'Send Briefing Now button',
    detail: 'Button on /dashboard/briefing fires Discord + email immediately — no more waiting for cron.',
    status: 'done' as const,
    verifyHref: '/dashboard/briefing',
    area: 'platform',
  },
  {
    id: 'briefing-auth',
    label: 'Morning briefing auth fix',
    detail: 'Replaced broken SUPABASE_SERVICE_ROLE_KEY bypass with Supabase session check. Any logged-in user can trigger.',
    status: 'done' as const,
    verifyHref: '/dashboard/briefing',
    area: 'platform',
  },
  {
    id: 'tasks-kanban',
    label: 'Task funnel — kanban with color codes',
    detail: '8 task types color-coded (contract red, publishing amber, setlist purple, platform blue, etc). Kanban view: To Do → In Progress → Done.',
    status: 'done' as const,
    verifyHref: '/dashboard/tasks',
    area: 'platform',
  },
  {
    id: 'tasks-seeded',
    label: '20 tasks seeded in Supabase',
    detail: 'Publishing, contracts, platform, business, and SongTools tasks now in DB — briefing surfaces them.',
    status: 'done' as const,
    verifyHref: '/dashboard/tasks',
    area: 'platform',
  },
  {
    id: 'setlist-trigger',
    label: 'Setlist → publishing trigger (migration 018)',
    detail: 'When deal marked completed: auto-creates BMI setlist submission task + flags any tracks not registered at PRO.',
    status: 'done' as const,
    verifyHref: '/dashboard/deals',
    area: 'publishing',
  },
  {
    id: 'publishing-tracker',
    label: 'Publishing tracker — CMRRA column added',
    detail: 'CMRRA registration status now tracked alongside BMI/MLC/SoundExchange.',
    status: 'done' as const,
    verifyHref: '/dashboard/publishing',
    area: 'publishing',
  },
  {
    id: 'briefing-content',
    label: 'Morning briefing — publishing + tasks sections',
    detail: 'Briefing now shows artists missing PRO registration and up to 20 open tasks (was 8).',
    status: 'done' as const,
    verifyHref: '/dashboard/briefing',
    area: 'platform',
  },
  {
    id: 'beads-songtools',
    label: 'SongTools issue filed in beads (tenx10_research-9fa)',
    detail: 'P1 issue: register at MLC/SoundExchange/CMRRA/AMRA directly before cancelling SongTools.',
    status: 'done' as const,
    verifyHref: '#',
    area: 'publishing',
  },
  {
    id: 'ops-dashboard',
    label: 'This command center (/dashboard/ops)',
    detail: 'Full 10 Research Group birds-eye: products, agents, tasks, publishing, costs, work log.',
    status: 'done' as const,
    verifyHref: '/dashboard/ops',
    area: 'platform',
  },
]

// ─── Blockers / waiting on ─────────────────────────────────────────────────────

const BLOCKERS = [
  {
    id: 'mlc-upload',
    label: 'Upload catalog to MLC',
    detail: 'MLC.com → register as publisher → upload all 82 tracks. Required for all streaming mechanical royalties.',
    waitingOn: 'Thomas',
    area: 'publishing',
    urgency: 'critical' as const,
  },
  {
    id: 'soundexchange-reg',
    label: 'SoundExchange — register performer + label',
    detail: 'Two accounts: (1) Leigh Bray as performer, (2) DirtySnatcha Records as rights holder. Covers Pandora, SiriusXM, internet radio.',
    waitingOn: 'Thomas',
    area: 'publishing',
    urgency: 'critical' as const,
  },
  {
    id: 'cmrra-activate',
    label: 'Activate CMRRA accounts 02274554 / 02274555',
    detail: 'Accounts exist — file the catalog. Canadian mechanical royalties blocked until done.',
    waitingOn: 'Thomas',
    area: 'publishing',
    urgency: 'high' as const,
  },
  {
    id: 'isrc-missing',
    label: 'Get 17 missing ISRCs from VMG',
    detail: 'Contact VMG Assets for ISRCs on the 17 tracks showing NULL. Without ISRC, royalty societies can\'t match streams to registrations.',
    waitingOn: 'Thomas → VMG',
    area: 'publishing',
    urgency: 'high' as const,
  },
  {
    id: 'kaime-contracts',
    label: 'Kaime EP — 4 artist contracts (due Apr 30)',
    detail: 'Email drafts ready. Thomas sends to the 4 artists to sign before release.',
    waitingOn: 'Thomas to send',
    area: 'contracts',
    urgency: 'critical' as const,
  },
  {
    id: 'gmail-oauth',
    label: 'Reconnect Gmail OAuth',
    detail: 'thomas@dirtysnatcharecords.com token expired. Inbox scanning broken until reconnected at /dashboard/settings.',
    waitingOn: 'Thomas',
    area: 'platform',
    urgency: 'high' as const,
  },
  {
    id: 'songtools-cancel',
    label: 'Cancel SongTools — BLOCKED',
    detail: 'Cannot cancel until MLC + SoundExchange + CMRRA all confirmed active. Those collect what SongTools currently collects.',
    waitingOn: 'MLC + SoundExchange + CMRRA first',
    area: 'publishing',
    urgency: 'high' as const,
  },
  {
    id: 'ebay',
    label: 'eBay work — needs clarification',
    detail: 'Thomas referenced eBay activity that needs to be tracked. No context in system yet.',
    waitingOn: 'Thomas to explain',
    area: 'business',
    urgency: 'low' as const,
  },
]

// ─── Agent roster ──────────────────────────────────────────────────────────────

const AGENTS = [
  { id: 'xai', name: 'Xai (Orchestrator)', domain: 'Routes all requests, multi-agent synthesis, daily briefings', status: 'production' as const, skills: ['routing', 'synthesis', 'briefing'] },
  { id: 'booking', name: 'Booking Agent', domain: 'Show offers, contract negotiation, routing, radius clauses', status: 'production' as const, skills: ['deal eval', 'counter offer', 'email drafting'] },
  { id: 'briefing-cron', name: 'Morning Briefing', domain: 'Discord + email brief — shows, tasks, publishing, revenue gap', status: 'production' as const, skills: ['discord', 'email', 'cron'] },
  { id: 'gmail-parser', name: 'Gmail Offer Parser', domain: 'Scans Gmail for inbound show offers, extracts deal data', status: 'production' as const, skills: ['Gmail API', 'offer extraction'] },
  { id: 'rj', name: 'RJ Jackson (CMO)', domain: 'PR, editorial pitching, playlist strategy, social strategy', status: 'testing' as const, skills: ['PR campaigns', 'cold email', 'playlist pitching'] },
  { id: 'manager', name: 'Artist Manager', domain: 'Career strategy, white space, P&L, revenue diversification', status: 'testing' as const, skills: ['P&L analysis', 'white space', 'goal tracking'] },
  { id: 'social', name: 'Social Media Architect', domain: 'Platform-native content, TikTok/IG/YouTube strategy', status: 'building' as const, skills: ['content calendar', 'UGC'] },
  { id: 'release', name: 'Release Agent', domain: 'Distribution, ISRC tracking, Day 0-7 launch execution', status: 'building' as const, skills: ['VMG', 'ISRC', 'launch'] },
  { id: 'promo', name: 'Promo & UGC Manager', domain: 'Fan activation, download gates, promo team', status: 'building' as const, skills: ['Hypeddit', 'UGC'] },
  { id: 'dad', name: 'DAD Agent', domain: 'Email triage + file dedup across 9 accounts + 3 cloud drives', status: 'building' as const, skills: ['email triage', 'Drive dedup'] },
]

// ─── Products ──────────────────────────────────────────────────────────────────

const PRODUCTS = [
  { name: 'TENx10 Platform', tagline: 'AI-powered artist management SaaS · live at tenx10.co', status: 'live-building' as const, href: '/dashboard', revenue: 'pre-revenue' },
  { name: 'DirtySnatcha Records', tagline: '82 tracks · label proof-of-concept · real data', status: 'active' as const, href: '/dashboard/label', revenue: 'deal pipeline' },
  { name: 'Management', tagline: '4 artists: DirtySnatcha, WHOiSEE, Dark Matter, Kotrax', status: 'active' as const, href: '/dashboard/artists', revenue: '10% commission' },
  { name: 'DAD', tagline: 'Landing live at tenx10.co/dad · agent not built yet', status: 'partial' as const, href: '#', revenue: 'pre-revenue' },
  { name: 'MHP', tagline: 'My Hydration Pack · inactive', status: 'dormant' as const, href: '#', revenue: '$0' },
  { name: 'Trelis Work', tagline: 'Workspace brand · inactive', status: 'dormant' as const, href: '#', revenue: '$0' },
]

// ─── Ideas ─────────────────────────────────────────────────────────────────────

const IDEAS = [
  { name: 'Meme Music Generator', desc: 'Auto-generate + distribute artist memes. Sell custom meme packs to DSR artists.', traction: 'concept' },
  { name: 'Rim Shop Agent', desc: 'First non-music 10RG client. Wheel repair MI. Scope TBD.', traction: 'lead' },
  { name: 'DAD Full Pipeline', desc: '9 email accounts + 3 drives. Landing live. Agent not built.', traction: 'landing live' },
]

// ─── Costs ─────────────────────────────────────────────────────────────────────

const COSTS = [
  { name: 'Vercel', note: 'hosting + cron', link: 'https://vercel.com/gibsomtom06s-projects/tenx10' },
  { name: 'Supabase', note: 'DB + auth + storage', link: 'https://supabase.com/dashboard/project/ocscxqaythiuidkwjuvg' },
  { name: 'Anthropic', note: 'Claude API (build layer)', link: 'https://console.anthropic.com' },
  { name: 'Resend', note: 'transactional email', link: 'https://resend.com' },
  { name: 'Groq', note: 'offer parsing — free tier', link: 'https://console.groq.com' },
  { name: 'SongTools', note: '⚠ CANCEL BLOCKED — finish direct PRO registrations first', link: '#' },
  { name: 'VMG Assets', note: 'DSR distribution', link: '#' },
]

// ─── Styles ────────────────────────────────────────────────────────────────────

const AGENT_STATUS = {
  production: { dot: 'bg-green-500', label: 'production', row: 'border-green-500/20 bg-green-500/5' },
  testing:    { dot: 'bg-yellow-500', label: 'testing',    row: 'border-yellow-500/20 bg-yellow-500/5' },
  building:   { dot: 'bg-blue-400',   label: 'building',   row: 'border-blue-500/20 bg-blue-500/5' },
}

const PRODUCT_STATUS = {
  'live-building': { dot: 'bg-blue-400',          label: 'live · building', bg: 'bg-blue-500/5 border-blue-500/20' },
  active:          { dot: 'bg-green-500',          label: 'active',          bg: 'bg-green-500/5 border-green-500/20' },
  partial:         { dot: 'bg-yellow-500',         label: 'partial',         bg: 'bg-yellow-500/5 border-yellow-500/20' },
  dormant:         { dot: 'bg-muted-foreground/30',label: 'dormant',         bg: 'bg-muted/20 border-border/40' },
}

const URGENCY = {
  critical: 'border-red-500/30 bg-red-500/5',
  high:     'border-amber-500/30 bg-amber-500/5',
  low:      'border-border bg-muted/20',
}
const URGENCY_DOT = {
  critical: 'bg-red-500',
  high:     'bg-amber-500',
  low:      'bg-muted-foreground/40',
}

const TYPE_LABELS: Record<string, string> = {
  contract: 'contract', email: 'email', publishing: 'publishing',
  bmi_setlist: 'setlist', platform: 'platform', business: 'business',
  show: 'show', release: 'release', promo: 'promo', general: 'general',
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function OpsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const [
    { data: rawTasks },
    { data: monthDeals },
    { data: openDeals },
    { data: pubStats },
  ] = await Promise.all([
    (supabase as any).from('tasks')
      .select('id, title, type, status, due_date')
      .in('status', ['todo', 'in_progress'])
      .order('due_date', { ascending: true, nullsFirst: false }),

    (supabase as any).from('deals')
      .select('offer_amount')
      .in('status', ['confirmed', 'completed'])
      .gte('show_date', monthStart)
      .lte('show_date', monthEnd),

    (supabase as any).from('deals')
      .select('id, status, offer_amount, deal_points, show_date')
      .in('status', ['inquiry', 'offer', 'negotiating', 'confirmed'])
      .gte('show_date', now.toISOString().split('T')[0])
      .order('show_date', { ascending: true })
      .limit(20),

    // Publishing registration counts
    (supabase as any).from('publishing_registrations')
      .select('bmi_registered, mlc_registered, soundexchange_registered, cmrra_registered, isrc'),
  ])

  const tasks   = (rawTasks    ?? []) as any[]
  const deals   = (monthDeals  ?? []) as any[]
  const pipeline = (openDeals  ?? []) as any[]
  const pub     = (pubStats    ?? []) as any[]

  // Publishing counts
  const pubTotal  = pub.length
  const pubBmi    = pub.filter((r: any) => r.bmi_registered).length
  const pubMlc    = pub.filter((r: any) => r.mlc_registered).length
  const pubSe     = pub.filter((r: any) => r.soundexchange_registered).length
  const pubCmrra  = pub.filter((r: any) => r.cmrra_registered).length
  const pubNoIsrc = pub.filter((r: any) => !r.isrc).length

  const monthRevenue = deals.reduce((s: number, d: any) => s + (Number(d.offer_amount) || 0), 0)
  const GOAL = 10000
  const gap  = Math.max(0, GOAL - monthRevenue)
  const pct  = Math.min(100, Math.round((monthRevenue / GOAL) * 100))

  // Group tasks by type
  const tasksByType: Record<string, any[]> = {}
  tasks.forEach((t: any) => {
    const k = t.type ?? 'general'
    tasksByType[k] = tasksByType[k] ?? []
    tasksByType[k].push(t)
  })

  const todayFmt = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const agentByStatus = AGENTS.reduce((a, ag) => { a[ag.status] = (a[ag.status] ?? 0) + 1; return a }, {} as Record<string, number>)

  // Publishing rows for the table
  const PUB_ROWS = [
    { label: 'BMI',           count: pubBmi,   total: pubTotal, done: pubBmi === pubTotal,  note: 'Performance royalties (live + radio)',             action: null },
    { label: 'ASCAP',         count: null,      total: null,     done: null,                 note: 'n/a — you are BMI. Can\'t be both.',              action: null },
    { label: 'MLC',           count: pubMlc,   total: pubTotal, done: pubMlc === pubTotal,   note: 'Streaming mechanicals (Spotify, Apple, etc)',      action: 'Upload catalog at mlc.com' },
    { label: 'SoundExchange', count: pubSe,    total: pubTotal, done: pubSe  === pubTotal,   note: 'Digital radio (Pandora, SiriusXM). Two accounts.', action: 'Register performer + label at soundexchange.com' },
    { label: 'CMRRA',         count: pubCmrra, total: pubTotal, done: pubCmrra === pubTotal, note: 'Canadian mechanicals. Accounts 02274554/02274555.', action: 'File catalog to existing accounts' },
    { label: 'AMRA',          count: null,      total: null,     done: null,                 note: 'International mechanicals — SongTools covers now. Add column when replaced.', action: null },
    { label: 'Luminate',      count: null,      total: null,     done: null,                 note: 'n/a — chart/analytics data, not a registration. Auto-tracked via VMG DSP delivery.', action: null },
    { label: 'Missing ISRCs', count: pubNoIsrc, total: pubTotal, done: pubNoIsrc === 0,      note: '17 tracks with no ISRC — royalty collection broken for those.',  action: 'Request from VMG Assets' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-violet-400" />
            <span className="text-xs text-violet-400 font-medium uppercase tracking-wide">10 Research Group</span>
          </div>
          <h1 className="text-2xl font-bold">command center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{todayFmt}</p>
        </div>
        <TriggerBriefingButton />
      </div>

      {/* ── Work Log ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <CheckSquare className="h-3.5 w-3.5" /> recent work — past 48h (click verify to check)
        </p>
        <div className="rounded-xl border bg-card divide-y divide-border">
          {WORK_LOG.map(item => (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.detail}</p>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground shrink-0">{item.area}</span>
              {item.verifyHref !== '#' ? (
                <Link href={item.verifyHref} className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
                  verify <ArrowRight className="h-3 w-3" />
                </Link>
              ) : (
                <span className="text-[10px] text-muted-foreground shrink-0">beads CLI</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Blockers / Waiting On ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> waiting on / blockers
        </p>
        <div className="space-y-2">
          {BLOCKERS.map(b => (
            <div key={b.id} className={cn('flex items-start gap-3 rounded-xl border px-4 py-3', URGENCY[b.urgency])}>
              <span className={cn('mt-1.5 h-1.5 w-1.5 rounded-full shrink-0', URGENCY_DOT[b.urgency])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{b.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{b.detail}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-medium text-muted-foreground">{b.waitingOn}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Revenue Goal ── */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" /> revenue goal — $10k/month
          </p>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full', pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">${monthRevenue.toLocaleString()} confirmed this month</span>
          <span className="text-muted-foreground">{gap > 0 ? `$${gap.toLocaleString()} gap` : 'goal hit ✓'}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="text-center">
            <p className="text-lg font-black text-primary">{pipeline.filter((d: any) => d.status === 'confirmed').length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">confirmed</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-yellow-500">{pipeline.filter((d: any) => ['inquiry','offer','negotiating'].includes(d.status)).length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">negotiating</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black">{tasks.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">open tasks</p>
          </div>
        </div>
      </div>

      {/* ── Publishing Registrations ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Music2 className="h-3.5 w-3.5" /> publishing registrations — {pubTotal} tracks (Leigh Bray / DirtySnatcha)
          </p>
          <Link href="/dashboard/publishing" className="text-xs text-primary hover:underline">full tracker →</Link>
        </div>
        <div className="rounded-xl border bg-card divide-y divide-border">
          {PUB_ROWS.map(row => (
            <div key={row.label} className="flex items-start gap-3 px-4 py-3">
              <div className="w-5 shrink-0 mt-0.5">
                {row.done === true  && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {row.done === false && <AlertCircle  className="h-4 w-4 text-red-400" />}
                {row.done === null  && <span className="h-4 w-4 flex items-center justify-center text-muted-foreground text-xs">—</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{row.label}</p>
                  {row.count !== null && row.total !== null && (
                    <span className={cn('text-xs font-mono', row.done ? 'text-green-500' : 'text-red-400')}>
                      {row.count}/{row.total}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{row.note}</p>
                {row.action && !row.done && (
                  <p className="text-xs text-amber-500 mt-1 font-medium">→ {row.action}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Active Tasks ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <CheckSquare className="h-3.5 w-3.5" /> active tasks ({tasks.length} open)
          </p>
          <Link href="/dashboard/tasks" className="text-xs text-primary hover:underline">kanban view →</Link>
        </div>
        {Object.entries(tasksByType).length === 0 ? (
          <p className="text-sm text-muted-foreground">no open tasks</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(tasksByType).map(([type, typeTasks]) => (
              <div key={type} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide">{TYPE_LABELS[type] ?? type}</p>
                  <span className="text-xs text-muted-foreground">{typeTasks.length}</span>
                </div>
                {typeTasks.slice(0, 4).map((t: any) => {
                  const overdue = t.due_date && new Date(t.due_date) < now
                  return (
                    <div key={t.id} className="flex items-start gap-2">
                      <span className={cn('mt-1 h-1.5 w-1.5 rounded-full shrink-0', t.status === 'in_progress' ? 'bg-yellow-500' : 'bg-muted-foreground/30')} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{t.title}</p>
                        {t.due_date && (
                          <p className={cn('text-[10px]', overdue ? 'text-red-400' : 'text-muted-foreground')}>
                            {overdue ? 'overdue · ' : 'due '}{new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
                {typeTasks.length > 4 && <p className="text-[10px] text-muted-foreground">+{typeTasks.length - 4} more</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Agent Directory ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5" /> agent directory
          </p>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />{agentByStatus.production ?? 0} production</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />{agentByStatus.testing ?? 0} testing</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />{agentByStatus.building ?? 0} building</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {(['production', 'testing', 'building'] as const).map(s => (
            <div key={s} className="space-y-1.5">
              <p className={cn('text-[10px] font-medium uppercase tracking-wider pl-1', s === 'production' ? 'text-green-500' : s === 'testing' ? 'text-yellow-500' : 'text-blue-400')}>
                {s}
              </p>
              {AGENTS.filter(a => a.status === s).map(a => {
                const st = AGENT_STATUS[s]
                return (
                  <div key={a.id} className={cn('flex items-start gap-3 rounded-lg border px-4 py-2.5', st.row)}>
                    <span className={cn('mt-1.5 h-1.5 w-1.5 rounded-full shrink-0', st.dot)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.domain}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {a.skills.map(sk => (
                          <span key={sk} className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">{sk}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Products ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" /> product pipeline
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRODUCTS.map(p => {
            const s = PRODUCT_STATUS[p.status]
            return (
              <Link key={p.name} href={p.href} className={cn('rounded-xl border p-4 hover:bg-muted/40 transition-colors', s.bg)}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <span className="flex items-center gap-1 text-[10px] shrink-0 text-muted-foreground">
                    <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />{s.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{p.tagline}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{p.revenue}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Idea Factory ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5" /> idea factory
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {IDEAS.map(idea => (
            <div key={idea.name} className="rounded-xl border bg-card p-4">
              <p className="text-sm font-semibold mb-1">{idea.name}</p>
              <p className="text-xs text-muted-foreground mb-2">{idea.desc}</p>
              <span className="px-2 py-0.5 rounded-full text-[10px] border border-border text-muted-foreground">{idea.traction}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Costs ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Server className="h-3.5 w-3.5" /> cost + usage
        </p>
        <div className="rounded-xl border bg-card divide-y divide-border">
          {COSTS.map(c => (
            <div key={c.name} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.note}</p>
              </div>
              {c.link !== '#' ? (
                <a href={c.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  open <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
