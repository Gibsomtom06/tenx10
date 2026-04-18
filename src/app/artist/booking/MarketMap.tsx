'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Map, Loader2, RefreshCw, MapPin, Calendar, DollarSign,
  Users, X, TrendingUp, Music2, Globe, Smartphone, Radio,
  PlayCircle, Monitor,
} from 'lucide-react'
import type { MapMarket, MapDataResponse, PlatformScores } from '@/app/api/booking-agent/map-data/route'

// Dynamically import the actual map to avoid SSR issues
const MapInner = dynamic(() => import('./MapInner'), { ssr: false, loading: () => <MapSkeleton /> })

function MapSkeleton() {
  return (
    <div className="w-full h-[420px] rounded-lg bg-muted/30 border flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

type PlatformKey = keyof PlatformScores

interface Platform {
  key: PlatformKey
  label: string
  icon: React.ElementType
  color: string
}

export const PLATFORMS: Platform[] = [
  { key: 'spotify',  label: 'Spotify',  icon: Music2,      color: '#1DB954' },
  { key: 'meta',     label: 'Meta',     icon: Globe,       color: '#0082FB' },
  { key: 'tiktok',   label: 'TikTok',   icon: Smartphone,  color: '#69C9D0' },
  { key: 'apple',    label: 'Apple',    icon: Music2,      color: '#FC3C44' },
  { key: 'pandora',  label: 'Pandora',  icon: Radio,       color: '#3668FF' },
  { key: 'youtube',  label: 'YouTube',  icon: PlayCircle,  color: '#FF0000' },
  { key: 'web',      label: 'Web',      icon: Monitor,     color: '#8B5CF6' },
]

function formatAmount(amount: number | null) {
  if (!amount) return 'N/A'
  return `$${amount.toLocaleString()}`
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return 'TBD'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusDot({ status }: { status: MapMarket['pipelineStatus'] }) {
  const colors: Record<string, string> = {
    confirmed: 'bg-green-500',
    active: 'bg-yellow-500',
    opportunity: 'bg-orange-400',
    contact_only: 'bg-blue-400',
  }
  const labels: Record<string, string> = {
    confirmed: 'Confirmed / Past Show',
    active: 'Active Negotiation',
    opportunity: 'Opportunity',
    contact_only: 'Contact in Market',
  }
  if (!status) return null
  return (
    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${colors[status] ?? 'bg-muted'}`} title={labels[status]} />
  )
}

function PlatformBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score * 10}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] w-4 text-right text-muted-foreground">{score}</span>
    </div>
  )
}

export function MarketDetailPanel({
  market,
  activePlatform,
  onClose,
}: {
  market: MapMarket
  activePlatform: PlatformKey
  onClose: () => void
}) {
  const platform = PLATFORMS.find(p => p.key === activePlatform)
  const score = market.platform[activePlatform]

  return (
    <div className="absolute top-3 right-3 w-72 z-50 shadow-xl">
      <Card className="border-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {market.city}, {market.state}
              </CardTitle>
              <div className="flex items-center gap-1.5 mt-1">
                <StatusDot status={market.pipelineStatus} />
                <span className="text-[10px] text-muted-foreground capitalize">
                  {market.pipelineStatus?.replace('_', ' ') ?? 'No data'}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          {/* Active platform score */}
          <div className="rounded-lg p-2.5 border" style={{ borderColor: `${platform?.color}40`, background: `${platform?.color}10` }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: platform?.color }}>
              {platform?.label} Audience Score
            </p>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-black" style={{ color: platform?.color }}>{score}</div>
              <div className="flex-1">
                <PlatformBar score={score} color={platform?.color ?? '#888'} />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {score >= 8 ? 'Strong market — high audience density' :
                   score >= 6 ? 'Solid market — worth targeting' :
                   score >= 4 ? 'Moderate — consider supporting act' :
                   'Developing market — cold outreach needed'}
                </p>
              </div>
            </div>
          </div>

          {/* All platform scores */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">All Platforms</p>
            <div className="space-y-1.5">
              {PLATFORMS.map(p => (
                <div key={p.key} className="flex items-center gap-2">
                  <span className="text-[10px] w-14 text-muted-foreground">{p.label}</span>
                  <PlatformBar score={market.platform[p.key]} color={p.color} />
                </div>
              ))}
            </div>
          </div>

          {/* Show history */}
          {market.showCount > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Show History ({market.showCount})
              </p>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {market.allShows.map((show, i) => (
                  <div key={i} className="rounded border bg-muted/30 p-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{formatDate(show.date)}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{show.status}</Badge>
                    </div>
                    {show.venue && <p className="text-muted-foreground text-[10px] mt-0.5">{show.venue}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      {show.promoter && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Users className="h-3 w-3" /> {show.promoter}
                        </span>
                      )}
                      {show.amount && (
                        <span className="text-[10px] font-medium flex items-center gap-0.5 text-green-600 dark:text-green-400">
                          <DollarSign className="h-3 w-3" />{formatAmount(show.amount)}
                        </span>
                      )}
                    </div>
                    {show.dealId && (
                      <a href={`/artist/advance/${show.dealId}`} className="text-[10px] text-primary hover:underline mt-0.5 block">
                        View advance →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contacts */}
          {market.contacts.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                <Users className="h-3 w-3" /> Contacts ({market.contacts.length})
              </p>
              <div className="space-y-1">
                {market.contacts.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate">{c.name}</span>
                    {c.company && <span className="text-[10px] text-muted-foreground truncate ml-1">{c.company}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {market.showCount === 0 && market.contacts.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No history or contacts yet — new market.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function MarketMap() {
  const [data, setData] = useState<MapDataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePlatform, setActivePlatform] = useState<PlatformKey>('spotify')
  const [selected, setSelected] = useState<MapMarket | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/booking-agent/map-data')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load map data')
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted">
              <Map className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Market Intelligence Map</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audience density by platform · show history · contacts
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="shrink-0 h-7 text-xs gap-1">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* Platform toggle pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {PLATFORMS.map(p => {
            const Icon = p.icon
            const isActive = activePlatform === p.key
            return (
              <button
                key={p.key}
                onClick={() => setActivePlatform(p.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  isActive
                    ? 'text-white border-transparent'
                    : 'text-muted-foreground border-border hover:border-foreground/30'
                }`}
                style={isActive ? { backgroundColor: p.color, borderColor: p.color } : {}}
              >
                <Icon className="h-3 w-3" />
                {p.label}
              </button>
            )
          })}
          <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Confirmed/Past</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Active</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Contact</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 pb-4 px-4">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 mb-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="relative">
          {loading && !data ? (
            <MapSkeleton />
          ) : (
            <MapInner
              markets={data?.markets ?? []}
              activePlatform={activePlatform}
              selected={selected}
              onSelect={setSelected}
            />
          )}
          {selected && (
            <MarketDetailPanel
              market={selected}
              activePlatform={activePlatform}
              onClose={() => setSelected(null)}
            />
          )}
        </div>

        {data && (
          <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground px-1">
            <span><TrendingUp className="h-3 w-3 inline mr-0.5" />{data.markets.length} markets mapped</span>
            <span>{data.markets.filter(m => m.showCount > 0).length} with show history</span>
            <span>{data.markets.filter(m => m.contacts.length > 0).length} with contacts</span>
            <span className="ml-auto">AI audience scores — updated {new Date(data.generatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
