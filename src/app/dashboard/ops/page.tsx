import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TriggerBriefingButton } from '../briefing/TriggerBriefingButton'
import {
  Bot, Zap, CheckSquare, DollarSign, Music2, Globe, Package,
  ExternalLink, Circle, AlertCircle, Clock, CheckCircle2,
  TrendingUp, Lightbulb, Server, Users, Wrench,
} from 'lucide-react'

export const metadata = { title: '10 Research Group — Command Center' }

// ─── Static knowledge: agent roster ───────────────────────────────────────────

const AGENTS = [
  {
    id: 'xai',
    name: 'Xai',
    codename: 'Orchestrator',
    domain: 'Routes all requests, multi-agent synthesis, daily briefings',
    status: 'production' as const,
    product: 'TENx10',
    skills: ['routing', 'synthesis', 'briefing'],
  },
  {
    id: 'booking',
    name: 'Booking Agent',
    codename: 'The Deal Maker',
    domain: 'Show offers, contract negotiation, routing, radius clauses',
    status: 'production' as const,
    product: 'TENx10',
    skills: ['deal eval', 'counter offer', 'routing', 'email drafting'],
  },
  {
    id: 'rj',
    name: 'RJ Jackson',
    codename: 'The Industry Veteran',
    domain: 'PR, editorial pitching, playlist strategy, social strategy, label ops',
    status: 'testing' as const,
    product: 'TENx10',
    skills: ['PR campaigns', 'cold email', 'press releases', 'playlist pitching'],
  },
  {
    id: 'briefing-cron',
    name: 'Morning Briefing',
    codename: 'Daily Cron',
    domain: 'Discord + email brief — shows, tasks, publishing, revenue gap',
    status: 'production' as const,
    product: 'TENx10',
    skills: ['discord webhook', 'email', 'task aggregation'],
  },
  {
    id: 'social',
    name: 'Social Media Architect',
    codename: 'The Algorithm Whisperer',
    domain: 'Platform-native content, TikTok/IG/YouTube strategy, posting cadence',
    status: 'building' as const,
    product: 'TENx10',
    skills: ['content calendar', 'caption writing', 'UGC campaigns'],
  },
  {
    id: 'manager',
    name: 'Artist Manager',
    codename: 'The Strategist',
    domain: 'Career strategy, white space identification, P&L, revenue diversification',
    status: 'testing' as const,
    product: 'TENx10',
    skills: ['P&L analysis', 'white space', 'goal tracking'],
  },
  {
    id: 'release',
    name: 'Release Agent',
    codename: 'The Launch Commander',
    domain: 'Distribution, ISRC tracking, Day 0-7 execution, Popularity Score monitoring',
    status: 'building' as const,
    product: 'TENx10',
    skills: ['VMG Assets', 'ISRC tracking', 'launch checklist'],
  },
  {
    id: 'promo',
    name: 'Promo & UGC Manager',
    codename: 'The Street Team Commander',
    domain: 'Fan activation, download gates, promo team management, grassroots',
    status: 'building' as const,
    product: 'TENx10',
    skills: ['Hypeddit', 'promo team', 'UGC campaigns'],
  },
  {
    id: 'gmail-parser',
    name: 'Gmail Offer Parser',
    codename: 'Inbox Scanner',
    domain: 'Scans Gmail for inbound show offers, extracts deal data via AI',
    status: 'production' as const,
    product: 'TENx10',
    skills: ['Gmail API', 'offer extraction', 'deal creation'],
  },
  {
    id: 'dad',
    name: 'DAD Agent',
    codename: 'Digital Asset Declutterer',
    domain: 'Email triage + file dedup across 9 accounts + 3 cloud drives',
    status: 'building' as const,
    product: 'DAD',
    skills: ['email triage', 'Drive dedup', 'OneDrive sync'],
  },
]

// ─── Static knowledge: products ───────────────────────────────────────────────

const PRODUCTS = [
  {
    name: 'TENx10 Platform',
    tagline: 'AI-powered artist management SaaS',
    url: 'https://tenx10.co',
    status: 'live-building' as const,
    revenue: 'pre-revenue',
    priority: 1,
    href: '/dashboard',
  },
  {
    name: 'DirtySnatcha Records',
    tagline: 'Label proof-of-concept. Real artists, real data.',
    url: null,
    status: 'active' as const,
    revenue: 'deals pipeline',
    priority: 2,
    href: '/dashboard/label',
  },
  {
    name: 'Management',
    tagline: '4 artists: DirtySnatcha, WHOiSEE, Dark Matter, Kotrax',
    url: null,
    status: 'active' as const,
    revenue: '10% commission',
    priority: 3,
    href: '/dashboard/artists',
  },
  {
    name: 'DAD',
    tagline: 'Digital Asset Declutterer — landing live, agent not built',
    url: 'https://tenx10.co/dad',
    status: 'partial' as const,
    revenue: 'pre-revenue',
    priority: 4,
    href: '#',
  },
  {
    name: 'MHP',
    tagline: 'My Hydration Pack — inactive',
    url: null,
    status: 'dormant' as const,
    revenue: '$0',
    priority: 5,
    href: '#',
  },
  {
    name: 'Trelis Work',
    tagline: 'Workspace brand — inactive',
    url: null,
    status: 'dormant' as const,
    revenue: '$0',
    priority: 6,
    href: '#',
  },
]

