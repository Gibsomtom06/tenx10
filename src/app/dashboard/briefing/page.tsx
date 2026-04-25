import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { redirect } from 'next/navigation'
import {
  Calendar, DollarSign, AlertTriangle, CheckCircle2,
  TrendingUp, Clock, Mail, Zap, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BriefingInbox } from './BriefingInbox'

export const metadata = { title: 'Morning Briefing — TENx10' }

export default async function BriefingPage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string }>
}) {
  const { artist: artistId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const access = await getArtistAccess(supabase, artistId)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: upcomingDeals },
    { data: pendingDeals },
    { data: openTasks },
    { data: freshEmails },
    { data: recentDeals },
    { data: gmailConn },
  ] = await Promise.all([
    // Shows in next 7 days
    supabase.from('deals')
      .select('id, title, show_date, offer_amount, deal_points, status')
      .eq('artist_id', access?.artistId ?? '')
      .eq('status', 'confirmed')
      .gte('show_date', todayStr)
      .lte('show_date', sevenDaysOut)
      .order('show_date', { ascending: true }),

    // Active negotiations
    supabase.from('deals')
      .select('id, title, show_date, offer_amount, deal_points, status, created_at')
      .eq('artist_id', access?.artistId ?? '')
      .in('status', ['inquiry', 'offer', 'negotiating'])
      .order('created_at', { ascending: false }),

    // Open tasks
    supabase.from('tasks')
      .select('id, title, description, due_date, priority, status, artist_id')
      .eq('artist_id', access?.artistId ?? '')
      .neq('status', 'done')
      .order('due_date', { ascending: true })
      .limit(10),

    // Emails needing action
    supabase.from('deals')
      .select('id, title, deal_points, offer_amount, source_email_id, created_at')
      .eq('artist_id', access?.artistId ?? '')
      .eq('status', 'inquiry')
      .not('source_email_id', 'is', null)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(5),

    // Last 30d confirmed shows for revenue calc
    supabase.from('deals')
      .select('offer_amount')
      .eq('artist_id', access?.artistId ?? '')
      .in('status', ['confirmed', 'completed'])
      .gte('show_date', thirtyDaysAgo.split('T')[0]),

    // Gmail connection status
    supabase.from('gmail_connections').select('id').eq('user_id', user?.id ?? '').single(),
  ])

  const fmt = (n: number) => `$${n.toLocaleString()}`

  const upcoming7d = (upcomingDeals ?? []) as any[]
  const pending = (pendingDeals ?? []) as any[]
  const tasks = (openTasks ?? []) as any[]
  const emails = (freshEmails ?? []) as any[]
  const recent = (recentDeals ?? []) as any[]

  const monthlyRevenue = recent.reduce((s: number, d: any) => s + (Number(d.offer_amount) || 0), 0)

  // Priority score each item
  const criticalItems: Array<{ type: string; label: string; href: string; detail?: string; urgency: 'critical' | 'warning' | 'info' }> = []

  upcoming7d.forEach(d => {
    const pts = (d.deal_points ?? {}) as Record<string, string>
    const daysOut = d.show_date ? Math.ceil((new Date(d.show_date).getTime() - Date.now()) / 86400000) : null
    const city = pts.city ?? d.title
    criticalItems.push({
      type: 'show',
      label: `${city} in ${daysOut}d`,
      href: `/dashboard/deals/${d.id}`,
      detail: `Advance checklist${d.offer_amount ? ` · ${fmt(Number(d.offer_amount))}` : ''}`,
      urgency: daysOut !== null && daysOut <= 2 ? 'critical' : 'warning',
    })
  })

  pending.forEach(d => {
    const pts = (d.deal_points ?? {}) as Record<string, string>
    const city = pts.city ?? d.title
    criticalItems.push({
      type: 'deal',
      label: `${d.status === 'inquiry' ? 'New offer' : 'Negotiating'}: ${city}`,
      href: `/dashboard/deals/${d.id}`,
      detail: d.offer_amount ? fmt(Number(d.offer_amount)) : 'No amount yet',
      urgency: d.status === 'offer' ? 'warning' : 'info',
    })
  })

  tasks
    .filter((t: any) => t.priority === 'urgent' || (t.due_date && t.due_date <= sevenDaysOut))
    .forEach((t: any) => {
      criticalItems.push({
        type: 'task',
        label: t.title,
        href: '/dashboard/tasks',
        detail: t.due_date ? `Due ${new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : undefined,
        urgency: t.priority === 'urgent' ? 'critical' : 'warning',
      })
    })

  emails.forEach(e => {
    const pts = (e.deal_points ?? {}) as Record<string, string>
    criticalItems.push({
      type: 'email',
      label: `Offer needs response: ${pts.city ?? e.title}`,
      href: `/dashboard/deals/${e.id}`,
      detail: e.offer_amount ? fmt(Number(e.offer_amount)) : 'Review offer',
      urgency: 'warning',
    })
  })

  // Sort: critical first
  criticalItems.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 }
    return order[a.urgency] - order[b.urgency]
  })

  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const urgencyStyle = {
    critical: { dot: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' },
    warning: { dot: 'bg-yellow-500', text: 'text-yellow-500', bg: 'bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40' },
    info: { dot: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40' },
  }

  const typeIcon: Record<string, React.ElementType> = {
    show: Calendar, deal: DollarSign, task: CheckCircle2, email: Mail,
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-4 w-4 text-violet-400" />
          <span className="text-xs text-violet-400 font-medium uppercase tracking-wide">Morning Briefing</span>
        </div>
        <h1 className="text-2xl font-bold">{dateLabel}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {access?.artistName ?? 'Dashboard'} · {criticalItems.length === 0 ? 'Nothing urgent today.' : `${criticalItems.length} item${criticalItems.length !== 1 ? 's' : ''} need attention`}
        </p>
      </div>

      {/* Revenue Snapshot */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">30d revenue</p>
          <p className="text-xl font-black text-primary">{fmt(Math.round(monthlyRevenue * 0.8))}</p>
          <p className="text-[10px] text-muted-foreground">after commission</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">pipeline deals</p>
          <p className="text-xl font-black">{pending.length}</p>
          <p className="text-[10px] text-muted-foreground">active negotiations</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">shows this week</p>
          <p className={cn('text-xl font-black', upcoming7d.length > 0 ? 'text-yellow-500' : 'text-muted-foreground')}>
            {upcoming7d.length}
          </p>
          <p className="text-[10px] text-muted-foreground">in next 7 days</p>
        </div>
      </div>

      {/* Action Items */}
      {criticalItems.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Needs your attention</p>
          {criticalItems.map((item, i) => {
            const style = urgencyStyle[item.urgency]
            const Icon = typeIcon[item.type] ?? AlertTriangle
            return (
              <Link key={i} href={item.href} className={cn('flex items-center gap-3 p-3 rounded-xl border transition-colors', style.bg)}>
                <span className={cn('h-2 w-2 rounded-full shrink-0', style.dot)} />
                <Icon className={cn('h-4 w-4 shrink-0', style.text)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border bg-green-500/5 border-green-500/20 p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="font-semibold text-green-600 dark:text-green-400">All clear</p>
          <p className="text-sm text-muted-foreground mt-1">Nothing urgent today. Keep building momentum.</p>
        </div>
      )}

      {/* All open tasks */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Open tasks</p>
            <Link href="/dashboard/tasks" className="text-xs text-primary hover:underline">view all →</Link>
          </div>
          {tasks.slice(0, 5).map((task: any) => (
            <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <div className={cn('mt-1 h-2 w-2 rounded-full shrink-0', task.priority === 'urgent' ? 'bg-red-500' : task.status === 'in_progress' ? 'bg-yellow-500' : 'bg-muted-foreground/30')} />
              <div className="flex-1">
                <p className="text-sm font-medium">{task.title}</p>
                {task.due_date && (
                  <p className="text-xs text-muted-foreground">
                    due {new Date(task.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inbox */}
      <BriefingInbox gmailConnected={!!gmailConn} />

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
        {[
          { label: 'Pipeline', href: '/dashboard/deals', icon: DollarSign },
          { label: 'Revenue Engine', href: '/dashboard/revenue', icon: TrendingUp },
          { label: 'Ask Xai', href: '/dashboard/agent', icon: Zap },
          { label: 'Gmail', href: '/dashboard/gmail', icon: Mail },
        ].map(link => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 p-3 rounded-xl border bg-card hover:bg-muted/60 transition-colors text-sm font-medium"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              {link.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
