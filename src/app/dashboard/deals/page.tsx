import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Plus } from 'lucide-react'

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
  const { data: deals } = await supabase
    .from('deals')
    .select('*, artists(name), venues(name, city), promoters(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Deals</h1>
        <Button size="sm" asChild>
          <Link href="/dashboard/deals/new"><Plus className="h-4 w-4 mr-1" />New Deal</Link>
        </Button>
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
          {deals?.map(deal => (
            <TableRow key={deal.id}>
              <TableCell className="font-medium">{(deal.artists as any)?.name}</TableCell>
              <TableCell>
                {(deal.venues as any)?.name}
                {(deal.venues as any)?.city && (
                  <span className="text-muted-foreground ml-1">· {(deal.venues as any).city}</span>
                )}
              </TableCell>
              <TableCell>{deal.show_date ?? '—'}</TableCell>
              <TableCell>{deal.offer_amount ? `$${deal.offer_amount.toLocaleString()}` : '—'}</TableCell>
              <TableCell>
                <Badge variant={STATUS_COLORS[deal.status] as any}>{deal.status}</Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/deals/${deal.id}`}>View</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!deals?.length && (
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
