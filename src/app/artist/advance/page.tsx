import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Calendar, MapPin, ChevronRight, FileText } from 'lucide-react'

export const metadata = { title: 'Show Advances — TENx10' }

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-500/15 text-green-700 dark:text-green-400',
  offer: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  negotiating: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  inquiry: 'bg-muted text-muted-foreground',
  completed: 'bg-muted text-muted-foreground',
}

export default async function ArtistAdvanceIndexPage() {
  const supabase = await createClient()
  const access = await getArtistAccess(supabase)
  if (!access) redirect('/dashboard')

  const { data: deals } = await supabase
    .from('deals')
    .select('id, title, show_date, status, deal_points')
    .eq('artist_id', access.artistId)
    .neq('status', 'cancelled')
    .order('show_date', { ascending: true })

  const today = new Date().toISOString().split('T')[0]
  const upcoming = (deals ?? []).filter(d => d.show_date && d.show_date >= today)
  const past = (deals ?? []).filter(d => !d.show_date || d.show_date < today).reverse()

  function AdvanceRow({ deal }: { deal: NonNullable<typeof deals>[number] }) {
    const pts = deal.deal_points as Record<string, string> | null
    const city = pts?.city ?? deal.title
    const state = pts?.state ?? ''
    const venue = pts?.venue ?? ''
    return (
      <Link href={`/artist/advance/${deal.id}`}>
        <Card className="hover:border-primary/30 transition-colors cursor-pointer group">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">
                  <MapPin className="h-3 w-3 inline mr-0.5 text-muted-foreground" />
                  {city}{state ? `, ${state}` : ''}
                </span>
                <Badge className={`text-[10px] ${STATUS_COLORS[deal.status] ?? ''}`}>{deal.status}</Badge>
              </div>
              {venue && <p className="text-xs text-muted-foreground mt-0.5">{venue}</p>}
              {deal.show_date && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(deal.show_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs text-primary">
              <span className="hidden sm:block">View advance</span>
              <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Show Advances</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tap any show to view the full advance sheet — times, contacts, hotel, rider, and conversation thread.
        </p>
      </div>
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Upcoming</h2>
          <div className="space-y-2">{upcoming.map(d => <AdvanceRow key={d.id} deal={d} />)}</div>
        </section>
      )}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Past Shows</h2>
          <div className="space-y-2 opacity-70">{past.map(d => <AdvanceRow key={d.id} deal={d} />)}</div>
        </section>
      )}
      {!deals?.length && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No show advances yet.</p>
        </div>
      )}
    </div>
  )
}
