'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Loader2, MapPin, Zap, Star, Globe, Route,
  CheckCircle2, AlertTriangle, RefreshCw, Mail,
  ArrowRight, Clock, TrendingUp, ChevronDown, ChevronUp,
} from 'lucide-react'
import type { OutreachBriefing, BriefingWindow, WarmAlert, NewMarket } from '@/app/api/outreach/briefing/route'
import type { PitchArtistSlug } from '@/lib/outreach/artist-profiles'

interface PitchState {
  loading: boolean
  result: { subject: string; body: string; dealId: string | null; marketTier?: string; ticketEstimate?: { low: number; high: number } } | null
  error: string | null
  duplicate: { message: string; contactId: string; artistSlug: string } | null
}

const ARTIST_COLORS: Record<string, string> = {
  dirtysnatcha:  'bg-primary/15 text-primary border-primary/30',
  hvrcrft:       'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  'dark-matter': 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  kotrax:        'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  whoisee:       'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30',
  'dsr-takeover':'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
}

const MANAGED_ROSTER = [
  { slug: 'dirtysnatcha', name: 'DirtySnatcha', guarantee: '$1.5K–$5K', genre: 'Dubstep / Riddim' },
  { slug: 'hvrcrft',      name: 'HVRCRFT',      guarantee: '$500–$1.5K', genre: 'Bass Music' },
  { slug: 'dark-matter',  name: 'Dark Matter',  guarantee: '$500–$1.5K', genre: 'Bass / Dubstep' },
  { slug: 'kotrax',       name: 'Kotrax',       guarantee: '$500–$1K',   genre: 'Bass Music' },
  { slug: 'whoisee',      name: 'WHOiSEE',      guarantee: '$500–$2K',   genre: 'Dubstep' },
]

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

function PitchButton({
  contactId,
  artistSlug,
  label,
  size = 'sm',
}: {
  contactId: string
  artistSlug: string
  label?: string
  size?: 'sm' | 'xs'
}) {
  const [state, setState] = useState<PitchState>({
    loading: false, result: null, error: null, duplicate: null,
  })
  const [open, setOpen] = useState(false)

  async function pitch(force = false) {
    if (state.loading) return
    setState(s => ({ ...s, loading: true, error: null, duplicate: null }))
    try {
      const res = await fetch('/api/outreach/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, artistSlug, force }),
      })
      const data = await res.json()
      if (res.status === 409 && data.error === 'duplicate_recent') {
        setState(s => ({ ...s, loading: false, duplicate: { message: data.message, contactId, artistSlug } }))
        return
      }
      if (!res.ok) throw new Error(data.error ?? 'Pitch failed')
      setState(s => ({ ...s, loading: false, result: { subject: data.draft.subject, body: data.draft.body, dealId: data.dealId, marketTier: data.meta?.marketTier, ticketEstimate: data.meta?.ticketEstimate } }))
      setOpen(true)
    } catch (e) {
      setState(s => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'Failed' }))
    }
  }

  if (state.result) {
    return (
      <div className="mt-2 space-y-1">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium"
        >
          <CheckCircle2 className="h-3 w-3" />
          Draft saved to Gmail
          {state.result?.ticketEstimate && (
            <span className="text-[10px] text-muted-foreground font-normal ml-1">
              · est. {state.result.ticketEstimate.low}–{state.result.ticketEstimate.high} tickets ({state.result.marketTier})
            </span>
          )}
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {open && (
          <div className="mt-1 rounded border bg-muted/40 p-2">
            <p className="text-[10px] font-medium text-muted-foreground mb-1">{state.result.subject}</p>
            <pre className="text-[10px] whitespace-pre-wrap font-sans max-h-32 overflow-y-auto">
              {state.result.body}
            </pre>
            {state.result.dealId && (
              <a href={`/dashboard/deals/${state.result.dealId}`} className="text-[10px] text-primary underline mt-1 block">
                View deal →
              </a>
            )}
          </div>
        )}
      </div>
    )
  }

  if (state.duplicate) {
    return (
      <div className="mt-1 space-y-1">
        <p className="text-[10px] text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Already pitched recently
        </p>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => pitch(true)}>
            Send Anyway
          </Button>
          <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2"
            onClick={() => setState(s => ({ ...s, duplicate: null }))}>
            Skip
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="default"
      className={`h-7 text-xs gap-1 ${size === 'xs' ? 'h-6 text-[10px] px-2' : ''}`}
      disabled={state.loading}
      onClick={() => pitch()}
    >
      {state.loading ? (
        <><Loader2 className="h-3 w-3 animate-spin" />Writing...</>
      ) : (
        <><Zap className="h-3 w-3" />{label ?? 'Pitch'}</>
      )}
    </Button>
  )
}

