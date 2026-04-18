'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Zap, Loader2, CheckCircle2, Mail, MapPin, Building2, ChevronDown } from 'lucide-react'
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

export default function OutreachClient({ initialContacts }: { initialContacts: Contact[] }) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [pitching, setPitching] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, PitchResult>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selectedArtist, setSelectedArtist] = useState<Record<string, PitchArtistSlug>>({})
  const [filterRegion, setFilterRegion] = useState<string>('all')

  const regions = ['all', ...Array.from(new Set(contacts.map(c => c.region ?? 'Other').filter(Boolean)))]

  const filtered = filterRegion === 'all'
    ? contacts
    : contacts.filter(c => c.region === filterRegion)

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
    <div className="space-y-4">
      {/* Filters */}
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

      {/* Contact list */}
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

                  {/* Artist selector + pitch button */}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(isOpen ? null : contact.id)}
                      >
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
                      ) : result ? (
                        'Re-pitch'
                      ) : (
                        <><Zap className="h-3 w-3 mr-1" />Generate Pitch</>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Pitch result */}
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
