import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TriggerBriefingButton } from '../briefing/TriggerBriefingButton'
import { DiscordTestButton } from './DiscordTestButton'
import {
  Bot, Zap, CheckSquare, DollarSign, Music2, Globe, Package,
  ExternalLink, CheckCircle2, Clock, AlertCircle,
  TrendingUp, Lightbulb, Server, AlertTriangle, ArrowRight, Wrench,
} from 'lucide-react'

export const metadata = { title: '10 Research Group — Command Center' }

// ─── Work log: past 48h — Supabase migrations + platform changes ─────────────
// Sourced from supabase_migrations.schema_migrations. Edit as work completes.

const WORK_LOG = [
  // ── DB Migrations (applied to production) ──
  {
    id: 'migration-artist-invites',
    label: '[DB] Migration: artist_invites table',
    detail: 'New table for manager → artist invite tokens (7-day expiry). Used for artist join flow.',
    status: 'done' as const,
    verifyHref: '#',
    area: 'db',
  },
  {
    id: 'migration-is-managed',
    label: '[DB] Migration: is_managed column on artists',
    detail: 'Distinguishes managed artists (DirtySnatcha, WHOiSEE, Dark Matter, Kotrax) from label-only roster (MAVIC, OZZTIN, PRIYANX).',
    status: 'done' as const,
    verifyHref: '/dashboard/artists',
    area: 'db',
  },
  {
    id: 'migration-pub-table',
    label: '[DB] Migration: publishing_registrations table created',
    detail: 'Tracks per-track registration at BMI/ASCAP/MLC/SoundExchange/CMRRA per artist. 82 DS/Leigh Bray tracks seeded from BMI data.',
    status: 'done' as const,
    verifyHref: '/dashboard/publishing',
    area: 'db',
  },
  {
    id: 'migration-cmrra',
    label: '[DB] Migration: CMRRA column added to publishing_registrations',
    detail: 'cmrra_registered + cmrra_work_id columns added. CMRRA accounts 02274554/02274555 noted.',
    status: 'done' as const,
    verifyHref: '/dashboard/publishing',
    area: 'db',
  },
  {
    id: 'migration-deals-setlist',
    label: '[DB] Migration: setlist + BMI columns on deals',
    detail: 'deals.setlist (jsonb), deals.bmi_submitted, deals.bmi_submitted_at — enables setlist tracking per show.',
    status: 'done' as const,
    verifyHref: '/dashboard/deals',
    area: 'db',
  },
  {
    id: 'migration-artist-pro',
    label: '[DB] Migration: PRO fields on artists',
    detail: 'artists.pro_affiliation, pro_ipi, pro_submits_setlists. DirtySnatcha seeded: BMI, IPI 01017500116.',
    status: 'done' as const,
    verifyHref: '/dashboard/artists',
    area: 'db',
  },
  {
    id: 'migration-bmi-trigger',
    label: '[DB] Migration: BMI task trigger on deal completion (then enhanced)',
    detail: 'Trigger fires when deal → completed: creates setlist submission task. Enhanced (018) to also flag any setlist tracks not in publishing_registrations.',
    status: 'done' as const,
    verifyHref: '/dashboard/deals',
    area: 'db',
  },
  {
    id: 'tasks-seeded',
    label: '[DB] 21 tasks seeded into tasks table',
    detail: '7 publishing, 4 contract, 2 email, 3 platform, 3 business, 1 SongTools. All assigned to Thomas. Now 30 total in DB (+ 9 show-checklist tasks from trigger).',
    status: 'done' as const,
    verifyHref: '/dashboard/tasks',
    area: 'db',
  },
  // ── Platform / UI ──
  {
    id: 'briefing-trigger',
    label: '[UI] Send Briefing Now button on /dashboard/briefing',
    detail: 'Fires Discord + email on-demand without waiting for cron. Auth via Supabase session (no secret needed).',
    status: 'done' as const,
    verifyHref: '/dashboard/briefing',
    area: 'platform',
  },
  {
    id: 'tasks-kanban',
    label: '[UI] Task funnel — kanban view with color-coded types',
    detail: '8 task types with distinct colors (contract=red, publishing=amber, setlist=purple, platform=blue, business=emerald). Kanban: To Do → In Progress → Done.',
    status: 'done' as const,
    verifyHref: '/dashboard/tasks',
    area: 'platform',
  },
  {
    id: 'briefing-sections',
    label: '[UI] Morning briefing: PRO alerts + 20 tasks (was 8)',
    detail: 'Briefing now surfaces artists missing PRO registration and shows up to 20 open tasks in Discord + email.',
    status: 'done' as const,
    verifyHref: '/dashboard/briefing',
    area: 'platform',
  },
  {
    id: 'ops-dashboard',
    label: '[UI] This command center (/dashboard/ops)',
    detail: 'Full 10RG birds-eye: work log, blockers, publishing entities + per-track status, tasks, agents, products, costs.',
    status: 'done' as const,
    verifyHref: '/dashboard/ops',
    area: 'platform',
  },
  {
    id: 'beads-songtools',
    label: '[Beads] SongTools issue filed (tenx10_research-9fa, P1)',
    detail: 'Issue: cannot cancel SongTools until MLC + SoundExchange + CMRRA + AMRA all confirmed active with direct registrations.',
    status: 'done' as const,
    verifyHref: '#',
    area: 'publishing',
  },
  // ── NOT YET IN DB — known gaps ──
  {
    id: 'gap-publishers-table',
    label: '[MISSING] No publishers table in DB',
    detail: 'DSR/ASCAP account, LAB10 Publishing/BMI (IPI 1262829440), and Songtrust are NOT tracked in a dedicated table — only referenced in publishing_registrations notes field. Need a publishers entity table.',
    status: 'gap' as const,
    verifyHref: '#',
    area: 'db',
  },
  {
    id: 'gap-catalog-incomplete',
    label: '[MISSING] Catalog coverage: 82 of ~136 DS tracks seeded',
    detail: 'publishing_registrations has 82 Leigh Bray / DirtySnatcha tracks. ~54 DS tracks not yet seeded. DSR label artist tracks (OZZTIN, MAVIC, PRIYANX, etc.) not seeded.',
    status: 'gap' as const,
    verifyHref: '/dashboard/publishing',
    area: 'db',
  },
  {
    id: 'migration-019',
    label: '[DB] Migration 019: DSR ASCAP credentials stored in artists table',
    detail: 'Added pro_member_id column. DSR row: pro_affiliation=ascap, IPI #1238282844, Member ID #7423184. DirtySnatcha row: pro_affiliation=bmi, IPI #01017500116 confirmed.',
    status: 'done' as const,
    verifyHref: '/dashboard/artists',
    area: 'db',
  },
  {
    id: 'migration-020',
    label: '[DB] Migration 020: 54 DSR Records Publishing tracks imported from MLC work report',
    detail: 'Added mlc_work_id column. Imported 54 MLC-registered works under DSR entity with mlc_work_id codes. Performers: Dark Matter, Barooka, Big City, Skinz, and 30+ more DSR label artists.',
    status: 'done' as const,
    verifyHref: '/dashboard/publishing',
    area: 'db',
  },
  {
    id: 'discord-notify',
    label: '[API] /api/discord/notify — approval ping endpoint',
    detail: 'POST endpoint to send typed Discord notifications (approval/alert/info/done). Used when paused waiting for your direction. Requires auth or CRON_SECRET.',
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

// ─── Skills Being Built ────────────────────────────────────────────────────────

const SKILLS_BUILDING = [
  {
    id: 'release-registration',
    name: 'New Release Registration',
    desc: 'When a new release is added: auto-register with BMI (LAB10 Publishing), ASCAP (DSR Publishing), and MLC. Generates co-writer split sheet, submits to each society, marks DB complete.',
    status: 'planned' as const,
    societies: ['BMI', 'ASCAP', 'MLC'],
  },
  {
    id: 'discord-approvals',
    name: 'Discord Approval Flow',
    desc: 'When a workflow needs Thomas\'s sign-off (publishing submission, contract send, task review), pings Discord with action items and a verify link. No more re-explaining context.',
    status: 'building' as const,
    societies: ['Discord'],
  },
  {
    id: 'publishing-audit',
    name: 'Publishing Audit Agent',
    desc: 'Periodic scan of all tracks in DB vs registration status at BMI/ASCAP/MLC/SoundExchange/CMRRA. Flags any gaps and generates action list.',
    status: 'planned' as const,
    societies: ['BMI', 'MLC', 'SoundExchange', 'CMRRA'],
  },
  {
    id: 'skills-directory',
    name: 'Skills Directory',
    desc: 'Living doc of all agent skills, tools, and workflows with markdown specs. Agents reference it before executing tasks.',
    status: 'planned' as const,
    societies: [],
  },
]

const SKILL_STATUS = {
  building: { dot: 'bg-yellow-500', label: 'building', bg: 'bg-yellow-500/5 border-yellow-500/20' },
  planned:  { dot: 'bg-blue-400',   label: 'planned',  bg: 'bg-blue-500/5 border-blue-500/20' },
  done:     { dot: 'bg-green-500',  label: 'done',     bg: 'bg-green-500/5 border-green-500/20' },
}

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

    // Publishing registration counts — split by entity
    (supabase as any).from('publishing_registrations')
      .select('artist_id, bmi_registered, mlc_registered, soundexchange_registered, cmrra_registered, isrc'),
  ])

  const tasks   = (rawTasks    ?? []) as any[]
  const deals   = (monthDeals  ?? []) as any[]
  const pipeline = (openDeals  ?? []) as any[]
  const pub     = (pubStats    ?? []) as any[]

  // Split by entity: Leigh Bray (BMI) vs DSR Publishing (ASCAP)
  const DS_ARTIST_ID  = '3816c060-2bee-4b0e-bb27-90e8fa6392c8'
  const DSR_ARTIST_ID = '7d8723b2-c919-4645-9b99-95dd379f631f'
  const leighTracks   = pub.filter((r: any) => r.artist_id === DS_ARTIST_ID)
  const dsrTracks     = pub.filter((r: any) => r.artist_id === DSR_ARTIST_ID)

  const pubTotal  = leighTracks.length              // 82 Leigh Bray tracks
  const pubBmi    = leighTracks.filter((r: any) => r.bmi_registered).length
  const pubMlc    = leighTracks.filter((r: any) => r.mlc_registered).length
  const pubSe     = leighTracks.filter((r: any) => r.soundexchange_registered).length
  const pubCmrra  = leighTracks.filter((r: any) => r.cmrra_registered).length
  const pubNoIsrc = leighTracks.filter((r: any) => !r.isrc).length
  const dsrMlcDone = dsrTracks.filter((r: any) => r.mlc_registered).length

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

  // Publisher entity accounts (account-level, not per-track)
  const PUB_ENTITIES = [
    { name: 'Leigh Bray (songwriter)',         pro: 'BMI',     ipi: '01017500116',  status: 'active' as const, note: 'In artists table. IPI confirmed.' },
    { name: 'LAB10 Publishing (publisher)',    pro: 'BMI',     ipi: '1262829440',   status: 'active' as const, note: 'Confirmed in publishing_registrations notes. Not in a dedicated table.' },
    { name: 'DirtySnatcha Records (label)',    pro: 'ASCAP',   ipi: '1238282844',   status: 'active' as const, note: 'In artists table (migration 019). IPI #1238282844 · Member ID #7423184.' },
    { name: 'Songtrust (admin service)',       pro: 'global',  ipi: null,           status: 'warning' as const, note: 'Currently collecting int\'l mechanicals (AMRA etc). CANCEL BLOCKED until MLC/SE/CMRRA active.' },
  ]

  // Per-track registration status (82 of ~136 DS tracks in DB)
  const PUB_ROWS = [
    { label: 'BMI',           count: pubBmi,   total: pubTotal, done: pubBmi === pubTotal,  note: 'Performance royalties (live + radio). Leigh Bray songwriter + LAB10 publisher.', action: null },
    { label: 'ASCAP (per track)', count: null,  total: null,     done: null,                 note: 'n/a for Leigh Bray tracks — he is BMI. DSR has an ASCAP publisher account but Leigh Bray\'s compositions register under BMI/LAB10.', action: null },
    { label: 'MLC',           count: pubMlc,   total: pubTotal, done: pubMlc === pubTotal,   note: 'US streaming mechanicals (Spotify, Apple Music, Amazon). Most critical gap.',   action: 'Upload catalog at mlc.com' },
    { label: 'SoundExchange', count: pubSe,    total: pubTotal, done: pubSe  === pubTotal,   note: 'Digital radio (Pandora, SiriusXM, internet radio). Need performer account (Leigh Bray) + rights holder account (DSR).', action: 'soundexchange.com — create performer + label accounts' },
    { label: 'CMRRA / CA',   count: pubCmrra, total: pubTotal, done: pubCmrra === pubTotal, note: 'Canadian mechanicals. Accounts 02274554 (DSR Publishing) and 02274555 already exist. Just file the catalog.', action: 'File catalog to CMRRA accts 02274554 / 02274555' },
    { label: 'AMRA',          count: null,      total: null,     done: null,                 note: 'International mechanicals. Currently handled by Songtrust. Must replace before cancelling Songtrust.', action: null },
    { label: 'Luminate',      count: null,      total: null,     done: null,                 note: 'Not a royalty registration. Chart/analytics data — auto-tracked via VMG DSP delivery. No action needed.', action: null },
    { label: 'Missing ISRCs', count: pubNoIsrc, total: pubTotal, done: pubNoIsrc === 0,      note: `${pubNoIsrc} tracks with null ISRC in DB — royalty societies can't match streams without it.`, action: 'Request missing ISRCs from VMG Assets' },
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
        <div className="flex flex-col items-end gap-2">
          <TriggerBriefingButton />
          <DiscordTestButton />
        </div>
      </div>

      {/* ── Work Log ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <CheckSquare className="h-3.5 w-3.5" /> recent work — past 48h (click verify to check)
        </p>
        <div className="rounded-xl border bg-card divide-y divide-border">
          {WORK_LOG.map(item => (
            <div key={item.id} className={cn('flex items-start gap-3 px-4 py-3', item.status === 'gap' && 'bg-amber-500/5')}>
              {item.status === 'done'
                ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.detail}</p>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground shrink-0">{item.area}</span>
              {item.status === 'done' && item.verifyHref !== '#' ? (
                <Link href={item.verifyHref} className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
                  verify <ArrowRight className="h-3 w-3" />
                </Link>
              ) : (
                <span className="text-[10px] text-muted-foreground shrink-0">{item.status === 'gap' ? 'missing' : 'no link'}</span>
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Music2 className="h-3.5 w-3.5" /> publishing — entities + per-track status
          </p>
          <Link href="/dashboard/publishing" className="text-xs text-primary hover:underline">full tracker →</Link>
        </div>

        {/* Publisher entity accounts */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider pl-1 mb-1.5">publisher accounts (entity level)</p>
          <div className="rounded-xl border bg-card divide-y divide-border">
            {PUB_ENTITIES.map(e => (
              <div key={e.name} className="flex items-start gap-3 px-4 py-3">
                <div className="w-5 shrink-0 mt-0.5">
                  {e.status === 'active'  && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {e.status === 'warning' && <AlertCircle  className="h-4 w-4 text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{e.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{e.pro}</span>
                    {e.ipi && <span className="text-[10px] text-muted-foreground font-mono">IPI {e.ipi}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{e.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-track status */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider pl-1 mb-1.5">
            leigh bray / lab10 publishing — {pubTotal} tracks in DB · dsr records publishing — {dsrMlcDone} tracks registered at MLC
          </p>
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

      {/* ── Skills Being Built ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Wrench className="h-3.5 w-3.5" /> skills being built
        </p>
        <div className="space-y-2">
          {SKILLS_BUILDING.map(skill => {
            const s = SKILL_STATUS[skill.status]
            return (
              <div key={skill.id} className={cn('rounded-xl border px-4 py-3', s.bg)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', s.dot)} />
                      <p className="text-sm font-semibold">{skill.name}</p>
                      <span className="text-[10px] text-muted-foreground">{s.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{skill.desc}</p>
                  </div>
                  {skill.societies.length > 0 && (
                    <div className="flex flex-wrap gap-1 shrink-0">
                      {skill.societies.map(soc => (
                        <span key={soc} className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">{soc}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
