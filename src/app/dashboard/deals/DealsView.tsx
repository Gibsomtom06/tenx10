'use client'

import { useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { LayoutGrid, List, DollarSign, Calendar, CheckCircle2, XCircle, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const COLUMNS = [
  { key: 'inquiry', label: 'Inquiry', color: 'bg-gray-100 dark:bg-gray-800', badge: 'secondary' },
  { key: 'offer', label: 'Offer', color: 'bg-blue-50 dark:bg-blue-950', badge: 'outline' },
  { key: 'negotiating', label: 'Negotiating', color: 'bg-yellow-50 dark:bg-yellow-950', badge: 'default' },
  { key: 'confirmed', label: 'Confirmed', color: 'bg-green-50 dark:bg-green-950', badge: 'default' },
  { key: 'completed', label: 'Completed', color: 'bg-purple-50 dark:bg-purple-950', badge: 'secondary' },
] as const

type DealStatus = 'inquiry' | 'offer' | 'negotiating' | 'confirmed' | 'completed' | 'cancelled'

interface Deal {
  id: string
  title: string
  show_date: string | null
  offer_amount: number | null
  status: DealStatus
  deal_points: Record<string, any> | null
  deposit_paid: boolean | null
}

function daysOut(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `${Math.abs(diff)}d ago`
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return `${diff}d out`
}

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
}

export function DealsView({ deals: initialDeals, artistParam }: { deals: Deal[]; artistParam?: string }) {
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [deals, setDeals] = useState(initialDeals)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const router = useRouter()

  const upcoming = deals.filter(d => d.status !== 'cancelled' && d.show_date && d.show_date >= new Date().toISOString().split('T')[0])
  const past = deals.filter(d => d.status !== 'cancelled' && (!d.show_date || d.show_date < new Date().toISOString().split('T')[0]))
  const cancelled = deals.filter(d => d.status === 'cancelled')

  async function moveCard(dealId: string, newStatus: DealStatus) {
    // Optimistic update
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, status: newStatus } : d))

    try {
      const res = await fetch(`/api/deals/${dealId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        // Revert on failure
        setDeals(initialDeals)
      }
    } catch {
      setDeals(initialDeals)
    }
  }

  function handleDragStart(dealId: string) {
    setDragging(dealId)
  }

  function handleDragOver(e: React.DragEvent, colKey: string) {
    e.preventDefault()
    setDragOverCol(colKey)
  }

  function handleDrop(e: React.DragEvent, colKey: string) {
    e.preventDefault()
    if (dragging && dragging !== colKey) {
      moveCard(dragging, colKey as DealStatus)
    }
    setDragging(null)
    setDragOverCol(null)
  }

  function handleDragEnd() {
    setDragging(null)
    setDragOverCol(null)
  }

  const colDeals = (colKey: string) => deals.filter(d => d.status === colKey)

  const colRevenue = (colKey: string) =>
    colDeals(colKey).reduce((s, d) => s + (Number(d.offer_amount) || 0), 0)

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
        <button
          onClick={() => setView('kanban')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            view === 'kanban' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <LayoutGrid className="h-4 w-4" />
          Pipeline
        </button>
        <button
          onClick={() => setView('table')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            view === 'table' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <List className="h-4 w-4" />
          Table
        </button>
      </div>

      {view === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const colCards = colDeals(col.key)
            const revenue = colRevenue(col.key)
            const isOver = dragOverCol === col.key
            return (
              <div
                key={col.key}
                className={cn(
                  'flex-shrink-0 w-64 rounded-xl p-3 transition-colors',
                  col.color,
                  isOver && 'ring-2 ring-primary ring-offset-1'
                )}
                onDragOver={e => handleDragOver(e, col.key)}
                onDrop={e => handleDrop(e, col.key)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{col.label}</span>
                    <span className="text-xs bg-background/60 px-1.5 py-0.5 rounded-full font-mono">
                      {colCards.length}
                    </span>
                  </div>
                  {revenue > 0 && (
                    <span className="text-xs text-muted-foreground font-mono">{fmt(revenue)}</span>
                  )}
                </div>

                {/* Cards */}
                <div className="space-y-2 min-h-[80px]">
                  {colCards.map(deal => {
                    const pts = (deal.deal_points ?? {}) as Record<string, any>
                    const city = pts.city ?? deal.title ?? '—'
                    const state = pts.state ?? ''
                    const venue = pts.venue ?? ''
                    const isDragging = dragging === deal.id
                    const depositPaid = deal.deposit_paid ?? !!pts.depositPaid
                    const isConfirmed = ['confirmed', 'completed'].includes(deal.status)

                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={() => handleDragStart(deal.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'bg-background rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing border border-border/50 hover:border-border transition-all select-none',
                          isDragging && 'opacity-40 scale-95'
                        )}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <p className="font-semibold text-sm leading-tight">
                            {city}{state ? `, ${state}` : ''}
                          </p>
                          {isConfirmed && (
                            <span title={depositPaid ? 'Deposit paid' : 'Deposit pending'}>
                              {depositPaid
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                : <XCircle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                              }
                            </span>
                          )}
                        </div>

                        {venue && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                            <MapPin className="h-2.5 w-2.5" />{venue}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                          {deal.offer_amount ? (
                            <span className="text-xs font-mono font-semibold flex items-center gap-0.5">
                              <DollarSign className="h-2.5 w-2.5" />
                              {Number(deal.offer_amount).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">No offer</span>
                          )}
                          {deal.show_date ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" />
                              {daysOut(deal.show_date)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">TBD</span>
                          )}
                        </div>

                        <Link
                          href={`/dashboard/deals/${deal.id}${artistParam ? `?artist=${artistParam}` : ''}`}
                          className="mt-2 block text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          View deal
                        </Link>
                      </div>
                    )
                  })}

                  {colCards.length === 0 && (
                    <div className={cn(
                      'h-16 rounded-lg border-2 border-dashed border-border/30 flex items-center justify-center text-xs text-muted-foreground',
                      isOver && 'border-primary/50 bg-primary/5'
                    )}>
                      {isOver ? 'Drop here' : 'Empty'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === 'table' && (
        <div className="space-y-8">
          <DealTable rows={upcoming} title="Upcoming" />
          {past.length > 0 && <DealTable rows={past} title="Past Shows" />}
          {cancelled.length > 0 && <DealTable rows={cancelled} title="Cancelled" />}
        </div>
      )}
    </div>
  )
}

function DealTable({ rows, title }: { rows: Deal[]; title: string }) {
  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">{title} ({rows.length})</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Show</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Guarantee</TableHead>
            <TableHead className="text-center">Deposit</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(deal => {
            const pts = (deal.deal_points ?? {}) as Record<string, any>
            const city = pts.city ?? deal.title
            const state = pts.state ?? ''
            const venue = pts.venue ?? ''
            const depositPaid = deal.deposit_paid ?? !!pts.depositPaid
            const isConfirmed = ['confirmed', 'completed'].includes(deal.status)
            return (
              <TableRow key={deal.id}>
                <TableCell>
                  <div className="font-medium text-sm">{city}{state ? `, ${state}` : ''}</div>
                  {venue && <div className="text-xs text-muted-foreground">{venue}</div>}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {deal.show_date
                    ? new Date(deal.show_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                    : '—'}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {deal.offer_amount ? `$${Number(deal.offer_amount).toLocaleString()}` : '—'}
                </TableCell>
                <TableCell className="text-center">
                  {isConfirmed ? (
                    depositPaid
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                      : <XCircle className="h-4 w-4 text-yellow-500 mx-auto" />
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={(deal.status === 'cancelled' ? 'destructive' : deal.status === 'offer' ? 'outline' : 'default') as any}>
                    {deal.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/deals/${deal.id}`} className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                    View
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
          {!rows.length && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-6 text-sm">
                No deals in this category
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
