import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DealRow {
  id: string
  show_date: string | null
  offer_amount: number | null
  status: string
  artists: { name: string } | null
  venues: { name: string; city: string | null } | null
}

const STATUS_COLORS: Record<string, string> = {
  inquiry: 'secondary',
  offer: 'outline',
  negotiating: 'default',
  confirmed: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
}

export default async function DealsPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from('deals')
    .select('id, show_date, offer_amount, status, artists(name), venues(name, city)')
    .order('created_at', { ascending: false })

  const deals = (raw ?? []) as unknown as DealRow[]

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Deals</h1>
        <Link href="/dashboard/deals/new" className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4 mr-1" />New Deal
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Artist</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Offer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map(deal => (
            <TableRow key={deal.id}>
              <TableCell className="font-medium">{deal.artists?.name ?? '—'}</TableCell>
              <TableCell>
                {deal.venues?.name}
                {deal.venues?.city && (
                  <span className="text-muted-foreground ml-1">· {deal.venues.city}</span>
                )}
              </TableCell>
              <TableCell>{deal.show_date ?? '—'}</TableCell>
              <TableCell>{deal.offer_amount ? `$${deal.offer_amount.toLocaleString()}` : '—'}</TableCell>
              <TableCell>
                <Badge variant={STATUS_COLORS[deal.status] as any}>{deal.status}</Badge>
              </TableCell>
              <TableCell>
                <Link href={`/dashboard/deals/${deal.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {!deals.length && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No deals yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
