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

// ─── Work log ─────────────────────────────────────────────────────────────────
// type: 'database' = change to Supabase schema or data
//       'platform'  = UI / API code deployed to tenx10.co
//       'publishing' = royalty registration or publishing admin
//       'contracts'  = contract or deal work
// verifyNote: what to look for to confirm this is real and working

const WORK_LOG = [
  {
    id: 'migration-artist-invites',
    label: 'artist_invites table added to database',
    detail: 'New table holds manager → artist invite tokens with 7-day expiry. Powers the artist join flow.',
    verifyNote: 'Go to Supabase → Table Editor → artist_invites. You should see the table with columns: id, artist_id, token, expires_at, used.',
    status: 'done' as const,
    verifyHref: 'https://supabase.com/dashboard/project/ocscxqaythiuidkwjuvg/editor',
    area: 'database',
  },
  {
    id: 'migration-is-managed',
    label: 'is_managed column added to artists table',
    detail: 'Boolean that separates managed artists (DirtySnatcha, WHOiSEE, Dark Matter, Kotrax) from DSR label-only roster (MAVIC, OZZTIN, PRIYANX).',
    verifyNote: 'Go to Roster page. Managed artists should be tagged differently from label-only artists.',
    status: 'done' as const,
    verifyHref: '/dashboard/artists',
    area: 'database',
  },
  {
    id: 'migration-pub-table',
    label: 'publishing_registrations table created + 82 Leigh Bray tracks seeded',
    detail: 'New table tracks per-track registration status at BMI, ASCAP, MLC, SoundExchange, CMRRA. 82 DirtySnatcha / Leigh Bray tracks seeded from BMI data.',
    verifyNote: 'Go to Publishing page. You should see 82 tracks listed. BMI column should show registered. MLC, SoundExchange, CMRRA should show gaps (0 of 82).',
    status: 'done' as const,
    verifyHref: '/dashboard/publishing',
    area: 'database',
  },
  {
    id: 'migration-cmrra',
    label: 'CMRRA columns added to publishing_registrations',
    detail: 'cmrra_registered (boolean) and cmrra_work_id (text) added. CMRRA accounts 02274554 and 02274555 exist — catalog not yet filed.',
    verifyNote: 'Go to Publishing page. You should see a CMRRA column showing 0 of 82 registered — that gap is real, not a bug.',
    status: 'done' as const,
    verifyHref: '/dashboard/publishing',
    area: 'database',
  },
  {
    id: 'migration-deals-setlist',
    label: 'Setlist + BMI submission columns added to deals',
    detail: 'deals.setlist (jsonb for track list), deals.bmi_submitted (boolean), deals.bmi_submitted_at (timestamp). Lets you track setlist per show and log BMI submission.',
    verifyNote: 'Open any deal. Look for setlist section or BMI submission status. The fields exist even if empty on older deals.',
    status: 'done' as const,
    verifyHref: '/dashboard/deals',
    area: 'database',
  },
  {
    id: 'migration-artist-pro',
    label: 'PRO fields added to artists — DirtySnatcha seeded',
    detail: 'artists.pro_affiliation, pro_ipi, pro_submits_setlists added. DirtySnatcha row seeded: BMI, IPI 01017500116.',
    verifyNote: 'Go to Roster page and open DirtySnatcha. Should show BMI affiliation and IPI 01017500116. Other artists with no PRO will show blank — those are real gaps.',
    status: 'done' as const,
    verifyHref: '/dashboard/artists',
    area: 'database',
  },
  {
    id: 'migration-bmi-trigger',
    label: 'Auto-task trigger: when a show completes, create BMI setlist task',
    detail: 'Database trigger fires when a deal status changes to "completed". It creates a task to submit the setlist to BMI. Enhanced version (migration 018) also flags any setlist tracks missing from publishing_registrations.',
    verifyNote: 'Mark any confirmed deal as "completed" in the pipeline. Then go to Tasks — a new BMI setlist submission task should appear automatically.',
    status: 'done' as const,
    verifyHref: '/dashboard/deals',
    area: 'database',
  },
  {
    id: 'tasks-seeded',
    label: '21 tasks manually seeded into the tasks table',
    detail: '7 publishing tasks, 4 contract tasks, 2 email tasks, 3 platform tasks, 3 business tasks, 1 SongTools cancellation task. All assigned to Thomas.',
    verifyNote: 'Go to Tasks. You should see 30+ open tasks grouped by type. Publishing tasks (amber), contract tasks (red), platform tasks (blue) should all be visible.',
    status: 'done' as const,
    verifyHref: '/dashboard/tasks',
    area: 'database',
  },
  {
    id: 'briefing-trigger',
    label: '"Send Briefing Now" button added to morning briefing page',
    detail: 'Lets you fire the Discord + email briefing on-demand without waiting for the 7am cron. Auth uses your logged-in session — no secret key needed.',
    verifyNote: 'Go to Briefing page and click "Send Briefing Now". Within 10 seconds you should get a Discord message and an email to thomas@dirtysnatcharecords.com.',
    status: 'done' as const,
    verifyHref: '/dashboard/briefing',
    area: 'platform',
  },
  {
    id: 'tasks-kanban',
    label: 'Task kanban board with color-coded types',
    detail: '8 task types each with a distinct color. Columns: To Do → In Progress → Done. Drag or click to move tasks.',
    verifyNote: 'Go to Tasks. Should see a board view with colored cards. Contract tasks are red, publishing tasks amber, platform tasks blue, setlist tasks purple.',
    status: 'done' as const,
    verifyHref: '/dashboard/tasks',
    area: 'platform',
  },
  {
    id: 'briefing-sections',
    label: 'Morning briefing now includes PRO alerts and up to 20 tasks',
    detail: 'Previously showed 8 tasks max and no PRO alerts. Now surfaces artists with missing PRO registration (writer royalties uncollectable) and shows up to 20 open tasks.',
    verifyNote: 'Hit "Send Briefing Now" on the Briefing page. Check Discord — the embed should have a PRO Registration Needed section and an Open Tasks section with up to 20 items.',
    status: 'done' as const,
    verifyHref: '/dashboard/briefing',
    area: 'platform',
  },
  {
    id: 'ops-dashboard',
    label: '10 Research Group command center built at /dashboard/ops',
    detail: 'This page. Full birds-eye: work log with verify notes, blockers, publishing entity accounts, per-track registration gaps, active tasks, agent directory, products, skills being built, costs.',
    verifyNote: 'You are already verifying it by reading this.',
    status: 'done' as const,
    verifyHref: '/dashboard/ops',
    area: 'platform',
  },
  {
    id: 'discord-notify',
    label: 'Discord approval ping API built — fires when waiting on you',
    detail: 'POST /api/discord/notify sends a typed message to your Discord with action items and a dashboard link. Used when a workflow needs your sign-off before continuing.',
    verifyNote: 'Click the "Test Discord Ping" button at the top of this page. You should receive a Discord message with the publishing checklist approval request.',
    status: 'done' as const,
    verifyHref: '/dashboard/ops',
    area: 'platform',
  },
  {
    id: 'migration-019',
    label: 'DSR Records ASCAP credentials stored in the artists table',
    detail: 'Added pro_member_id column. DSR row now shows: pro_affiliation = ASCAP, IPI #1238282844, Member ID #7423184. DirtySnatcha confirmed BMI, IPI #01017500116.',
    verifyNote: 'Go to Roster and open the DSR row. Should show ASCAP, IPI 1238282844, Member ID 7423184. Open DirtySnatcha — should show BMI, IPI 01017500116.',
    status: 'done' as const,
    verifyHref: '/dashboard/artists',
    area: 'publishing',
  },
  {
    id: 'migration-020',
    label: '54 DSR Records Publishing works imported from the MLC work report you uploaded',
    detail: 'All 54 tracks from your mlc_work_report CSV are now in the database under the DSR entity, each with their MLC song code (e.g. RO2HAU, BE7XVL for Brainwash by Dark Matter). These are DSR label catalog tracks — separate from the 82 Leigh Bray songwriter tracks.',
    verifyNote: 'Go to Publishing page. Filter by DSR entity. Should see 54 tracks all marked MLC registered. Check that BRAINWASH by Dark Matter (MLC code BE7XVL) is in the list.',
    status: 'done' as const,
    verifyHref: '/dashboard/publishing',
    area: 'publishing',
  },
  // ── Known gaps — not done yet ──
  {
    id: 'gap-lab10-mlc',
    label: 'LAB10 Publishing: 82 Leigh Bray tracks not yet filed at MLC',
    detail: 'All 82 DirtySnatcha / Leigh Bray tracks are registered at BMI under LAB10 Publishing. None of them have been submitted to MLC yet. MLC collects US streaming mechanicals (Spotify, Apple Music, Amazon). This is the single biggest uncollected revenue gap.',
    verifyNote: 'Go to Publishing page. Leigh Bray tracks show BMI = registered, MLC = 0 of 82. That gap is real money not being collected on every stream.',
    status: 'gap' as const,
    verifyHref: '/dashboard/publishing',
    area: 'publishing',
  },
  {
    id: 'gap-catalog-incomplete',
    label: 'Catalog incomplete: ~54 DirtySnatcha tracks not yet seeded',
    detail: 'The publishing_registrations table has 82 of ~136 total DirtySnatcha tracks. The remaining ~54 tracks exist on streaming platforms but are not in the database yet. DSR label artists (OZZTIN, MAVIC, PRIYANX) also not seeded.',
    verifyNote: 'Go to Publishing page and count the rows for DirtySnatcha. Should be 82. If you know the full catalog is larger, those missing tracks = missing royalty tracking.',
    status: 'gap' as const,
    verifyHref: '/dashboard/publishing',
    area: 'publishing',
  },
  {
    id: 'gap-whoisee-pro',
    label: 'WHOiSEE has no PRO affiliation on file',
    detail: 'WHOiSEE is a managed artist but has no BMI or ASCAP registration in the system. Writer royalties from all their tracks are uncollectable until they register. Need to confirm their PRO.',
    verifyNote: 'Go to Roster and open WHOiSEE. PRO affiliation field will be blank. Ask Brett (WHOiSEE) if he is registered with BMI or ASCAP and send the IPI number.',
    status: 'gap' as const,
    verifyHref: '/dashboard/artists',
    area: 'publishing',
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
          <CheckSquare className="h-3.5 w-3.5" /> recent work + known gaps
        </p>
        <div className="rounded-xl border bg-card divide-y divide-border">
          {WORK_LOG.map(item => (
            <div key={item.id} className={cn('px-4 py-3', item.status === 'gap' && 'bg-amber-500/5')}>
              <div className="flex items-start gap-3">
                {item.status === 'done'
                  ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold leading-snug">{item.label}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px]',
                        item.area === 'database'   ? 'bg-blue-500/10 text-blue-400' :
                        item.area === 'platform'   ? 'bg-violet-500/10 text-violet-400' :
                        item.area === 'publishing' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-muted text-muted-foreground'
                      )}>{item.area}</span>
                      {item.verifyHref && item.verifyHref !== '/dashboard/ops' ? (
                        <a
                          href={item.verifyHref}
                          target={item.verifyHref.startsWith('http') ? '_blank' : undefined}
                          rel={item.verifyHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          verify <ArrowRight className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.detail}</p>
                  <div className={cn('mt-1.5 text-xs leading-relaxed rounded px-2 py-1',
                    item.status === 'gap'
                      ? 'bg-amber-500/10 text-amber-300'
                      : 'bg-muted/60 text-muted-foreground'
                  )}>
                    <span className="font-medium">{item.status === 'gap' ? 'what to do: ' : 'how to verify: '}</span>
                    {item.verifyNote}
                  </div>
                </div>
              </div>
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
