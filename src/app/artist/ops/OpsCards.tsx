'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateShowOps } from '@/app/artist/actions'
import { CheckCircle2, Circle, ExternalLink, FolderOpen, Calendar, MapPin, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import type { Json } from '@/types/database'

interface Deal {
  id: string
  title: string
  show_date: string | null
  offer_amount: number | null
  status: string
  deal_points: Json | null
  venues: { name: string; capacity: number | null } | null
}

interface OpsCardProps {
  deal: Deal
}

function OpsCard({ deal }: OpsCardProps) {
  const pts = (deal.deal_points as Record<string, unknown>) ?? {}
  const venue = deal.venues as { name: string; capacity: number | null } | null
  const city = (pts.city as string) ?? deal.title
  const state = (pts.state as string) ?? ''
  const capacity = (pts.capacity as number) ?? venue?.capacity ?? null
  const ticketsSold = (pts.ticketsSold as number) ?? null
  const fillPct = capacity && ticketsSold ? Math.round((ticketsSold / capacity) * 100) : null

  const [ticketLink, setTicketLink] = useState((pts.ticketLink as string) ?? '')
  const [soldInput, setSoldInput] = useState(ticketsSold?.toString() ?? '')
  const [isPending, startTransition] = useTransition()

  async function toggle(key: string, current: boolean) {
    startTransition(async () => {
      try {
        await updateShowOps(deal.id, { [key]: !current })
        toast.success('Updated')
      } catch {
        toast.error('Failed to update')
      }
    })
  }

  async function saveTicketLink() {
    startTransition(async () => {
      try {
        await updateShowOps(deal.id, { ticketLink })
        toast.success('Ticket link saved')
      } catch {
        toast.error('Failed to save')
      }
    })
  }

  async function saveTicketsSold() {
    const n = parseInt(soldInput)
    if (isNaN(n)) return
    startTransition(async () => {
      try {
        await updateShowOps(deal.id, { ticketsSold: n })
        toast.success('Tickets sold updated')
      } catch {
        toast.error('Failed to update')
      }
    })
  }

  const contractSigned = !!(pts.contractSigned as boolean)
  const depositPaid = !!(pts.depositPaid as boolean)
  const marketingLive = !!(pts.marketingLive as boolean)
  const driveFolderUrl = (pts.driveFolderUrl as string) ?? ''

  function Toggle({ label, value, field }: { label: string; value: boolean; field: string }) {
    return (
      <button
        onClick={() => toggle(field, value)}
        disabled={isPending}
        className="flex items-center gap-2 text-sm text-left hover:opacity-80 transition-opacity"
      >
        {value
          ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
      </button>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              <MapPin className="h-4 w-4 inline mr-1 text-muted-foreground" />
              {city}{state ? `, ${state}` : ''}
            </CardTitle>
            {venue?.name && <p className="text-xs text-muted-foreground mt-0.5">{venue.name}</p>}
            {deal.show_date && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {new Date(deal.show_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            {deal.offer_amount && (
              <div className="flex items-center gap-0.5 text-primary font-black">
                <DollarSign className="h-4 w-4" />
                {deal.offer_amount.toLocaleString()}
              </div>
            )}
            <Badge variant="outline" className="text-[10px] mt-1">{deal.status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Status toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Toggle label="Contract Signed" value={contractSigned} field="contractSigned" />
          <Toggle label="Deposit Paid" value={depositPaid} field="depositPaid" />
          <Toggle label="Marketing Live" value={marketingLive} field="marketingLive" />
        </div>

        {/* Ticket link */}
        <div className="flex gap-2">
          <Input
            placeholder="Ticket link URL"
            value={ticketLink}
            onChange={e => setTicketLink(e.target.value)}
            className="text-xs h-8"
          />
          <Button size="sm" variant="outline" onClick={saveTicketLink} disabled={isPending} className="h-8 shrink-0">
            Save
          </Button>
          {ticketLink && (
            <a href={ticketLink} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost" className="h-8">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          )}
        </div>

        {/* Drive folder */}
        <div className="flex gap-2 items-center">
          <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
          {driveFolderUrl ? (
            <a href={driveFolderUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
              Open Drive folder <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">No Drive folder yet — create one from the Manager Dashboard</span>
          )}
        </div>

        {/* Sellout tracker */}
        {capacity && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Sellout progress</span>
              <span className="font-medium">{ticketsSold ?? 0} / {capacity} {fillPct !== null ? `(${fillPct}%)` : ''}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(fillPct ?? 0, 100)}%` }}
              />
            </div>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Tickets sold"
                value={soldInput}
                onChange={e => setSoldInput(e.target.value)}
                className="text-xs h-7 w-28"
                type="number"
              />
              <Button size="sm" variant="outline" onClick={saveTicketsSold} disabled={isPending} className="h-7 text-xs">
                Update
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function OpsCards({ deals }: { deals: Deal[] }) {
  if (deals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        No active shows to track. Confirmed and in-negotiation shows appear here.
      </p>
    )
  }
  return (
    <div className="space-y-4">
      {deals.map(deal => <OpsCard key={deal.id} deal={deal} />)}
    </div>
  )
}
