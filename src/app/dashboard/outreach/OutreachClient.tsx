'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Zap, Loader2, CheckCircle2, Mail, MapPin, Building2,
  Search, Globe, ArrowUpRight, XCircle,
} from 'lucide-react'
import { PITCH_ARTIST_LIST, type PitchArtistSlug } from '@/lib/outreach/artist-profiles'

interface Contact {
  id: string
  name: string
  company: string | null
  email: string | null
  city: string | null
  state: string | null
  region: string | null
  market_type: string | null
  pitch_status: string | null
  last_pitched_at: string | null
  notes: string | null
}

interface PitchResult {
  draft: { id: string; subject: string; to: string | null; body: string }
  dealId: string | null
}

interface RoutingGap {
  suggestedCity: string
  gap: string
  reason: string
}

interface ResearchedPromoter {
  name: string
  city: string
  grade: string
  why: string
  email: string | null
  website: string | null
}

const STATUS_COLORS: Record<string, string> = {
  not_contacted: 'secondary',
  drafted: 'outline',
  sent: 'default',
  responded: 'default',
  booked: 'default',
}

const STATUS_LABELS: Record<string, string> = {
  not_contacted: 'Not Contacted',
  drafted: 'Drafted',
  sent: 'Sent',
  responded: 'Responded',
  booked: 'Booked',
}

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-500/15 text-green-600 dark:text-green-400',
  B: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  C: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  D: 'bg-red-500/15 text-red-600 dark:text-red-400',
}

