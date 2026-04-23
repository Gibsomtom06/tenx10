import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DollarSign, TrendingUp, Calendar, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Finance — TENx10' }

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string }>
}) {
  const { artist: artistId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const access = await getArtistAccess(supabase, artistId)

  const { data: rawDeals } = await supabase
    .from('deals')
    .select('*, artists(name, stage_name), venues(name, city, state)')
    .eq('artist_id', access?.artistId ?? '')
    .neq('status', 'cancelled')
    .order('show_date', { ascending: true })

  const all = (rawDeals ?? []) as any[]
  const confirmed = all.filter(d => ['confirmed', 'completed'].includes(d.status))
  const pending = all.filter(d => ['inquiry', 'offer', 'negotiating'].includes(d.status))
  const completed = all.filter(d => d.status === 'completed')

  const totalConfirmed = confirmed.reduce((s: number, d: any) => s + (Number(d.offer_amount) || 0), 0)
  const totalPending = pending.reduce((s: number, d: any) => s + (Number(d.offer_amount) || 0), 0)
  const totalCollected = completed.reduce((s: number, d: any) => s + (Number(d.offer_amount) || 0), 0)

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const STATUS_COLOR: Record<string, any> = {
    inquiry: 'secondary', offer: 'outline', negotiating: 'default',
    confirmed: 'default', completed: 'secondary',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finance</h1>
        <p className="text-sm text-muted-foreground mt-1">Revenue tracking across confirmed and pipeline deals</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />CONFIRMED
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(totalConfirmed)}</p>
            <p className="text-xs text-muted-foreground mt-1">{confirmed.length} shows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />PIPELINE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">{fmt(totalPending)}</p>
            <p className="text-xs text-muted-foreground mt-1">{pending.length} open deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />COLLECTED
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{fmt(totalCollected)}</p>
            <p className="text-xs text-muted-foreground mt-1">{completed.length} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />AVG / SHOW
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {confirmed.length ? fmt(totalConfirmed / confirmed.length) : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">confirmed only</p>
          </CardContent>
        </Card>
      </div>

      {totalConfirmed > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Commission Breakdown — Confirmed Shows</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Agent — AB Touring (10%)</p>
                <p className="font-bold text-xl mt-1">{fmt(totalConfirmed * 0.10)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Manager — Thomas (10%)</p>
                <p className="font-bold text-xl mt-1">{fmt(totalConfirmed * 0.10)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Artist — Lee (80%)</p>
                <p className="font-bold text-xl mt-1">{fmt(totalConfirmed * 0.80)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment status for confirmed shows */}
      {confirmed.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Deposit &amp; Balance Tracker — Confirmed Shows</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Show</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Guarantee</TableHead>
                  <TableHead className="text-center">Deposit</TableHead>
                  <TableHead className="text-center">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmed.map((deal: any) => {
                  const pts = (deal.deal_points ?? {}) as Record<string, any>
                  const city = pts.city ?? deal.title
                  const state = pts.state ?? ''
                  const depositPaid = !!pts.depositPaid
                  const balancePaid = !!pts.balancePaid
                  const depositAmount = pts.depositAmount ? fmt(Number(pts.depositAmount)) : fmt(Math.round(Number(deal.offer_amount) * 0.5))
                  return (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/deals/${deal.id}`} className="hover:underline">
                          {city}{state ? `, ${state}` : ''}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {deal.show_date ? new Date(deal.show_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {deal.offer_amount ? fmt(Number(deal.offer_amount)) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className={`flex items-center justify-center gap-1 text-xs ${depositPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                          {depositPaid
                            ? <><CheckCircle2 className="h-3.5 w-3.5" />{depositAmount}</>
                            : <><XCircle className="h-3.5 w-3.5" />Due {depositAmount}</>
                          }
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className={`flex items-center justify-center gap-1 text-xs ${balancePaid ? 'text-green-600' : deal.status === 'completed' ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {balancePaid
                            ? <><CheckCircle2 className="h-3.5 w-3.5" />Paid</>
                            : deal.status === 'completed'
                            ? <><XCircle className="h-3.5 w-3.5" />Overdue</>
                            : <span className="text-muted-foreground">Night of show</span>
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">All Active Deals</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artist</TableHead>
                <TableHead>Venue / City</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {all.map((deal: any) => {
                const pts = (deal.deal_points ?? {}) as Record<string, string>
                const city = pts.city ?? ''
                const state = pts.state ?? ''
                const venue = pts.venue ?? (deal.venues as any)?.name ?? '—'
                return (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/deals/${deal.id}`} className="hover:underline">
                        {(deal.artists as any)?.stage_name ?? (deal.artists as any)?.name ?? deal.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {venue}
                      {city && <span className="text-muted-foreground ml-1">· {city}{state ? `, ${state}` : ''}</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{deal.show_date ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono">
                      {deal.offer_amount ? fmt(Number(deal.offer_amount)) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLOR[deal.status] ?? 'secondary'}>{deal.status}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!all.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    No deals yet —{' '}
                    <Link href="/dashboard/gmail" className="underline">process an offer in Gmail</Link>
                    {' '}to start
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Commission: agent-routed = 10% agent / 10% manager / 80% artist. Direct = 20% manager / 80% artist.
      </p>
    </div>
  )
}
