'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Loader2, CalendarDays, Copy, Check, Camera,
  Video, Globe, Radio, Zap, Target, Eye, TrendingUp,
  RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ContentCalendar, ContentPost } from '@/app/api/content/generate/route'

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Camera,
  tiktok: Zap,
  twitter: Globe,
  facebook: Globe,
  soundcloud: Radio,
  all: Globe,
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'text-pink-500',
  tiktok: 'text-cyan-400',
  twitter: 'text-sky-400',
  facebook: 'text-blue-500',
  soundcloud: 'text-orange-500',
  all: 'text-muted-foreground',
}

const TYPE_COLORS: Record<string, string> = {
  hype: 'bg-red-500/10 text-red-600 dark:text-red-400',
  'show-announce': 'bg-primary/10 text-primary',
  'behind-scenes': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  'track-push': 'bg-green-500/10 text-green-600 dark:text-green-400',
  merch: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  'fan-engagement': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'tour-update': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
}

const GOAL_ICONS: Record<string, React.ElementType> = {
  awareness: Eye,
  engagement: TrendingUp,
  conversion: Target,
}

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function PostCard({ post }: { post: ContentPost }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const PlatformIcon = PLATFORM_ICONS[post.platform] ?? Globe
  const GoalIcon = GOAL_ICONS[post.goal] ?? Eye

  async function copy() {
    await navigator.clipboard.writeText(
      `${post.caption}\n\n${post.hashtags.map(h => `#${h}`).join(' ')}`
    )
    setCopied(true)
    toast.success('Caption copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/20"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-muted-foreground w-8 text-center">
            {DAY_NAMES[post.day]}
          </div>
          <PlatformIcon className={`h-4 w-4 ${PLATFORM_COLORS[post.platform]}`} />
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[post.type] ?? ''}`}>
            {post.type.replace('-', ' ')}
          </span>
          <span className="text-xs text-muted-foreground hidden md:block truncate max-w-48">
            {post.caption.slice(0, 60)}{post.caption.length > 60 ? '...' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <GoalIcon className="h-3 w-3 text-muted-foreground" />
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {open && (
        <div className="border-t bg-muted/10 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.caption}</p>
              {post.hashtags.length > 0 && (
                <p className="text-xs text-primary mt-2 opacity-70">
                  {post.hashtags.map(h => `#${h}`).join(' ')}
                </p>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={copy} className="shrink-0">
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">CTA:</span>{' '}
              <span className="font-medium">{post.callToAction}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Goal:</span>{' '}
              <span className="font-medium capitalize">{post.goal}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Media:</span>{' '}
              <span className="italic">{post.mediaNote}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default function ContentPage() {
  const [focus, setFocus] = useState<'show' | 'release' | 'growth' | 'engagement'>('show')
  const [weekStarting, setWeekStarting] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1)
    return d.toISOString().split('T')[0]
  })
  const [showCity, setShowCity] = useState('')
  const [showDate, setShowDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [calendar, setCalendar] = useState<ContentCalendar | null>(null)

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistSlug: 'dirtysnatcha',
          focus,
          weekStarting,
          upcomingShow: showCity && showDate ? { city: showCity, date: showDate } : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCalendar(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  async function copyAll() {
    if (!calendar) return
    const text = calendar.posts.map(p =>
      `${DAY_NAMES[p.day]} (${p.platform.toUpperCase()}) — ${p.type}\n${p.caption}\n${p.hashtags.map(h => `#${h}`).join(' ')}\nCTA: ${p.callToAction}\n`
    ).join('\n---\n\n')
    await navigator.clipboard.writeText(text)
    toast.success('All posts copied')
  }

  const FOCUS_OPTIONS = [
    { value: 'show', label: 'Show Promo', desc: 'Drive ticket sales' },
    { value: 'release', label: 'New Release', desc: 'Boost streams + saves' },
    { value: 'growth', label: 'Fan Growth', desc: 'Attract new followers' },
    { value: 'engagement', label: 'Engagement', desc: 'Build community' },
  ] as const

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-generated weekly content in DirtySnatcha's voice — ready to copy and post.
        </p>
      </div>

      {/* Generator controls */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Focus selector */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">WEEKLY FOCUS</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {FOCUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFocus(opt.value)}
                  className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                    focus === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'hover:border-muted-foreground/40 text-muted-foreground'
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-[11px] opacity-70">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Week + show details */}
          <div className="flex flex-wrap gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Week starting</p>
              <Input
                type="date"
                value={weekStarting}
                onChange={e => setWeekStarting(e.target.value)}
                className="text-sm w-40"
              />
            </div>
            {focus === 'show' && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Show city</p>
                  <Input placeholder="e.g. Denver" value={showCity} onChange={e => setShowCity(e.target.value)} className="text-sm w-36" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Show date</p>
                  <Input type="date" value={showDate} onChange={e => setShowDate(e.target.value)} className="text-sm w-40" />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={generate} disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Building calendar...</>
              ) : (
                <><CalendarDays className="h-4 w-4 mr-2" />Generate Week</>
              )}
            </Button>
            {calendar && (
              <Button variant="outline" onClick={generate} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar output */}
      {calendar && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Week Theme</p>
              <p className="font-semibold mt-0.5">{calendar.theme}</p>
              <p className="text-xs text-muted-foreground mt-1">Goal: {calendar.weeklyGoal}</p>
            </div>
            <Button variant="outline" size="sm" onClick={copyAll}>
              <Copy className="h-4 w-4 mr-1" /> Copy All Posts
            </Button>
          </div>

          {/* Posts grouped by day */}
          <div className="space-y-2">
            {calendar.posts
              .sort((a, b) => a.day - b.day)
              .map((post, i) => (
                <PostCard key={i} post={post} />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