export default function OutreachClient({ initialContacts }: { initialContacts: Contact[] }) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [pitching, setPitching] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, PitchResult>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selectedArtist, setSelectedArtist] = useState<Record<string, PitchArtistSlug>>({})
  const [filterRegion, setFilterRegion] = useState<string>('all')

  // Routing gaps
  const [gaps, setGaps] = useState<RoutingGap[]>([])
  const [loadingGaps, setLoadingGaps] = useState(false)

  // Promoter research
  const [searchQuery, setSearchQuery] = useState('')
  const [researching, setResearching] = useState(false)
  const [researchResults, setResearchResults] = useState<ResearchedPromoter[]>([])
  const [researchCity, setResearchCity] = useState('')

  const regions = ['all', ...Array.from(new Set(contacts.map(c => c.region ?? 'Other').filter(Boolean)))]

  const filtered = filterRegion === 'all'
    ? contacts
    : contacts.filter(c => c.region === filterRegion)

  useEffect(() => {
    fetchGaps()
  }, [])

  async function fetchGaps() {
    setLoadingGaps(true)
    try {
      const res = await fetch('/api/outreach/routing-gaps')
      const data = await res.json()
      if (res.ok) setGaps(data.suggestions ?? [])
    } finally {
      setLoadingGaps(false)
    }
  }

  async function researchPromoters(city?: string) {
    const q = city ?? searchQuery
    if (!q.trim()) return
    setResearching(true)
    setResearchCity(q)
    try {
      const res = await fetch('/api/outreach/research-promoter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: q }),
      })
      const data = await res.json()
      if (res.ok) setResearchResults(data.promoters ?? [])
    } finally {
      setResearching(false)
    }
  }

  async function generatePitch(contactId: string) {
    const slug = selectedArtist[contactId] ?? 'dirtysnatcha'
    setPitching(contactId)
    try {
      const res = await fetch('/api/outreach/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, artistSlug: slug }),
      })
      const data = await res.json()
      if (res.ok) {
        setResults(prev => ({ ...prev, [contactId]: data }))
        setExpanded(contactId)
        setContacts(prev => prev.map(c =>
          c.id === contactId ? { ...c, pitch_status: 'drafted' } : c
        ))
      }
    } finally {
      setPitching(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Routing Gap Analysis */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2 uppercase tracking-widest text-primary">
              <Zap className="h-4 w-4" /> Routing Gap Analysis
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchGaps} disabled={loadingGaps} className="text-xs">
              {loadingGaps ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Refresh'}
            </Button>
          </div>
          <CardDescription>AI-identified gaps in your current tour routing</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingGaps ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing tour routing...
            </div>
          ) : gaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {gaps.map((g, i) => (
                <div key={i} className="p-4 rounded-lg bg-background border">
                  <div className="font-bold text-primary text-sm mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {g.suggestedCity}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{g.gap}</p>
                  <p className="text-xs italic mb-3">"{g.reason}"</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => {
                      setSearchQuery(g.suggestedCity)
                      researchPromoters(g.suggestedCity)
                    }}
                  >
                    <Search className="h-3 w-3 mr-1" /> Find Promoters
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No routing data yet — add confirmed deals to get suggestions.</p>
          )}
        </CardContent>
      </Card>

      {/* Promoter Research */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 uppercase tracking-widest">
            <Globe className="h-4 w-4" /> Promoter Intelligence
          </CardTitle>
          <CardDescription>AI research on promoters and venues by city</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="City name (e.g. Seattle, WA)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && researchPromoters()}
              className="text-sm"
            />
            <Button onClick={() => researchPromoters()} disabled={researching || !searchQuery.trim()}>
              {researching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {researchResults.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Results for <span className="font-medium">{researchCity}</span> — based on AI knowledge (verify before contacting)</p>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-[11px] uppercase font-semibold text-muted-foreground">
                      <th className="px-4 py-2 text-left">Promoter / Venue</th>
                      <th className="px-4 py-2 text-center">Grade</th>
                      <th className="px-4 py-2 text-left hidden md:table-cell">Notes</th>
                      <th className="px-4 py-2 text-left hidden md:table-cell">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {researchResults.map((p, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground md:hidden">{p.why}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${GRADE_COLORS[p.grade] ?? GRADE_COLORS.C}`}>
                            {p.grade}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">{p.why}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex flex-col gap-0.5 text-xs">
                            {p.email && (
                              <a href={`mailto:${p.email}`} className="text-primary hover:underline flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {p.email}
                              </a>
                            )}
                            {p.website && (
                              <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" /> {p.website.replace(/^https?:\/\//, '')}
                              </a>
                            )}
                            {!p.email && !p.website && <span className="text-muted-foreground">—</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Region Filters */}
      <div className="flex gap-2 flex-wrap">
        {regions.map(r => (
          <button
            key={r}
            onClick={() => setFilterRegion(r)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filterRegion === r
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {r === 'all' ? 'All Regions' : r}
          </button>
        ))}
      </div>

      {/* Contact List */}
      <div className="space-y-2">
        {filtered.map(contact => {
          const result = results[contact.id]
          const isOpen = expanded === contact.id
          const isPitching = pitching === contact.id

          return (
            <Card key={contact.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-start gap-3 p-4">
                  <Building2 className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{contact.name}</span>
                      {contact.company && contact.company !== contact.name && (
                        <span className="text-xs text-muted-foreground">{contact.company}</span>
                      )}
                      <Badge variant={STATUS_COLORS[contact.pitch_status ?? 'not_contacted'] as any} className="text-xs">
                        {STATUS_LABELS[contact.pitch_status ?? 'not_contacted']}
                      </Badge>
                      {contact.market_type && (
                        <Badge variant="outline" className="text-xs capitalize">{contact.market_type}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {(contact.city || contact.state) && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[contact.city, contact.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {contact.email && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </span>
                      )}
                    </div>
                    {contact.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{contact.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={selectedArtist[contact.id] ?? 'dirtysnatcha'}
                      onChange={e => setSelectedArtist(prev => ({
                        ...prev,
                        [contact.id]: e.target.value as PitchArtistSlug,
                      }))}
                      className="text-xs border rounded px-2 py-1 bg-background"
                    >
                      {PITCH_ARTIST_LIST.map(a => (
                        <option key={a.slug} value={a.slug}>{a.name}</option>
                      ))}
                    </select>
                    {result && (
                      <Button variant="ghost" size="sm" onClick={() => setExpanded(isOpen ? null : contact.id)}>
                        {isOpen ? 'Hide' : 'View'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={result ? 'outline' : 'default'}
                      disabled={isPitching}
                      onClick={() => generatePitch(contact.id)}
                    >
                      {isPitching ? (
                        <><Loader2 className="h-3 w-3 animate-spin mr-1" />Writing...</>
                      ) : result ? 'Re-pitch' : (
                        <><Zap className="h-3 w-3 mr-1" />Generate Pitch</>
                      )}
                    </Button>
                  </div>
                </div>

                {isOpen && result && (
                  <div className="border-t bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-xs font-medium">Draft saved to Gmail</span>
                      {result.draft.to && (
                        <span className="text-xs text-muted-foreground">→ {result.draft.to}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 font-medium">{result.draft.subject}</p>
                      <pre className="text-xs bg-background border rounded p-3 whitespace-pre-wrap font-sans max-h-52 overflow-y-auto">
                        {result.draft.body}
                      </pre>
                    </div>
                    {result.dealId && (
                      <p className="text-xs text-muted-foreground">
                        Inquiry tracked — <a href={`/dashboard/deals/${result.dealId}`} className="underline">view deal</a>
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {!filtered.length && (
          <p className="text-sm text-muted-foreground py-8 text-center">No contacts in this region.</p>
        )}
      </div>
    </div>
  )
}
