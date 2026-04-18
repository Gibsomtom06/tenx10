'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Loader2, TrendingUp, AlertTriangle,
  CheckCircle2, ArrowUpRight, BarChart2, ChevronDown, ChevronUp,
  Shield, Calendar, Users, Clock, Zap,
} from 'lucide-react'
import { PITCH_ARTIST_LIST, type PitchArtistSlug } from '@/lib/outreach/artist-profiles'
import type { MarketEstimate } from '@/app/api/outreach/market-estimate/route'
import type { CompetitionCheck } from '@/app/api/outreach/competition-check/route'

const RISK_COLORS = {
  low: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  high: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
}

const TIER_LABELS = {
  primary: 'Primary Market',
  secondary: 'Secondary Market',
  tertiary: 'Tertiary Market',
}

export default function MarketEstimator() {
  const [open, setOpen] = useState(false)
  const [artistSlug, setArtistSlug] = useState<PitchArtistSlug>('dirtysnatcha')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [capacity, setCapacity] = useState('')
  const [showDate, setShowDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MarketEstimate | null>(null)
  const [competition, setCompetition] = useState<CompetitionCheck | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function estimate() {
    if (!city || !state) return
    setLoading(true)
    setError(null)
    setResult(null)
    setCompetition(null)
    try {
      const [estRes, compRes] = await Promise.all([
        fetch('/api/outreach/market-estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artistSlug,
            city,
            state,
            venueCapacity: capacity ? parseInt(capacity) : undefined,
          }),
        }),
        fetch('/api/outreach/competition-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city, state, showDate: showDate || undefined }),
        }),
      ])
      const estData = await estRes.json()
      const compData = await compRes.json()
      if (!estRes.ok) throw new Error(estData.error ?? 'Estimation failed')
      setResult(estData)
      if (compRes.ok) setCompetition(compData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm uppercase tracking-widest text-primary">
              Market Estimator
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <CardDescription className="text-xs">
              Estimate ticket sales before you pitch
            </CardDescription>
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4">
          {/* Inputs */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <select
              value={artistSlug}
              onChange={e => setArtistSlug(e.target.value as PitchArtistSlug)}
              className="col-span-2 md:col-span-1 text-sm border rounded-md px-3 py-2 bg-background"
            >
              {PITCH_ARTIST_LIST.map(a => (
                <option key={a.slug} value={a.slug}>{a.name}</option>
              ))}
            </select>
            <Input placeholder="City" value={city} onChange={e => setCity(e.target.value)} className="text-sm" />
            <Input placeholder="State" value={state} onChange={e => setState(e.target.value.toUpperCase().slice(0, 2))} className="text-sm" maxLength={2} />
            <Input placeholder="Cap (opt)" value={capacity} onChange={e => setCapacity(e.target.value.replace(/\D/g, ''))} className="text-sm" type="number" />
            <Input placeholder="Show date" type="date" value={showDate} onChange={e => setShowDate(e.target.value)} className="text-sm col-span-2 md:col-span-2" />
          </div>

          <Button
            onClick={estimate}
            disabled={loading || !city || !state}
            className="w-full md:w-auto"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Running estimate...</>
            ) : (
              <><TrendingUp className="h-4 w-4 mr-2" />Estimate Market</>
            )}
          </Button>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {result && (
            <div className="space-y-4 pt-2">
              {/* Pitch anchor — the headline */}
              <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
                <p className="text-sm font-semibold text-primary">{result.pitchAnchor}</p>
              </div>

              {/* Key numbers */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border bg-background p-3 text-center">
                  <div className="text-2xl font-black">{result.ticketRange.low}–{result.ticketRange.high}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Est. Tickets</div>
                  <div className="text-[10px] text-muted-foreground">{result.fillRate} fill</div>
                </div>
                <div className="rounded-lg border bg-background p-3 text-center">
                  <div className="text-2xl font-black text-primary">
                    ${result.recommendedGuarantee.low.toLocaleString()}–{result.recommendedGuarantee.high.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Pitch Guarantee</div>
                </div>
                <div className="rounded-lg border bg-background p-3 text-center">
                  <div className={`text-2xl font-black ${result.cptProjection <= 5 ? 'text-green-600' : result.cptProjection <= 8 ? 'text-yellow-600' : 'text-red-600'}`}>
                    ${result.cptProjection.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Est. CPT</div>
                  <div className={`text-[10px] ${result.cptProjection <= 5 ? 'text-green-600' : result.cptProjection <= 8 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {result.cptProjection <= 5 ? 'target' : result.cptProjection <= 8 ? 'watch' : 'kill zone'}
                  </div>
                </div>
                <div className="rounded-lg border bg-background p-3 text-center">
                  <div className="text-2xl font-black">${result.adSpendNeeded.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Ad Budget</div>
                  <div className="text-[10px] text-muted-foreground">{TIER_LABELS[result.marketTier]}</div>
                </div>
              </div>

              {/* Risk + factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${RISK_COLORS[result.riskRating]}`}>
                      {result.riskRating.toUpperCase()} RISK
                    </span>
                  </div>
                  {result.riskFactors.length > 0 && (
                    <div className="space-y-1">
                      {result.riskFactors.map((f, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-yellow-500" />
                          {f}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  {result.upsideFactors.map((f, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <ArrowUpRight className="h-3 w-3 shrink-0 mt-0.5 text-green-500" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reasoning */}
              <p className="text-xs text-muted-foreground border-t pt-3">{result.reasoning}</p>

              {/* Competition Intelligence */}
              {competition && (
                <div className="border-t pt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest">Competition Intelligence</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${
                      competition.riskLevel === 'low' ? 'text-green-700 dark:text-green-400 border-green-500/30 bg-green-500/10' :
                      competition.riskLevel === 'medium' ? 'text-yellow-700 dark:text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                      'text-red-700 dark:text-red-400 border-red-500/30 bg-red-500/10'
                    }`}>
                      {competition.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>

                  {competition.recommendation && (
                    <p className="text-xs font-medium">{competition.recommendation}</p>
                  )}

                  {competition.festivals.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Nearby Festivals
                      </p>
                      {competition.festivals.map((f, i) => (
                        <div key={i} className="text-xs border-l-2 border-yellow-500 pl-2">
                          <span className="font-medium">{f.name}</span>
                          <span className="text-muted-foreground"> · {f.dates} · {f.distance}</span>
                          <p className="text-muted-foreground text-[10px]">{f.impact}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {competition.competingShows.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <Users className="h-3 w-3" /> Market Risks
                      </p>
                      {competition.competingShows.map((s, i) => (
                        <div key={i} className="text-[10px] text-muted-foreground">
                          <span className="font-medium text-foreground">{s.type}:</span> {s.description}
                        </div>
                      ))}
                    </div>
                  )}

                  {competition.pitchTiming && (
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Best Pitch Timing
                      </p>
                      <div className="text-[10px] text-muted-foreground space-y-0.5">
                        <p><span className="font-medium text-foreground">Best days:</span> {competition.pitchTiming.bestDays.join(', ')}</p>
                        <p><span className="font-medium text-foreground">Best months:</span> {competition.pitchTiming.bestMonths.join(', ')}</p>
                        <p><span className="font-medium text-foreground">Lead time:</span> {competition.pitchTiming.leadTime}</p>
                        <p className="italic">{competition.pitchTiming.reasoning}</p>
                      </div>
                    </div>
                  )}

                  {competition.pitchTo && competition.pitchTo.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <Zap className="h-3 w-3 text-primary" /> Who to Pitch First
                      </p>
                      {competition.pitchTo.map((p, i) => (
                        <div key={i} className={`text-xs border-l-2 pl-2 ${p.priority === 'primary' ? 'border-primary' : p.priority === 'secondary' ? 'border-yellow-500' : 'border-muted-foreground'}`}>
                          <span className="font-medium">{p.contactType}</span>
                          <span className={`ml-1.5 text-[10px] font-semibold ${p.priority === 'primary' ? 'text-primary' : 'text-muted-foreground'}`}>({p.priority})</span>
                          <p className="text-muted-foreground text-[10px]">{p.why}</p>
                          {p.notes && <p className="text-muted-foreground text-[10px] italic">{p.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
