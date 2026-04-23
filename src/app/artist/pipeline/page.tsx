import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { MapPin, Calendar, DollarSign, ChevronRight, GitBranch, Hotel, Car, UtensilsCrossed } from 'lucide-react'
import { detectHGR } from '@/lib/offer/detect-hgr'

export const metadata = { title: 'Pipeline — TENx10' }

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-500/15 text-green-700 dark:text-green-400',
  offer: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  negotiating: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  inquiry: 'bg-muted text-muted-foreground',
  completed: 'bg-muted text-muted-foreground',
}

const STATUS_ORDER = ['confirmed', 'negotiating', 'offer', 'inquiry', 'completed']

export default async function PipelinePage() {
  const supabase = await createClient()
  const access = await getArtistAccess(supabase)
  if (!access) redirect('/dashboard')

  const { data: deals } = await supabase
    .from('deals')
    .select('id, title, show_date, offer_amount, status, deal_points, notes')
    .eq('artist_id', access.artistId)
    .neq('status', 'cancelled')
    .order('show_date', { ascending: true })

  const active = (deals ?? []).filter(d => ['inquiry', 'offer', 'negotiating'].includes(d.status))
  const confirmed = (deals ?? []).filter(d => d.status === 'confirmed')
  const completed = (deals ?? []).filter(d => d.status === 'completed')

  function DealRow({ deal }: { deal: NonNullable<typeof deals>[number] }) {
    const pts = deal.deal_points as Record<string, any> | null
    const city = pts?.city ?? deal.title
    const state = pts?.state ?? ''
    const venue = pts?.venue ?? ''
    const notesText = [
      (deal as any).notes,
      pts?.notes,
      pts?.hospitality,
      pts?.hotel,
      pts?.ground,
      pts?.rider,
      typeof pts === 'string' ? pts : null,
    ].filter(Boolean).join('\n')
    const hgr = detectHGR(notesText)
    const hgrIcon = (v: boolean | null, Icon: any, label: string) => (
      <span
        key={label}
        title={label + ' ' + (v === true ? 'included' : v === false ? 'NOT included' : 'not specified')}
        className={
          v === true
            ? 'inline-flex text-green-600 dark:text-green-400'
            : v === false
            ? 'inline-flex text-red-600 dark:text-red-400'
            : 'inline-flex text-muted-foreground/30'
        }
      >
        <Icon className="h-3 w-3" />
      </span>
    )
    return (
      <Link href={`/artist/advance/${deal.id}`}>
        <Card className="hover:border-primary/30 transition-colors cursor-pointer group">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">
                    <MapPin className="h-3 w-3 inline mr-0.5 text-muted-foreground" />
                    {city}{state ? `, ${state}` : ''}
                  </span>
                  <Badge className={`text-[10px] ${STATUS_COLORS[deal.status] ?? ''}`}>{deal.status}</Badge>
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/60 ml-1">
                    {hgrIcon(hgr.hotel, Hotel, 'Hotel')}
                    {hgrIcon(hgr.ground, Car, 'Ground')}
                    {hgrIcon(hgr.rider, UtensilsCrossed, 'Rider')}
                  </span>
                </div>
                {venue && <p className="text-xs text-muted-foreground mt-0.5">{venue}</p>}
                {deal.show_date && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(deal.show_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {deal.offer_amount && (
                  <span className="text-sm font-bold flex items-center gap-0.5 text-primary">
                    <DollarSign className="h-3 w-3" />{deal.offer_amount.toLocaleString()}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GitBranch className="h-6 w-6" />Pipeline
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          All deals in motion for {access.artistName} — {active.length} active pitches · {confirmed.length} confirmed
        </p>
      </div>

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-yellow-600 dark:text-yellow-400">
            Active Negotiations ({active.length})
          </h2>
          <div className="space-y-2">
            {active.map(d => <DealRow key={d.id} deal={d} />)}
          </div>
        </section>
      )}

      {confirmed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-400">
            Confirmed ({confirmed.length})
          </h2>
          <div className="space-y-2">
            {confirmed.map(d => <DealRow key={d.id} deal={d} />)}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className="space-y-3 opacity-60">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Completed ({completed.length})
          </h2>
          <div className="space-y-2">
            {completed.map(d => <DealRow key={d.id} deal={d} />)}
          </div>
        </section>
      )}

      {!deals?.length && (
        <div className="text-center py-16 text-muted-foreground">
          <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No deals in the pipeline yet.</p>
        </div>
      )}
    </div>
  )
}