// ─── Static knowledge: idea factory ───────────────────────────────────────────

const IDEAS = [
  {
    name: 'Meme Music Generator',
    desc: 'Auto-generate + distribute memes for DSR artists. Sell custom meme packs.',
    traction: 'concept',
    distribution: 'YouTube Shorts, Reels, TikTok, Snap, Meta',
  },
  {
    name: 'Rim Shop Agent',
    desc: 'First non-music 10RG client. Wheel repair specialist MI. Scope TBD.',
    traction: 'lead',
    distribution: 'Local SEO + booking automation',
  },
  {
    name: 'DAD Full Pipeline',
    desc: 'Complete 9-account + 3-drive cleanup agent. Landing page live.',
    traction: 'landing live',
    distribution: 'tenx10.co/dad',
  },
]

// ─── Cost tracking ─────────────────────────────────────────────────────────────

const COSTS = [
  { name: 'Vercel', note: 'hosting + cron', link: 'https://vercel.com/gibsomtom06s-projects/tenx10' },
  { name: 'Supabase', note: 'DB + auth + storage', link: 'https://supabase.com/dashboard/project/ocscxqaythiuidkwjuvg' },
  { name: 'Anthropic', note: 'Claude API (build layer)', link: 'https://console.anthropic.com' },
  { name: 'Resend', note: 'transactional email', link: 'https://resend.com' },
  { name: 'Groq', note: 'offer parsing (free tier)', link: 'https://console.groq.com' },
  { name: 'SongTools', note: 'CANCEL after direct PRO registration complete', link: '#' },
  { name: 'VMG Assets', note: 'distribution — DSR', link: '#' },
]

// ─── Status style helpers ──────────────────────────────────────────────────────

const STATUS_STYLE = {
  production: { dot: 'bg-green-500', text: 'text-green-500', label: 'production', bg: 'bg-green-500/5 border-green-500/20' },
  testing: { dot: 'bg-yellow-500', text: 'text-yellow-500', label: 'testing', bg: 'bg-yellow-500/5 border-yellow-500/20' },
  building: { dot: 'bg-blue-400', text: 'text-blue-400', label: 'building', bg: 'bg-blue-500/5 border-blue-500/20' },
  planned: { dot: 'bg-muted-foreground/40', text: 'text-muted-foreground', label: 'planned', bg: 'bg-muted/30 border-border' },
}

const PRODUCT_STATUS_STYLE = {
  'live-building': { dot: 'bg-blue-400', label: 'live · building', bg: 'bg-blue-500/5 border-blue-500/20' },
  active: { dot: 'bg-green-500', label: 'active', bg: 'bg-green-500/5 border-green-500/20' },
  partial: { dot: 'bg-yellow-500', label: 'partial', bg: 'bg-yellow-500/5 border-yellow-500/20' },
  dormant: { dot: 'bg-muted-foreground/30', label: 'dormant', bg: 'bg-muted/20 border-border/40' },
}

// ─── Task type labels ──────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  contract: 'contract', email: 'email', publishing: 'publishing',
  bmi_setlist: 'setlist', platform: 'platform', business: 'business',
  show: 'show', release: 'release', promo: 'promo', general: 'general',
}

