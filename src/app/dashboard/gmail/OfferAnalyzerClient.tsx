'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, AlertCircle, Zap, FileText } from 'lucide-react'

interface DecisionStep {
  step: number
  name: string
  pass: boolean | null
  detail: string
}

interface AnalysisResult {
  parsedOffer: {
    venueName: string | null
    venueCity: string | null
    showDate: string | null
    guarantee: number | null
    promoterName: string | null
    promoterEmail: string | null
  }
  decision: {
    steps: DecisionStep[]
    recommendation: 'accept' | 'counter' | 'decline'
    reasoning: string
    counter: {
      guarantee: number
      radiusClause: string
      paymentTerms: string
      hotelBuyout: string | null
    } | null
  }
  emailDraft: string
}

const RECOMMENDATION_STYLES = {
  accept: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  counter: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  decline: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
}

function StepIndicator({ pass }: { pass: boolean | null }) {
  if (pass === true) return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
  if (pass === false) return <XCircle className="h-4 w-4 text-red-500 shrink-0" />
  return <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
}

export default function OfferAnalyzerClient() {
  const [offerText, setOfferText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function analyze() {
    if (!offerText.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/deals/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed')
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" /> Offer Decoder
            </CardTitle>
            <CardDescription>Paste any booking offer, email, or contract text for instant analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              placeholder="Paste the offer email or contract clauses here...&#10;&#10;e.g. &#10;Hi Thomas,&#10;We'd like to book DirtySnatcha at The Venue (500 cap) on March 15.&#10;Guarantee: $2,000, deposit 50%, marketing budget $300..."
              className="w-full min-h-[320px] text-sm font-mono bg-background border rounded-md p-3 resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              value={offerText}
              onChange={e => setOfferText(e.target.value)}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              className="w-full"
              onClick={analyze}
              disabled={loading || !offerText.trim()}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analyzing...</>
              ) : (
                <><Zap className="h-4 w-4 mr-2" />Analyze & Negotiate</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick-fill examples */}
        <p className="text-xs text-muted-foreground px-1">
          Paste raw email, PDF text, or contract clauses. The 6-step decision engine evaluates guarantee floor, market viability, CPT, calendar conflicts, promoter credibility, and marketing commitment.
        </p>
      </div>

      {/* Results panel */}
      <div className="space-y-4">
        {!result && !loading && (
          <Card className="min-h-[400px] flex flex-col items-center justify-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">Analysis will appear here</p>
          </Card>
        )}

        {loading && (
          <Card className="min-h-[400px] flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Running 6-step decision engine...</p>
          </Card>
        )}

        {result && (
          <>
            {/* Recommendation */}
            <Card className={`border ${RECOMMENDATION_STYLES[result.decision.recommendation]}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black uppercase tracking-widest">
                    {result.decision.recommendation}
                  </span>
                  {result.parsedOffer.guarantee && (
                    <Badge variant="outline">${result.parsedOffer.guarantee.toLocaleString()}</Badge>
                  )}
                  {result.parsedOffer.venueName && (
                    <span className="text-sm">{result.parsedOffer.venueName}</span>
                  )}
                </div>
                <p className="text-sm mt-2 opacity-80">{result.decision.reasoning}</p>
              </CardContent>
            </Card>

            {/* 6 Steps */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-widest">6-Step Evaluation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.decision.steps.map(s => (
                  <div key={s.step} className="flex items-start gap-2">
                    <StepIndicator pass={s.pass} />
                    <div>
                      <span className="text-xs font-semibold">{s.step}. {s.name}</span>
                      <p className="text-xs text-muted-foreground">{s.detail}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Counter terms */}
            {result.decision.counter && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm uppercase tracking-widest">Counter-Offer Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-xs text-muted-foreground">
                  <p>• Guarantee: <span className="font-medium text-foreground">${result.decision.counter.guarantee.toLocaleString()}</span></p>
                  <p>• {result.decision.counter.radiusClause}</p>
                  <p>• {result.decision.counter.paymentTerms}</p>
                  {result.decision.counter.hotelBuyout && <p>• {result.decision.counter.hotelBuyout}</p>}
                </CardContent>
              </Card>
            )}

            {/* Email draft */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-widest">Generated Response</CardTitle>
                <CardDescription className="text-xs">Copy and send via Gmail</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted/40 border rounded p-3 whitespace-pre-wrap font-sans max-h-64 overflow-y-auto">
                  {result.emailDraft}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 text-xs"
                  onClick={() => navigator.clipboard.writeText(result.emailDraft)}
                >
                  Copy to Clipboard
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
