'use client'

import type { ReactElement } from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Star, TrendingUp, MapPin, RefreshCw, Loader2, Zap,
  CheckCircle2, AlertTriangle, Users,
} from 'lucide-react'
import type { WarmContact } from '@/app/api/outreach/warm-contacts/route'

const RELATIONSHIP_STYLE: Record<string, { badge: string; icon: ReactElement; label: string }> = {
  vip:       { badge: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30', icon: <Star className="h-3 w-3" />,        label: 'VIP' },
  active:    { badge: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',     icon: <TrendingUp className="h-3 w-3" />,    label: 'Active' },
  expansion: { badge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30', icon: <Zap className="h-3 w-3" />,           label: 'Expand' },
  warm:      { badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',         icon: <CheckCircle2 className="h-3 w-3" />,  label: 'Warm' },
}

const ARTIST_SLUG_LABEL: Record<string, string> = {
  dirtysnatcha:  'DS',
  hvrcrft:       'HVRCR',
  'dark-matter': 'DM',
  kotrax:        'KTX',
  whoisee:       'WHO',
  'dsr-takeover':'DSR',
}

function ContactRow({ contact, rank }: { contact: WarmContact; rank: number }) {
  const style = RELATIONSHIP_STYLE[contact.relationship] ?? RELATIONSHIP_STYLE.warm

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0 hover:bg-muted/20 px-2 rounded transition-colors">
      {/* Rank */}
      <div className="w-7 text-center text-xs font-bold text-muted-foreground shrink-0">
        #{rank}
      </div>

      {/* Status badge */}
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium shrink-0 ${style.badge}`}>
        {style.icon}
        {style.label}
      </div>

      {/* Name + location */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm truncate">{contact.name}</span>
          {contact.company && contact.company !== contact.name && (
            <span className="text-[10px] text-muted-foreground truncate">({contact.company})</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {contact.city && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />
              {contact.city}{contact.state ? `, ${contact.state}` : ''}
            </span>
          )}
          {contact.artists_pitched.length > 0 && (
            <div className="flex gap-1">
              {contact.artists_pitched.map(slug => (
                <span key={slug} className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">
                  {ARTIST_SLUG_LABEL[slug] ?? slug}
                </span>
              ))}
            </div>
          )}
          {contact.routing_note && (
            <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
              {contact.routing_note}
            </span>
          )}
        </div>
        {contact.relationship === 'expansion' && (
          <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5 font-medium">
            Booked DS — ready to pitch HVRCRFT / Kotrax / Dark Matter
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="shrink-0 text-right space-y-0.5">
        <div className="text-xs font-bold">
          {contact.confirmed_count}
          <span className="text-[10px] text-muted-foreground font-normal"> confirmed</span>
        </div>
        <div className="text-[10px] text-muted-foreground">
          {contact.deal_count} deals total
        </div>
        {contact.total_value > 0 && (
          <div className="text-[10px] text-green-600 dark:text-green-400 font-medium">
            ${contact.total_value.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PromoterRankings() {
  const [contacts, setContacts] = useState<WarmContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'vip' | 'expansion' | 'active'>('all')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/outreach/warm-contacts')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setContacts(data.contacts ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? contacts : contacts.filter(c => c.relationship === filter)

  const vipCount = contacts.filter(c => c.relationship === 'vip').length
  const expansionCount = contacts.filter(c => c.relationship === 'expansion').length
  const activeCount = contacts.filter(c => c.relationship === 'active').length
  const totalValue = contacts.reduce((s, c) => s + c.total_value, 0)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Building promoter rankings from deal history...</p>
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

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Warm Contacts', value: contacts.length, icon: <Users className="h-4 w-4" /> },
          { label: 'VIP (2+ confirmed)', value: vipCount, icon: <Star className="h-4 w-4 text-yellow-500" /> },
          { label: 'Expansion Ready', value: expansionCount, icon: <Zap className="h-4 w-4 text-purple-500" /> },
          { label: 'Total Deal Value', value: `$${totalValue.toLocaleString()}`, icon: <TrendingUp className="h-4 w-4 text-green-500" /> },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                {s.icon}
                <span className="text-[10px] uppercase tracking-wide">{s.label}</span>
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Filter:</span>
        {(['all', 'vip', 'expansion', 'active'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-muted text-muted-foreground hover:border-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? `All (${contacts.length})` :
             f === 'vip' ? `VIP (${vipCount})` :
             f === 'expansion' ? `Expansion (${expansionCount})` :
             `Active (${activeCount})`}
          </button>
        ))}
        <Button variant="ghost" size="sm" onClick={load} className="ml-auto h-7">
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      {/* Rankings table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground space-y-2">
          <AlertTriangle className="h-8 w-8 mx-auto opacity-20" />
          <p className="text-sm">No contacts in this category yet.</p>
          <p className="text-xs">As you log deals and pitches, promoters will be ranked here automatically.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-2">
            {filtered.map((c, i) => (
              <ContactRow key={c.id} contact={c} rank={i + 1} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="text-[10px] text-muted-foreground space-y-1">
        <p className="font-medium">How ranking works:</p>
        <p>VIP = 2+ confirmed shows · Expansion = 1 DS show, ready for roster expansion · Active = open negotiation · Warm = past deals, not confirmed</p>
        <p>Ranked by relationship tier, then by confirmed show count, then by total deal value.</p>
      </div>
    </div>
  )
}