export default async function OpsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const [
    { data: rawTasks },
    { data: monthDeals },
    { data: pubGaps },
    { data: openDeals },
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

    (supabase as any).from('publishing_registrations')
      .select('id, title')
      .or('mlc_registered.eq.false,soundexchange_registered.eq.false'),

    (supabase as any).from('deals')
      .select('id, title, offer_amount, status, show_date, deal_points')
      .in('status', ['inquiry', 'offer', 'negotiating', 'confirmed'])
      .gte('show_date', now.toISOString().split('T')[0])
      .order('show_date', { ascending: true })
      .limit(10),
  ])

  const tasks = (rawTasks ?? []) as any[]
  const deals = (monthDeals ?? []) as any[]
  const gaps = (pubGaps ?? []) as any[]
  const pipeline = (openDeals ?? []) as any[]

  const monthRevenue = deals.reduce((s: number, d: any) => s + (Number(d.offer_amount) || 0), 0)
  const GOAL = 10000
  const gap = Math.max(0, GOAL - monthRevenue)
  const pct = Math.min(100, Math.round((monthRevenue / GOAL) * 100))

  // Group tasks by type
  const tasksByType: Record<string, any[]> = {}
  tasks.forEach((t: any) => {
    const k = t.type ?? 'general'
    tasksByType[k] = tasksByType[k] ?? []
    tasksByType[k].push(t)
  })

  // Count agent statuses
  const byStatus = AGENTS.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const todayFmt = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">

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

      {/* ── Revenue Goal ── */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" /> revenue goal
          </p>
          <span className="text-xs text-muted-foreground">${GOAL.toLocaleString()}/mo target</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">${monthRevenue.toLocaleString()} confirmed this month</span>
          <span className="text-muted-foreground">{gap > 0 ? `$${gap.toLocaleString()} gap` : 'goal hit'}</span>
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

      {/* ── Product Pipeline ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" /> product pipeline
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRODUCTS.map(p => {
            const s = PRODUCT_STATUS_STYLE[p.status]
            return (
              <Link
                key={p.name}
                href={p.href}
                className={cn('rounded-xl border p-4 hover:bg-muted/40 transition-colors', s.bg)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold leading-tight">{p.name}</p>
                  <span className={cn('flex items-center gap-1 text-[10px] font-medium shrink-0')}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
                    {s.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.tagline}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{p.revenue}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Agent Directory ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5" /> agent directory — employee roster
          </p>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />{byStatus.production ?? 0} prod</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />{byStatus.testing ?? 0} testing</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />{byStatus.building ?? 0} building</span>
          </div>
        </div>

        {/* Production agents */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-green-500 font-medium uppercase tracking-wider pl-1">in production</p>
          {AGENTS.filter(a => a.status === 'production').map(a => (
            <div key={a.id} className="flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{a.name}</p>
                  <span className="text-[10px] text-muted-foreground">— {a.codename}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{a.domain}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {a.skills.map(s => (
                    <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Testing agents */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-yellow-500 font-medium uppercase tracking-wider pl-1">testing</p>
          {AGENTS.filter(a => a.status === 'testing').map(a => (
            <div key={a.id} className="flex items-start gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{a.name}</p>
                  <span className="text-[10px] text-muted-foreground">— {a.codename}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{a.domain}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {a.skills.map(s => (
                    <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Building agents */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wider pl-1">building</p>
          {AGENTS.filter(a => a.status === 'building').map(a => (
            <div key={a.id} className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{a.name}</p>
                  <span className="text-[10px] text-muted-foreground">— {a.codename} · {a.product}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{a.domain}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Active Tasks ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <CheckSquare className="h-3.5 w-3.5" /> active tasks
          </p>
          <Link href="/dashboard/tasks" className="text-xs text-primary hover:underline">view kanban →</Link>
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
                {typeTasks.slice(0, 3).map((t: any) => {
                  const overdue = t.due_date && new Date(t.due_date) < now
                  return (
                    <div key={t.id} className="flex items-start gap-2">
                      <span className={cn('mt-1 h-1.5 w-1.5 rounded-full shrink-0', t.status === 'in_progress' ? 'bg-yellow-500' : 'bg-muted-foreground/40')} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{t.title}</p>
                        {t.due_date && (
                          <p className={cn('text-[10px]', overdue ? 'text-red-400' : 'text-muted-foreground')}>
                            {overdue ? 'overdue · ' : ''}{new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
                {typeTasks.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">+{typeTasks.length - 3} more</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Publishing Gaps ── */}
      {gaps.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide flex items-center gap-1.5">
              <Music2 className="h-3.5 w-3.5" /> publishing gaps
            </p>
            <Link href="/dashboard/publishing" className="text-xs text-primary hover:underline">fix now →</Link>
          </div>
          <p className="text-sm">{gaps.length} tracks missing MLC or SoundExchange registration</p>
          <p className="text-xs text-muted-foreground mt-0.5">Uncollected royalties until registered. SongTools cancel blocked until all direct registrations confirmed.</p>
        </div>
      )}

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
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full text-[10px] border border-border text-muted-foreground">{idea.traction}</span>
                <span className="text-[10px] text-muted-foreground">{idea.distribution}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cost Tracker ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Server className="h-3.5 w-3.5" /> cost + usage tracking
        </p>
        <div className="rounded-xl border bg-card divide-y divide-border">
          {COSTS.map(c => (
            <div key={c.name} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.note}</p>
              </div>
              {c.link !== '#' ? (
                <a href={c.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline">
                  dashboard <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className={cn('text-xs', c.name === 'SongTools' ? 'text-red-400 font-medium' : 'text-muted-foreground')}>
                  {c.name === 'SongTools' ? 'cancel blocked' : 'no link'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
