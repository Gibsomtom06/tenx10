'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Mail, Zap, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { DecisionResult } from '@/lib/gmail/decision-engine'
import type { ParsedOffer } from '@/lib/gmail/parse-offer'

interface Message {
  id: string
  subject: string
  from: string
  date: string
  snippet: string
  isLikelyOffer: boolean
}

interface ProcessResult {
  parsedOffer: ParsedOffer
  decision: DecisionResult
  draft: { id: string; subject: string; to: string; body: string }
  dealId: string | null
}

export default function InboxClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, ProcessResult>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/gmail/messages')
      .then(r => r.json())
      .then(d => setMessages(d.messages ?? []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))
  }, [])

  async function processOffer(messageId: string) {
    setProcessing(messageId)
    try {
      const res = await fetch('/api/gmail/process-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      })
      const data = await res.json()
      if (res.ok) {
        setResults(prev => ({ ...prev, [messageId]: data }))
        setExpanded(messageId)
      }
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading inbox...
      </div>
    )
  }

  if (!messages.length) {
    return <p className="text-sm text-muted-foreground py-4">No messages in inbox.</p>
  }

  return (
    <div className="space-y-2">
      {messages.map(msg => {
        const result = results[msg.id]
        const isProcessing = processing === msg.id
        const isOpen = expanded === msg.id

        return (
          <div key={msg.id} className="border rounded-lg overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <Mail className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{msg.subject}</span>
                  {msg.isLikelyOffer && (
                    <Badge variant="outline" className="text-xs shrink-0">Likely Offer</Badge>
                  )}
                  {result && (
                    <Badge
                      variant={
                        result.decision.recommendation === 'accept' ? 'default' :
                        result.decision.recommendation === 'counter' ? 'secondary' : 'destructive'
                      }
                      className="text-xs shrink-0"
                    >
                      {result.decision.recommendation.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{msg.from} · {msg.date}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{msg.snippet}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {result && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(isOpen ? null : msg.id)}
                  >
                    {isOpen ? 'Hide' : 'View'}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={result ? 'outline' : 'default'}
                  disabled={isProcessing}
                  onClick={() => processOffer(msg.id)}
                >
                  {isProcessing ? (
                    <><Loader2 className="h-3 w-3 animate-spin mr-1" />Processing...</>
                  ) : result ? (
                    'Re-run'
                  ) : (
                    <><Zap className="h-3 w-3 mr-1" />Process Offer</>
                  )}
                </Button>
              </div>
            </div>

            {isOpen && result && (
              <div className="border-t bg-muted/30 p-4 space-y-4">
                {/* Decision steps */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    6-Step Evaluation
                  </h4>
                  <div className="space-y-1.5">
                    {result.decision.steps.map(step => (
                      <div key={step.step} className="flex items-start gap-2 text-sm">
                        {step.pass === true ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        ) : step.pass === false ? (
                          <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-medium">{step.name}</span>
                          <span className="text-muted-foreground"> — {step.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm mt-2 font-medium">{result.decision.reasoning}</p>
                </div>

                {/* Counter terms */}
                {result.decision.counter && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Counter Terms
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>Guarantee: <span className="text-foreground font-medium">${result.decision.counter.guarantee.toLocaleString()}</span></li>
                        <li>{result.decision.counter.radiusClause}</li>
                        <li>{result.decision.counter.paymentTerms}</li>
                        {result.decision.counter.hotelBuyout && <li>{result.decision.counter.hotelBuyout}</li>}
                      </ul>
                    </div>
                  </>
                )}

                {/* Draft preview */}
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Draft Saved to Gmail
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">To: {result.draft.to}</p>
                  <pre className="text-xs bg-background border rounded p-3 whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                    {result.draft.body}
                  </pre>
                  {result.dealId && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Deal created — <a href={`/dashboard/deals/${result.dealId}`} className="underline">view deal</a>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
