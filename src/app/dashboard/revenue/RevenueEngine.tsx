'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Mic2, Music2, BookOpen, ShoppingBag, Video,
  GraduationCap, Handshake, ChevronRight, TrendingUp,
  Zap, BarChart3, Star,
} from 'lucide-react'

interface Pillar {
  id: string
  label: string
  icon: React.ElementType
  color: string
  borderColor: string
  bgColor: string
  estimate: number
  potential: number
  active: boolean
  tip: string
  cta?: { label: string; href: string }
}

interface Props {
  artistName: string
  showsPerMonth: number
  avgGuarantee: number
  liveIncome: number
  streamingIncome: number
  hasSpotify: boolean
  igFollowers: number
  upcomingRevenue: number
  nextShowsCount: number
  minimumGuarantee: number
}

const MONTHLY_GOAL = 10000

export default function RevenueEngine({
  artistName,
  showsPerMonth,
  avgGuarantee,
  liveIncome,
  streamingIncome,
  hasSpotify,
  igFollowers,
  upcomingRevenue,
  nextShowsCount,
  minimumGuarantee,
}: Props) {
  const [goalInput, setGoalInput] = useState(MONTHLY_GOAL)
  const [editingGoal, setEditingGoal] = useState(false)

  const fmt = (n: number) =>
    n >= 1000
      ? `$${(n / 1000).toFixed(1)}k`
      : `$${n.toLocaleString()}`

  const pillars: Pillar[] = [
    {
      id: 'live',
      label: 'Live Performance',
      icon: Mic2,
      color: 'text-violet-400',
      borderColor: 'border-l-violet-500',
      bgColor: 'bg-violet-500/10',
      estimate: liveIncome,
      potential: Math.round(4 * avgGuarantee * 0.8),
      active: showsPerMonth > 0,
      tip: showsPerMonth === 0
        ? `No shows this month. ${minimumGuarantee > 0 ? `Floor is $${minimumGuarantee.toLocaleString()}.` : 'Set a floor guarantee.'}`
        : `${showsPerMonth} show${showsPerMonth !== 1 ? 's' : ''} @ avg ${fmt(avgGuarantee)}. 4/mo = ${fmt(Math.round(4 * avgGuarantee * 0.8))} net.`,
      cta: { label: 'View deals', href: '/dashboard/deals' },
    },
    {
      id: 'streaming',
      label: 'Streaming Royalties',
      icon: Music2,
      color: 'text-emerald-400',
      borderColor: 'border-l-emerald-500',
      bgColor: 'bg-emerald-500/10',
      estimate: streamingIncome,
      potential: Math.round(250000 * 0.004),
      active: hasSpotify && streamingIncome > 0,
      tip: hasSpotify
        ? 'Spotify connected. ~$0.004/stream. 250K streams = $1,000/mo.'
        : 'Connect Spotify for Artists to track streams and estimate royalties.',
      cta: { label: 'Spotify analytics', href: '/dashboard/spotify' },
    },
    {
      id: 'publishing',
      label: 'Publishing / Sync',
      icon: BookOpen,
      color: 'text-blue-400',
      borderColor: 'border-l-blue-500',
      bgColor: 'bg-blue-500/10',
      estimate: 0,
      potential: 500,
      active: false,
      tip: 'PRO registration (ASCAP/BMI), MLC mechanical royalties, and SoundExchange. Most artists have uncollected income here.',
      cta: { label: 'Learn more', href: '/dashboard/analytics' },
    },
    {
      id: 'merch',
      label: 'Merch',
      icon: ShoppingBag,
      color: 'text-orange-400',
      borderColor: 'border-l-orange-500',
      bgColor: 'bg-orange-500/10',
      estimate: showsPerMonth > 0 ? Math.round(showsPerMonth * avgGuarantee * 0.15) : 0,
      potential: Math.round(4 * avgGuarantee * 0.15),
      active: showsPerMonth > 0,
      tip: `Tour merch runs 15-20% of guarantee. At ${fmt(avgGuarantee)}/show, that's ${fmt(Math.round(avgGuarantee * 0.15))}–${fmt(Math.round(avgGuarantee * 0.20))} per date.`,
    },
    {
      id: 'content',
      label: 'Content Monetization',
      icon: Video,
      color: 'text-red-400',
      borderColor: 'border-l-red-500',
      bgColor: 'bg-red-500/10',
      estimate: 0,
      potential: 300,
      active: false,
      tip: 'YouTube monetization, Patreon, fan subscriptions. Unlocks at 1,000 YouTube subscribers.',
    },
    {
      id: 'education',
      label: 'Education / Services',
      icon: GraduationCap,
      color: 'text-yellow-400',
      borderColor: 'border-l-yellow-500',
      bgColor: 'bg-yellow-500/10',
      estimate: 0,
      potential: 1000,
      active: false,
      tip: 'Sample packs, production lessons, mix consultations. High margin, no touring required.',
    },
    {
      id: 'brand',
      label: 'Brand Deals',
      icon: Handshake,
      color: 'text-pink-400',
      borderColor: 'border-l-pink-500',
      bgColor: 'bg-pink-500/10',
      estimate: 0,
      potential: 2000,
      active: igFollowers >= 10000,
      tip: igFollowers >= 10000
        ? `${(igFollowers / 1000).toFixed(1)}K IG followers. Gear, apparel, and lifestyle deals are in range.`
        : `Unlocks at 10K audience. Current IG: ${igFollowers > 0 ? (igFollowers / 1000).toFixed(1) + 'K' : 'not linked'}.`,
    },
  ]

  const totalEstimate = pillars.reduce((s, p) => s + p.estimate, 0)
  const totalPotential = pillars.reduce((s, p) => s + p.potential, 0)
  const activePillars = pillars.filter(p => p.active).length
  const progressPct = Math.min(100, Math.round((totalEstimate / goalInput) * 100))

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Revenue Engine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{artistName} — 7-pillar income framework</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <Link href="/dashboard/finance" className="text-muted-foreground hover:text-foreground">
            Finance →
          </Link>
        </div>
      </div>

      {/* Goal + Progress Card */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">monthly income goal</p>
            {editingGoal ? (
              <input
                type="number"
                value={goalInput}
                onChange={e => setGoalInput(Number(e.target.value))}
                onBlur={() => setEditingGoal(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingGoal(false)}
                className="text-3xl font-black bg-transparent border-b border-primary outline-none w-40 mt-1"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setEditingGoal(true)}
                className="text-3xl font-black hover:opacity-70 transition-opacity mt-1 flex items-center gap-2"
              >
                {fmt(goalInput)}
                <span className="text-xs font-normal text-muted-foreground">/mo — tap to edit</span>
              </button>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">estimated now</p>
            <p className={`text-3xl font-black mt-1 ${totalEstimate >= goalInput ? 'text-emerald-500' : 'text-primary'}`}>
              {fmt(totalEstimate)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-400 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progressPct}% of monthly goal</span>
            <span>{activePillars} of 7 pillars active</span>
          </div>
        </div>

        {/* Upcoming context */}
        {nextShowsCount > 0 && (
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <Zap className="h-4 w-4 text-violet-400 shrink-0" />
            <p className="text-sm">
              <span className="font-semibold">{nextShowsCount} confirmed show{nextShowsCount !== 1 ? 's' : ''} ahead</span>
              {' '}—{' '}
              <span className="text-muted-foreground">{fmt(upcomingRevenue)} in upcoming guaranteed income (80% net)</span>
            </p>
          </div>
        )}
      </div>

      {/* 7 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {pillars.map(pillar => {
          const Icon = pillar.icon
          return (
            <div
              key={pillar.id}
              className={`rounded-xl border border-l-4 ${pillar.borderColor} bg-card p-4 space-y-3 ${!pillar.active ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${pillar.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-3.5 w-3.5 ${pillar.color}`} />
                  </div>
                  <span className="text-xs font-medium">{pillar.label}</span>
                </div>
                {pillar.active
                  ? <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  : <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">inactive</span>
                }
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className={`text-2xl font-black ${pillar.active ? pillar.color : 'text-muted-foreground'}`}>
                    {fmt(pillar.estimate)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">estimated / mo</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-muted-foreground">{fmt(pillar.potential)}</p>
                  <p className="text-[10px] text-muted-foreground">potential</p>
                </div>
              </div>

              {/* Pillar tip */}
              <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-2">
                {pillar.tip}
              </p>

              {pillar.cta && (
                <Link
                  href={pillar.cta.href}
                  className={`text-[11px] ${pillar.color} hover:opacity-80 flex items-center gap-0.5`}
                >
                  {pillar.cta.label} <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'streams / mo',
            value: hasSpotify ? '—' : 'connect Spotify',
            sub: 'target: 250K',
            icon: Music2,
            color: 'text-emerald-400',
          },
          {
            label: 'save-to-stream',
            value: hasSpotify ? '—' : '—',
            sub: 'target: 15%+',
            icon: TrendingUp,
            color: 'text-blue-400',
          },
          {
            label: 'shows / mo',
            value: showsPerMonth > 0 ? `${showsPerMonth}` : '0',
            sub: 'target: 2+',
            icon: Mic2,
            color: showsPerMonth >= 2 ? 'text-violet-400' : 'text-muted-foreground',
          },
          {
            label: 'income diversity',
            value: `${activePillars} / 7`,
            sub: 'pillars active',
            icon: BarChart3,
            color: activePillars >= 3 ? 'text-yellow-400' : 'text-muted-foreground',
          },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
              </div>
              <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Full potential unlock */}
      <div className="rounded-xl border border-dashed bg-muted/30 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Full 7-pillar potential</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            If all pillars were active at target levels
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-black text-primary">{fmt(totalPotential)}</p>
          <p className="text-[10px] text-muted-foreground">/ month</p>
        </div>
      </div>
    </div>
  )
}
