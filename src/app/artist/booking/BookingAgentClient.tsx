'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bot, Play, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  Loader2, ChevronDown, ChevronUp, Zap, MapPin, TrendingUp,
  ExternalLink, Mail,
} from 'lucide-react'
import type {
  AgentOpportunity, AgentPitch, AgentSummary, AgentDecisionStep,
} from '@/app/api/booking-agent/run/route'

type AgentState = 'idle' | 'running' | 'done' | 'error'

interface LogLine {
  type: 'status' | 'opportunity' | 'skip' | 'pitch' | 'error'
  message?: string
  data?: AgentOpportunity | AgentPitch
  ts: number
}

function StepBadge({ step }: { step: AgentDecisionStep }) {
  if (step.pass === true) return (
    <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
      <CheckCircle2 className="h-3 w-3" /> {step.label}
    </span>
  )
  if (step.pass === 'warn') return (
    <span className="flex items-center gap-1 text-[10px] text-yellow-600 dark:text-yellow-400">
      <AlertTriangle className="h-3 w-3" /> {step.label}
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[10px] text-red-500">
      <XCircle className="h-3 w-3" /> {step.label}
    </span>
  )
}

function OpportunityCard({ opp }: { opp: AgentOpportunity }) {
  const [expanded, setExpanded] = useState(false)
  const isApproved = opp.decision === 'approved'

  return (
    <Card className={`border-l-4 ${isApproved ? 'border-l-green-500' : 'border-l-muted'}`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            {isApproved
              ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              : <XCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">
                  <MapPin className="h-3 w-3 inline mr-0.5 text-muted-foreground" />
                  {opp.city}{opp.state ? `, ${opp.state}` : ''}
                </span>
                <Badge variant="outline" className="text-[10px] capitalize">{opp.artistName}</Badge>
                <Badge variant="outline" className="text-[10px] capitalize">{opp.source}</Badge>
                {opp.contactName && (
                  <span className="text-[10px] text-muted-foreground">via {opp.contactName}</span>
                )}
              </div>
              {opp.estimate && isApproved && (
                <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                  <span className="text-foreground font-medium">
                    ${opp.estimate.recommendedGuarantee.low.toLocaleString()}–${opp.estimate.recommendedGuarantee.high.toLocaleString()}
                  </span>
                  <span>{opp.estimate.ticketRange.low}–{opp.estimate.ticketRange.high} tickets</span>
                  <span>CPT ${opp.estimate.cptProjection}</span>
                  <span className="capitalize">{opp.estimate.marketTier}</span>
                </div>
              )}
              {opp.skipReason && (
                <p className="text-[10px] text-muted-foreground mt-0.5 italic">{opp.skipReason}</p>
              )}
              {opp.estimate?.pitchAnchor && isApproved && (
                <p className="text-[10px] text-primary mt-0.5">{opp.estimate.pitchAnchor}</p>
              )}
            </div>
          </div>
          {opp.steps.length > 0 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
        {expanded && opp.steps.length > 0 && (
          <div className="mt-2 pl-6 space-y-1 border-t pt-2">
            {opp.steps.map((s, i) => <StepBadge key={i} step={s} />)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PitchCard({ pitch }: { pitch: AgentPitch }) {
  const hasError = !!pitch.error
  return (
    <Card className={`border-l-4 ${hasError ? 'border-l-yellow-500' : 'border-l-primary'}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {hasError
            ? <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
            : <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">
                {pitch.city}{pitch.state ? `, ${pitch.state}` : ''}
              </span>
              <Badge variant="outline" className="text-[10px]">{pitch.artistSlug}</Badge>
              {pitch.contactName && (
                <span className="text-[10px] text-muted-foreground">{pitch.contactName}</span>
              )}
            </div>
            {pitch.error ? (
              <p className="text-[10px] text-muted-foreground mt-0.5">{pitch.error}</p>
            ) : (
              <div className="mt-0.5 space-y-0.5">
                {pitch.draftSubject && (
                  <p className="text-[10px] text-muted-foreground truncate">"{pitch.draftSubject}"</p>
                )}
                <p className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Saved to Gmail Drafts
                </p>
                {pitch.dealId && (
                  <a
                    href={`/dashboard/deals/${pitch.dealId}`}
                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                  >
                    <ExternalLink className="h-3 w-3" /> View deal
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BookingAgentClient() {
  const [state, setState] = useState<AgentState>('idle')
  const [log, setLog] = useState<LogLine[]>([])
  const [summary, setSummary] = useState<AgentSummary | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function runAgent() {
    setState('running')
    setLog([])
    setSummary(null)
    setErrorMsg(null)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/booking-agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistSlug: 'dirtysnatcha', maxPitches: 5 }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error('Agent request failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const line = part.trim()
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            const ts = Date.now()

            if (event.type === 'done') {
              setSummary(event.data as AgentSummary)
              setState('done')
            } else if (event.type === 'error') {
              setErrorMsg(event.message)
              setState('error')
            } else {
              setLog(prev => [...prev, { type: event.type, message: event.message, data: event.data, ts }])
            }
          } catch {
            // malformed event — skip
          }
        }
      }

      if (state === 'running') setState('done')
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setErrorMsg(err instanceof Error ? err.message : 'Agent failed')
        setState('error')
      }
    }
  }

  function reset() {
    abortRef.current?.abort()
    setState('idle')
    setLog([])
    setSummary(null)
    setErrorMsg(null)
  }

  const approvedOpps = summary?.opportunities.filter(o => o.decision === 'approved') ?? []
  const skippedOpps = summary?.opportunities.filter(o => o.decision === 'skipped') ?? []
  const [showSkipped, setShowSkipped] = useState(false)

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Booking Agent</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Analyzes your tour, evaluates markets against DSR booking rules, and generates outreach — autonomously.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {state === 'idle' && (
              <Button onClick={runAgent} size="sm" className="gap-1.5">
                <Play className="h-3.5 w-3.5" /> Run Agent
              </Button>
            )}
            {state === 'running' && (
              <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
                <XCircle className="h-3.5 w-3.5" /> Stop
              </Button>
            )}
            {(state === 'done' || state === 'error') && (
              <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Run Again
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Idle state */}
        {state === 'idle' && (
          <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
            <Bot className="h-8 w-8 mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              The agent will analyze your briefing, evaluate each market through 6 filters, and generate Gmail drafts for qualified targets.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                'Guarantee floor ≥ $1,500',
                'Market viability',
                'CPT < $8',
                'Calendar routing',
                'Promoter credibility',
                'Marketing commitment',
              ].map(step => (
                <Badge key={step} variant="secondary" className="text-[10px]">{step}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Running state — live log */}
        {state === 'running' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span className="font-medium text-foreground">Agent running...</span>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 max-h-64 overflow-y-auto">
              {log.map((line, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  {line.type === 'status' && (
                    <span className="text-muted-foreground">{line.message}</span>
                  )}
                  {line.type === 'opportunity' && (
                    <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Approved: {(line.data as AgentOpportunity).city}, {(line.data as AgentOpportunity).state}
                    </span>
                  )}
                  {line.type === 'skip' && (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Skipped: {(line.data as AgentOpportunity).city} — {(line.data as AgentOpportunity).skipReason}
                    </span>
                  )}
                  {line.type === 'pitch' && (
                    <span className="text-primary font-medium flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Pitch drafted: {(line.data as AgentPitch).city}
                      {(line.data as AgentPitch).error && ` — ${(line.data as AgentPitch).error}`}
                    </span>
                  )}
                  {line.type === 'error' && (
                    <span className="text-destructive">{line.message}</span>
                  )}
                </div>
              ))}
              {log.length === 0 && (
                <span className="text-xs text-muted-foreground italic">Initializing...</span>
              )}
            </div>
          </div>
        )}

        {/* Error state */}
        {state === 'error' && errorMsg && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">{errorMsg}</p>
          </div>
        )}

        {/* Done state — results */}
        {state === 'done' && summary && (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/30 p-3">
              <div className="text-center">
                <p className="text-xl font-black">{summary.analyzed}</p>
                <p className="text-[10px] text-muted-foreground">analyzed</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-green-600 dark:text-green-400">{summary.approved}</p>
                <p className="text-[10px] text-muted-foreground">approved</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-muted-foreground">{summary.skipped}</p>
                <p className="text-[10px] text-muted-foreground">skipped</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-primary">{summary.pitchesGenerated}</p>
                <p className="text-[10px] text-muted-foreground">pitches sent</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <a
                  href="https://mail.google.com/mail/u/0/#drafts"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                    <ExternalLink className="h-3 w-3" /> Gmail Drafts
                  </Button>
                </a>
              </div>
            </div>

            {/* Pitches */}
            {summary.pitches.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> Pitches Generated
                </h3>
                {summary.pitches.map((p, i) => <PitchCard key={i} pitch={p} />)}
              </div>
            )}

            {/* Approved targets */}
            {approvedOpps.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" /> Approved Targets
                </h3>
                {approvedOpps.map((o, i) => <OpportunityCard key={i} opp={o} />)}
              </div>
            )}

            {/* Skipped targets — collapsible */}
            {skippedOpps.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowSkipped(s => !s)}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showSkipped ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {skippedOpps.length} skipped target{skippedOpps.length !== 1 ? 's' : ''}
                </button>
                {showSkipped && skippedOpps.map((o, i) => <OpportunityCard key={i} opp={o} />)}
              </div>
            )}

            {summary.approved === 0 && summary.analyzed === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No opportunities found — add contacts or confirm tour dates to get routing suggestions.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
