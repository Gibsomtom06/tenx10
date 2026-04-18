import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Plus, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  inquiry: 'secondary',
  offer: 'outline',
  negotiating: 'default',
  confirmed: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
}

export const metadata = { title: 'Deals — TENx10' }

export default async function DealsPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from('deals')
    .select('id, title, show_date, offer_amount, status, deal_points, artists(name, stage_name), venues(name, city)')
    .order('show_date', { ascending: true })

  const deals = (raw ?? []) as any[]

  const today = new Date().toISOString().split('T')[0]
  const upcoming = deals.filter(d => d.status !== 'cancelled' && d.show_date && d.show_date >= today)
  const past = deals.filter(d => d.status !== 'cancelled' && (!d.show_date || d.show_date < today)).reverse()
  const cancelled = deals.filter(d => d.status === 'cancelled')

  function DealTable({ rows, title }: { rows: any[]; title: string }) {
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
              const venue = pts.venue ?? deal.venues?.name ?? ''
              const depositPaid = !!pts.depositPaid
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
                    <Badge variant={STATUS_COLORS[deal.status] as any}>{deal.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/deals/${deal.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
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

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {upcoming.length} upcoming · {past.length} past · {deals.filter(d => d.status !== 'cancelled').length} total
          </p>
        </div>
        <Link href="/dashboard/deals/new" className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4 mr-1" />New Deal
        </Link>
      </div>

      {upcoming.length > 0 && <DealTable rows={upcoming} title="Upcoming" />}
      {past.length > 0 && <DealTable rows={past} title="Past Shows" />}
      {cancelled.length > 0 && <DealTable rows={cancelled} title="Cancelled" />}
    </div>
  )
}
