'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Zap, Loader2, CheckCircle2, Mail, MapPin, Building2,
  Search, Globe, ArrowUpRight, Star, TrendingUp, Route,
  AlertTriangle, Calendar, DollarSign, Users,
} from 'lucide-react'
import { PITCH_ARTIST_LIST, type PitchArtistSlug } from '@/lib/outreach/artist-profiles'
import type { WarmContact } from '@/app/api/outreach/warm-contacts/route'

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
  meta?: { isWarm: boolean; hadRelationshipContext: boolean; hadRoutingContext: boolean }
}

interface RoutingGap {
  suggestedCity: string
  gap: string
  reason: string
}

interface WeekdayVenue {
  name: string
  city: string
  event_name: string | null
  day: string | null
  frequency: string | null
  why: string
  website: string | null
  booking_contact: string | null
}

const RELATIONSHIP_STYLES: Record<string, { badge: string; icon: React.ReactNode; color: string }> = {
  vip:       { badge: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30', icon: <Star className="h-3 w-3" />, color: 'border-l-yellow-500' },
  active:    { badge: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',    icon: <TrendingUp className="h-3 w-3" />, color: 'border-l-blue-500' },
  expansion: { badge: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30', icon: <Users className="h-3 w-3" />, color: 'border-l-green-500' },
  warm:      { badge: 'bg-primary/15 text-primary border-primary/30',                           icon: <CheckCircle2 className="h-3 w-3" />, color: 'border-l-primary' },
}

const STATUS_LABELS: Record<string, string> = {
  not_contacted: 'Not Contacted', drafted: 'Drafted', sent: 'Sent',
  responded: 'Responded', booked: 'Booked',
}

const ARTIST_LABELS: Record<string, string> = {
  dirtysnatcha: 'DirtySnatcha', hvrcrft: 'HVRCRFT',
  'dark-matter': 'Dark Matter', kotrax: 'Kotrax', 'dsr-takeover': 'DSR Takeover',
}

export default function SmartOutreachClient({ initialContacts }: { initialContacts: Contact[] }) {
  const [contacts] = useState<Contact[]>(initialContacts)
  const [pitching, setPitching] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, PitchResult>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selectedArtist, setSelectedArtist] = useState<Record<string, PitchArtistSlug>>({})
  const [filterRegion, setFilterRegion] = useState('all')
  const [duplicateWarning, setDuplicateWarning] = useState<{ contactId: string; message: string } | null>(null)

  // Warm contacts
  const [warmContacts, setWarmContacts] = useState<WarmContact[]>([])
  const [loadingWarm, setLoadingWarm] = useState(false)

  // Routing gaps
  const [gaps, setGaps] = useState<RoutingGap[]>([])
  const [loadingGaps, setLoadingGaps] = useState(false)

  // Promoter research
  const [searchQuery, setSearchQuery] = useState('')
  const [researching, setResearching] = useState(false)
  const [researchResults, setResearchResults] = useState<any[]>([])

  // Weekday finder
  const [weekdayRegion, setWeekdayRegion] = useState('')
  const [findingWeekday, setFindingWeekday] = useState(false)
  const [weekdayVenues, setWeekdayVenues] = useState<WeekdayVenue[]>([])
  const [weekdayError, setWeekdayError] = useState('')

  const regions = ['all', ...Array.from(new Set(contacts.map(c => c.region ?? 'Other').filter(Boolean)))]
  const filtered = filterRegion === 'all' ? contacts : contacts.filter(c => c.region === filterRegion)

  useEffect(() => {
    fetchWarmContacts()
    fetchGaps()
  }, [])

  async function fetchWarmContacts() {
    setLoadingWarm(true)
    try {
      const res = await fetch('/api/outreach/warm-contacts')
      const data = await res.json()
      if (res.ok) setWarmContacts(data.contacts ?? [])
    } finally {
      setLoadingWarm(false)
    }
  }

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

  async function findWeekdayShows() {
    setFindingWeekday(true)
    setWeekdayError('')
    setWeekdayVenues([])
    try {
      const res = await fetch('/api/outreach/weekday-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: weekdayRegion || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Search failed')
      setWeekdayVenues(data.venues ?? [])
      if (!data.venues?.length) setWeekdayError('No results found. Try a different region.')
    } catch (e) {
      setWeekdayError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setFindingWeekday(false)
    }
  }

  async function generatePitch(contactId: string, force = false) {
    const slug = selectedArtist[contactId] ?? 'dirtysnatcha'
    setPitching(contactId)
    setDuplicateWarning(null)
    try {
      const res = await fetch('/api/outreach/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, artistSlug: slug }),
      })
      const data = await res.json()

      if (res.status === 409 && data.error === 'duplicate_recent' && !force) {
        setDuplicateWarning({ contactId, message: data.message })
        return
      }

      if (res.ok) {
        setResults(prev => ({ ...prev, [contactId]: data }))
        setExpanded(contactId)
      }
    } finally {
      setPitching(null)
    }
  }

  function PitchCard({ contact, relationshipData }: { contact: Contact | WarmContact; relationshipData?: WarmContact }) {
    const result = results[contact.id]
    const isOpen = expanded === contact.id
    const isPitching = pitching === contact.id
    const isDuplWarn = duplicateWarning?.contactId === contact.id
    const rel = relationshipData ?? (warmContacts.find(w => w.id === contact.id))
    const relStyle = rel ? RELATIONSHIP_STYLES[rel.relationship] : null

    return (
      <Card key={contact.id} className={`overflow-hidden border-l-4 ${relStyle?.color ?? 'border-l-transparent'}`}>
        <CardContent className="p-0">
          <div className="flex items-start gap-3 p-4">
            <Building2 className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{contact.name}</span>
                {contact.company && contact.company !== contact.name && (
                  <span className="text-xs text-muted-foreground">{contact.company}</span>
                )}
                {rel && (
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${relStyle?.badge}`}>
                    {relStyle?.icon} {rel.relationship_label}
                  </span>
                )}
                {contact.market_type && (
                  <Badge variant="outline" className="text-xs capitalize">{contact.market_type}</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {(contact.city || contact.state) && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[contact.city, contact.state].filter(Boolean).join(', ')}
                  </span>
                )}
                {contact.email && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {contact.email}
                  </span>
                )}
              </div>
              {rel && (
                <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
                  {rel.artists_pitched.length > 0 && (
                    <span>Pitched: {rel.artists_pitched.map(a => ARTIST_LABELS[a] ?? a).join(', ')}</span>
                  )}
                  {rel.total_value > 0 && (
                    <span className="flex items-center gap-0.5"><DollarSign className="h-3 w-3" />${rel.total_value.toLocaleString()} booked</span>
                  )}
                  {rel.routing_note && (
                    <span className="text-primary flex items-center gap-0.5 font-medium">
                      <Route className="h-3 w-3" /> {rel.routing_note}
                    </span>
                  )}
                </div>
              )}
              {contact.notes && !rel && (
                <p className="text-xs text-muted-foreground mt-1">{contact.notes}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedArtist[contact.id] ?? 'dirtysnatcha'}
                onChange={e => setSelectedArtist(prev => ({ ...prev, [contact.id]: e.target.value as PitchArtistSlug }))}
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
                {isPitching ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Writing...</>
                  : result ? 'Re-pitch'
                  : rel ? <><Zap className="h-3 w-3 mr-1" />Smart Pitch</>
                  : <><Zap className="h-3 w-3 mr-1" />Generate Pitch</>}
              </Button>
            </div>
          </div>

          {isDuplWarn && (
            <div className="border-t bg-yellow-500/10 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-medium text-yellow-700 dark:text-yellow-400">{duplicateWarning.message}</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => generatePitch(contact.id, true)}>
                    Send Anyway
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDuplicateWarning(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isOpen && result && (
            <div className="border-t bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium">Draft saved to Gmail</span>
                {result.draft.to && <span className="text-xs text-muted-foreground">→ {result.draft.to}</span>}
                {result.meta?.hadRelationshipContext && (
                  <Badge variant="outline" className="text-xs text-primary border-primary/40">Relationship-aware</Badge>
                )}
                {result.meta?.hadRoutingContext && (
                  <Badge variant="outline" className="text-xs text-primary border-primary/40">Routing included</Badge>
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
                  Tracked — <a href={`/dashboard/deals/${result.dealId}`} className="underline">view deal</a>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="warm">
      <TabsList className="mb-6">
        <TabsTrigger value="warm" className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          Warm Leads
          {warmContacts.length > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 font-bold">
              {warmContacts.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="all" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" /> All Contacts
        </TabsTrigger>
        <TabsTrigger value="find" className="flex items-center gap-2">
          <Globe className="h-4 w-4" /> Find Shows
        </TabsTrigger>
      </TabsList>

      {/* ── Warm Leads ─────────────────────────────────────────────────── */}
      <TabsContent value="warm" className="space-y-4">
        {loadingWarm ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading relationship history...
          </div>
        ) : warmContacts.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <Star className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm font-medium">No warm contacts yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Warm leads appear here once you've confirmed shows or sent pitches. Start with All Contacts to build history.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
              {[
                { type: 'vip', label: 'VIP', desc: 'Multiple confirmed shows' },
                { type: 'active', label: 'Active', desc: 'In negotiation now' },
                { type: 'expansion', label: 'Expand', desc: 'DS only — intro roster' },
                { type: 'warm', label: 'Warm', desc: 'Past relationship' },
              ].map(({ type, label, desc }) => {
                const count = warmContacts.filter(w => w.relationship === type).length
                const style = RELATIONSHIP_STYLES[type]
                return count > 0 ? (
                  <div key={type} className={`rounded-lg border p-3 border-l-4 ${style.color}`}>
                    <div className="text-lg font-black">{count}</div>
                    <div className="text-xs font-medium">{label}</div>
                    <div className="text-[10px] text-muted-foreground">{desc}</div>
                  </div>
                ) : null
              })}
            </div>

            <div className="space-y-2">
              {warmContacts.map(wc => (
                <PitchCard key={wc.id} contact={wc} relationshipData={wc} />
              ))}
            </div>
          </>
        )}
      </TabsContent>

      {/* ── All Contacts ────────────────────────────────────────────────── */}
      <TabsContent value="all" className="space-y-6">
        {/* Routing Gaps */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 uppercase tracking-widest text-primary">
                <Route className="h-4 w-4" /> Routing Gaps
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={fetchGaps} disabled={loadingGaps} className="text-xs">
                {loadingGaps ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingGaps ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing tour routing...
              </div>
            ) : gaps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {gaps.map((g, i) => (
                  <div key={i} className="p-3 rounded-lg bg-background border">
                    <div className="font-bold text-primary text-sm mb-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {g.suggestedCity}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{g.gap}</p>
                    <p className="text-xs italic mb-3">"{g.reason}"</p>
                    <Button size="sm" variant="outline" className="w-full text-xs"
                      onClick={() => { setSearchQuery(g.suggestedCity); researchPromoters(g.suggestedCity) }}>
                      <Search className="h-3 w-3 mr-1" /> Find Promoters
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Add confirmed deals to get routing suggestions.</p>
            )}
          </CardContent>
        </Card>

        {/* Promoter Research */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 uppercase tracking-widest">
              <Search className="h-4 w-4" /> Promoter Research
            </CardTitle>
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
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            p.grade === 'A' ? 'bg-green-500/15 text-green-600 dark:text-green-400' :
                            p.grade === 'B' ? 'bg-blue-500/15 text-blue-600' :
                            'bg-yellow-500/15 text-yellow-600'
                          }`}>{p.grade}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">{p.why}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="text-xs space-y-0.5">
                            {p.email && <a href={`mailto:${p.email}`} className="text-primary hover:underline flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</a>}
                            {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />{p.website.replace(/^https?:\/\//, '')}</a>}
                            {!p.email && !p.website && <span className="text-muted-foreground">—</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Region filter + contact list */}
        <div className="flex gap-2 flex-wrap">
          {regions.map(r => (
            <button key={r} onClick={() => setFilterRegion(r)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filterRegion === r ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground border-border hover:text-foreground'
              }`}>
              {r === 'all' ? 'All Regions' : r}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {filtered.map(c => <PitchCard key={c.id} contact={c} />)}
          {!filtered.length && <p className="text-sm text-muted-foreground py-8 text-center">No contacts in this region.</p>}
        </div>
      </TabsContent>

      {/* ── Find Shows ──────────────────────────────────────────────────── */}
      <TabsContent value="find" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" /> Weekday Show Finder
            </CardTitle>
            <CardDescription>
              Live web search for promoters and venues running weeknight bass music events. These are your easiest bookings — less competition than weekends.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Region or city (e.g. Southeast, Chicago, Pacific Northwest)"
                value={weekdayRegion}
                onChange={e => setWeekdayRegion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && findWeekdayShows()}
                className="text-sm"
              />
              <Button onClick={findWeekdayShows} disabled={findingWeekday}>
                {findingWeekday ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {findingWeekday && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching the web for weeknight shows...
              </div>
            )}

            {weekdayError && (
              <p className="text-sm text-destructive">{weekdayError}</p>
            )}

            {weekdayVenues.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{weekdayVenues.length} weeknight venues found — verify before contacting</p>
                {weekdayVenues.map((v, i) => (
                  <Card key={i} className="border-l-4 border-l-primary/40">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{v.name}</span>
                            {v.day && <Badge variant="outline" className="text-xs">{v.day}s</Badge>}
                            {v.frequency && <Badge variant="secondary" className="text-xs capitalize">{v.frequency}</Badge>}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" /> {v.city}
                            {v.event_name && <span className="ml-2 font-medium text-foreground">"{v.event_name}"</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{v.why}</p>
                          <div className="flex gap-3 mt-2 text-xs">
                            {v.website && (
                              <a href={v.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" /> {v.website.replace(/^https?:\/\//, '')}
                              </a>
                            )}
                            {v.booking_contact && (
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {v.booking_contact}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!findingWeekday && !weekdayVenues.length && !weekdayError && (
              <div className="py-8 text-center text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Search any region to find venues running weeknight shows</p>
                <p className="text-xs mt-1">Weeknight bookings = easier yes, lower competition, good for building new markets</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
