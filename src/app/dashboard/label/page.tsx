import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Disc3, Users, Music2, FileText, TrendingUp,
  CheckCircle2, Clock, AlertTriangle, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Record Label — TENx10' }

export default async function LabelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: allArtists },
    { data: releases },
    { data: submissions },
    { data: recentDeals },
  ] = await Promise.all([
    // All artists linked to this manager (both managed + label)
    (supabase as any).from('artists')
      .select('id, name, stage_name, genre, spotify_artist_id, social_stats, status, is_managed')
      .eq('manager_id', user.id)
      .order('name'),

    // Recent releases
    (supabase as any).from('releases')
      .select('id, title, release_date, status, artist_id, artists(stage_name, name)')
      .order('release_date', { ascending: false })
      .limit(10),

    // A&R submissions
    (supabase as any).from('submissions')
      .select('id, artist_name, title, status, score, created_at')
      .order('created_at', { ascending: false })
      .limit(20),

    // Label-wide confirmed revenue (all artists)
    supabase.from('deals')
      .select('offer_amount, status, artist_id')
      .in('status', ['confirmed', 'completed']),
  ])

  const artists = (allArtists ?? []) as any[]
  const releaseList = (releases ?? []) as any[]
  const submissionList = (submissions ?? []) as any[]
  const deals = (recentDeals ?? []) as any[]

  const labelArtists = artists.filter((a: any) => a.is_managed === false)
  const managedArtists = artists.filter((a: any) => a.is_managed !== false)

  const totalRevenue = deals.reduce((s: number, d: any) => s + (Number(d.offer_amount) || 0), 0)
  const pendingSubmissions = submissionList.filter((s: any) => s.status === 'pending' || !s.status)
  const activeReleases = releaseList.filter((r: any) => r.status === 'live' || r.status === 'scheduled')

  const statusColor: Record<string, string> = {
    live: 'text-green-500 bg-green-500/10 border-green-500/20',
    scheduled: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    draft: 'text-muted-foreground bg-muted border-border',
    pending: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    approved: 'text-green-500 bg-green-500/10 border-green-500/20',
    rejected: 'text-red-500 bg-red-500/10 border-red-500/20',
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Disc3 className="h-4 w-4 text-violet-400" />
          <span className="text-xs text-violet-400 font-medium uppercase tracking-wide">Record Label</span>
        </div>
        <h1 className="text-2xl font-bold">DirtySnatcha Records</h1>
        <p className="text-sm text-muted-foreground mt-1">A&R, releases, and label roster — all in one place</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'label acts', value: labelArtists.length, icon: Users, color: 'text-violet-400' },
          { label: 'managed artists', value: managedArtists.length, icon: Users, color: 'text-primary' },
          { label: 'active releases', value: activeReleases.length, icon: Music2, color: 'text-green-500' },
          { label: 'confirmed revenue', value: `$${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-primary' },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                <Icon className={cn('h-4 w-4', kpi.color)} />
              </div>
              <p className="text-2xl font-black">{kpi.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Label Roster */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-400" /> Label Roster
            </h2>
            <Link href="/dashboard/artists" className="text-xs text-primary hover:underline">manage →</Link>
          </div>

          {labelArtists.length === 0 ? (
            <p className="text-sm text-muted-foreground">No label-only artists yet.</p>
          ) : (
            <div className="space-y-2">
              {labelArtists.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                  <div className="h-8 w-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-violet-400">{(a.stage_name ?? a.name ?? '?')[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.stage_name ?? a.name}</p>
                    {a.genre && <p className="text-xs text-muted-foreground">{a.genre}</p>}
                  </div>
                  {a.spotify_artist_id && <Music2 className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                </div>
              ))}
            </div>
          )}

          <div className="pt-1">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Managed Artists</h3>
            <div className="space-y-2">
              {managedArtists.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                  <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{(a.stage_name ?? a.name ?? '?')[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.stage_name ?? a.name}</p>
                    {a.genre && <p className="text-xs text-muted-foreground">{a.genre}</p>}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium shrink-0">managed</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* A&R Submissions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-yellow-500" /> A&R Submissions
              {pendingSubmissions.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold">{pendingSubmissions.length} pending</span>
              )}
            </h2>
          </div>

          {submissionList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="space-y-2">
              {submissionList.slice(0, 8).map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.title ?? 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground">{s.artist_name ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.score != null && (
                      <span className="text-xs font-bold text-primary">{s.score}</span>
                    )}
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', statusColor[s.status ?? 'pending'] ?? statusColor.pending)}>
                      {s.status ?? 'pending'}
                    </span>
                  </div>
                </div>
              ))}
              {submissionList.length > 8 && (
                <p className="text-xs text-muted-foreground text-center pt-1">{submissionList.length - 8} more submissions</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Release Pipeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Music2 className="h-4 w-4 text-green-500" /> Release Pipeline
          </h2>
          <Link href="/dashboard/catalog" className="text-xs text-primary hover:underline">catalog →</Link>
        </div>

        {releaseList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No releases yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {releaseList.map((r: any) => {
              const artistName = r.artists?.stage_name ?? r.artists?.name ?? '—'
              return (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                  <Disc3 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {artistName}{r.release_date ? ` · ${new Date(r.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                    </p>
                  </div>
                  {r.status && (
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0', statusColor[r.status] ?? statusColor.draft)}>
                      {r.status}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Action Items */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Label actions</h2>
        {[
          pendingSubmissions.length > 0 && {
            label: `${pendingSubmissions.length} A&R submission${pendingSubmissions.length !== 1 ? 's' : ''} need a vote`,
            href: '#submissions',
            urgency: 'warning' as const,
            icon: FileText,
          },
          labelArtists.filter((a: any) => !a.spotify_artist_id).length > 0 && {
            label: `${labelArtists.filter((a: any) => !a.spotify_artist_id).length} label artist${labelArtists.filter((a: any) => !a.spotify_artist_id).length !== 1 ? 's' : ''} missing Spotify`,
            href: '/dashboard/artists',
            urgency: 'info' as const,
            icon: Music2,
          },
        ].filter(Boolean).map((item: any, i) => {
          const Icon = item.icon
          const style = item.urgency === 'warning'
            ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-500'
            : 'border-blue-500/20 bg-blue-500/5 text-blue-400'
          return (
            <Link key={i} href={item.href} className={cn('flex items-center gap-3 p-3 rounded-xl border transition-colors hover:opacity-80', style)}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
            </Link>
          )
        })}
        {pendingSubmissions.length === 0 && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <p className="text-sm text-green-600 dark:text-green-400">No pending label actions.</p>
          </div>
        )}
      </div>
    </div>
  )
}