function WindowCard({ window: w }: { window: BriefingWindow }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <Card className="overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Route className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-bold text-sm">{w.label}</div>
            <div className="text-xs text-muted-foreground">
              Anchor: {w.anchorCity}, {w.anchorState} · {w.anchorDate} · {w.anchorArtist}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{w.windowRange}</Badge>
          <Badge variant="secondary" className="text-xs">{w.stops.length} stops</Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t divide-y">
          {w.stops.map((stop, i) => (
            <div key={i} className="p-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {stop.city}, {stop.state}
                    </span>
                    <Badge variant="outline" className="text-[10px]">{stop.suggestedDate}</Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {stop.drivingNote}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ARTIST_COLORS[stop.suggestedArtistSlug] ?? ''}`}>
                      {stop.suggestedArtistName}
                    </span>
                  </div>

                  <div className="mt-2 space-y-2">
                    {stop.promoters.map((p, pi) => (
                      <div key={pi} className="flex items-start justify-between gap-2 pl-4 border-l-2 border-muted">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-medium">{p.name}</span>
                            {p.company && p.company !== p.name && (
                              <span className="text-[10px] text-muted-foreground">({p.company})</span>
                            )}
                            {p.inContacts && (
                              <span className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">
                                In DB
                              </span>
                            )}
                            {p.email && (
                              <a href={`mailto:${p.email}`} className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5">
                                <Mail className="h-2.5 w-2.5" /> {p.email}
                              </a>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{p.why}</p>
                          {p.contactId && (
                            <PitchButton
                              contactId={p.contactId}
                              artistSlug={stop.suggestedArtistSlug}
                              label={`Pitch ${stop.suggestedArtistName}`}
                            />
                          )}
                          {!p.contactId && (
                            <p className="text-[10px] text-muted-foreground mt-1 italic">
                              Not in contacts — add them to pitch
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function WarmAlertCard({ alert }: { alert: WarmAlert }) {
  return (
    <Card className="border-l-4 border-l-yellow-500 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-start gap-3 flex-1">
            <Star className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{alert.contactName}</span>
                {alert.company && <span className="text-xs text-muted-foreground">{alert.company}</span>}
                {alert.city && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" /> {alert.city}
                  </span>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ARTIST_COLORS[alert.suggestedArtistSlug] ?? ''}`}>
                  {alert.suggestedArtistName}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{alert.alertMessage}</p>
              <p className="text-xs font-medium mt-1 flex items-center gap-1">
                <ArrowRight className="h-3 w-3 text-primary" /> {alert.pitchAngle}
              </p>
              {alert.contactId && (
                <div className="mt-2">
                  <PitchButton
                    contactId={alert.contactId}
                    artistSlug={alert.suggestedArtistSlug}
                    label={`Smart Pitch: ${alert.suggestedArtistName}`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NewMarketCard({ market }: { market: NewMarket }) {
  return (
    <Card className="border-l-4 border-l-blue-500 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{market.city}, {market.state}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ARTIST_COLORS[market.suggestedArtistSlug] ?? ''}`}>
                {market.suggestedArtistName}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{market.reason}</p>
            <div className="mt-2 space-y-1.5">
              {market.promoters.map((p, i) => (
                <div key={i} className="pl-3 border-l-2 border-muted">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium">{p.name}</span>
                    {p.inContacts && (
                      <span className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 rounded">In DB</span>
                    )}
                    {p.email && (
                      <a href={`mailto:${p.email}`} className="text-[10px] text-muted-foreground hover:text-primary">
                        {p.email}
                      </a>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{p.why}</p>
                  {p.contactId && (
                    <PitchButton
                      contactId={p.contactId}
                      artistSlug={market.suggestedArtistSlug}
                      label="Pitch"
                      size="xs"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BriefingClient() {
  const [briefing, setBriefing] = useState<OutreachBriefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/outreach/briefing')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load briefing')
      setBriefing(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-sm font-medium">Building your outreach briefing...</p>
          <p className="text-xs mt-1">Analyzing tour routing, relationship history, and market opportunities</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    )
  }

  if (!briefing) return null

  const totalOpportunities =
    briefing.routingWindows.reduce((s, w) => s + w.stops.length, 0) +
    briefing.warmAlerts.length +
    briefing.newMarkets.length

  return (
    <div className="space-y-8">
      {/* Your Managed Roster */}
      <div className="rounded-xl border bg-muted/20 p-4">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Your Managed Artists</p>
        <div className="flex flex-wrap gap-2">
          {MANAGED_ROSTER.map(a => (
            <div
              key={a.slug}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${ARTIST_COLORS[a.slug] ?? ''}`}
            >
              <span className="font-bold">{a.name}</span>
              <span className="opacity-60">·</span>
              <span className="opacity-80">{a.genre}</span>
              <span className="opacity-60">·</span>
              <span>{a.guarantee}</span>
            </div>
          ))}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${ARTIST_COLORS['dsr-takeover'] ?? ''}`}>
            <span className="font-bold">DSR Takeover</span>
            <span className="opacity-60">·</span>
            <span>Multi-artist package</span>
            <span className="opacity-60">·</span>
            <span>$2.5K–$7.5K</span>
          </div>
        </div>
      </div>

      {/* Briefing header */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Outreach Briefing</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {timeAgo(briefing.generatedAt)}
              </span>
            </div>
            <p className="text-base font-semibold mt-1">{briefing.summary}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="shrink-0">
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
        </div>
        {briefing.priority && (
          <div className="flex items-start gap-2 bg-primary/10 rounded-lg px-3 py-2">
            <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-primary">{briefing.priority}</p>
          </div>
        )}
        <div className="flex gap-4 text-xs text-muted-foreground pt-1">
          <span>{briefing.routingWindows.length} routing window{briefing.routingWindows.length !== 1 ? 's' : ''}</span>
          <span>{briefing.warmAlerts.length} warm alert{briefing.warmAlerts.length !== 1 ? 's' : ''}</span>
          <span>{briefing.newMarkets.length} new market{briefing.newMarkets.length !== 1 ? 's' : ''}</span>
          <span className="font-medium text-foreground">{totalOpportunities} total opportunities</span>
        </div>
      </div>

      {/* Routing Windows */}
      {briefing.routingWindows.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest">Routing Windows</h2>
          </div>
          <div className="space-y-3">
            {briefing.routingWindows.map(w => <WindowCard key={w.id} window={w} />)}
          </div>
        </section>
      )}

      {/* Warm Alerts */}
      {briefing.warmAlerts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest">Warm Alerts</h2>
            <span className="text-xs text-muted-foreground">Existing relationships — highest conversion rate</span>
          </div>
          <div className="space-y-2">
            {briefing.warmAlerts.map((a, i) => <WarmAlertCard key={i} alert={a} />)}
          </div>
        </section>
      )}

      {/* New Markets */}
      {briefing.newMarkets.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest">New Markets</h2>
            <span className="text-xs text-muted-foreground">Untapped markets worth targeting</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {briefing.newMarkets.map((m, i) => <NewMarketCard key={i} market={m} />)}
          </div>
        </section>
      )}

      {totalOpportunities === 0 && (
        <div className="py-12 text-center text-muted-foreground space-y-2">
          <Globe className="h-8 w-8 mx-auto opacity-20" />
          <p className="text-sm">No opportunities identified — add contacts or confirm tour dates to get routing suggestions.</p>
        </div>
      )}
    </div>
  )
}
