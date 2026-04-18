import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { MapPin, DollarSign, Calendar } from 'lucide-react'

export const metadata = { title: 'Calendar — TENx10' }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const STATUS_COLOR: Record<string, any> = {
  inquiry: 'secondary', offer: 'outline', negotiating: 'default',
  confirmed: 'default', completed: 'secondary', cancelled: 'destructive',
}

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: rawDeals } = await supabase
    .from('deals')
    .select('*, deal_points, artists(name, stage_name), venues(name, city, state)')
    .neq('status', 'cancelled')
    .not('show_date', 'is', null)
    .order('show_date', { ascending: true })

  const all = (rawDeals ?? []) as any[]

  // Group by month
  const byMonth: Record<string, typeof all> = {}
  for (const deal of all) {
    if (!deal.show_date) continue
    const d = new Date(deal.show_date)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(deal)
  }

  const sortedMonths = Object.keys(byMonth).sort()

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const monthLabel = (key: string) => {
    const [year, month] = key.split('-')
    return `${MONTHS[parseInt(month)]} ${year}`
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">{all.length} upcoming shows</p>
        </div>
        <Link href="/dashboard/deals/new" className="text-sm underline text-muted-foreground">
          + Add show
        </Link>
      </div>

      {!all.length && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p>No shows scheduled yet.</p>
            <p className="text-xs mt-1">
              Process an offer in <Link href="/dashboard/gmail" className="underline">Gmail</Link> or{' '}
              <Link href="/dashboard/deals/new" className="underline">create a deal manually</Link>.
            </p>
          </CardContent>
        </Card>
      )}

      {sortedMonths.map(monthKey => (
        <div key={monthKey} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {monthLabel(monthKey)}
          </h2>
          <div className="space-y-2">
            {byMonth[monthKey].map(deal => (
              <Link key={deal.id} href={`/dashboard/deals/${deal.id}`}>
                <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {(() => {
                              const pts = (deal.deal_points ?? {}) as Record<string, string>
                              const city = pts.city ?? ''
                              const state = pts.state ?? ''
                              const venueName = pts.venue ?? (deal.venues as any)?.name ?? deal.title
                              return city ? `${city}${state ? `, ${state}` : ''}` : venueName
                            })()}
                          </span>
                          <Badge variant={STATUS_COLOR[deal.status]}>{deal.status}</Badge>
                        </div>
                        {(() => {
                          const pts = (deal.deal_points ?? {}) as Record<string, string>
                          const venue = pts.venue ?? (deal.venues as any)?.name ?? ''
                          const city = pts.city ?? (deal.venues as any)?.city ?? ''
                          const state = pts.state ?? (deal.venues as any)?.state ?? ''
                          const locationStr = [venue, city && `${city}${state ? `, ${state}` : ''}`].filter(Boolean).join(' · ')
                          return locationStr ? (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {locationStr}
                            </p>
                          ) : null
                        })()}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(deal.show_date!)}
                        </p>
                        {deal.offer_amount && (
                          <p className="text-sm font-medium flex items-center justify-end gap-1 mt-1">
                            <DollarSign className="h-3 w-3" />
                            {fmt(Number(deal.offer_amount))}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
