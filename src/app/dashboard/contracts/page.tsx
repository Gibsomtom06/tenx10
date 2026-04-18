import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Contracts — TENx10' }

const STATUS_COLOR: Record<string, any> = {
  draft: 'secondary', sent: 'outline', signed: 'default', voided: 'destructive',
}

export default async function ContractsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: rawContracts } = await supabase
    .from('contracts')
    .select('*, deals(title, show_date), artists(name, stage_name)')
    .order('created_at', { ascending: false })

  const contracts = (rawContracts ?? []) as any[]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Contracts</h1>
        <p className="text-sm text-muted-foreground mt-1">Contracts are generated from confirmed deals</p>
      </div>

      {!contracts.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p>No contracts yet.</p>
            <p className="text-xs mt-1">
              Confirm a deal in <Link href="/dashboard/deals" className="underline">Deals</Link> to generate a contract.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Artist</TableHead>
              <TableHead>Deal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Signed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.title}</TableCell>
                <TableCell>{c.artists?.stage_name ?? c.artists?.name ?? '—'}</TableCell>
                <TableCell>
                  {c.deals ? (
                    <Link href={`/dashboard/deals/${c.deal_id}`} className="underline text-muted-foreground hover:text-foreground text-sm">
                      {c.deals.title}
                    </Link>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_COLOR[c.status] ?? 'secondary'}>{c.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {c.signed_at ? new Date(c.signed_at).toLocaleDateString() : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
