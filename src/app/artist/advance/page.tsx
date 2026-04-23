import { createClient } from '@/lib/supabase/server'
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get all artist memberships for this user
  const { data: memberships } = await supabase
    .from('artist_members')
    .select('artist_id, role, artists(id, name, stage_name)')
    .eq('user_id', user.id)

  const membershipsArr = (memberships ?? []) as any[]
  const artistIds = membershipsArr.map((m: any) => m.artist_id).filter(Boolean)
  if (!artistIds.length) redirect('/dashboard')

  // Build a label map: artist_id → display name
  const artistLabel: Record<string, string> = {}
  for (const m of membershipsArr) {
    const a = m.artists as { id: string; name: string; stage_name: string | null } | null
    if (a) artistLabel[m.artist_id] = a.stage_name ?? a.name
  }

  // Fetch all deals for managed artists
  const { data: deals } = await supabase
    .from('deals')
    .select('id, title, show_date, status, deal_points, artist_id')
    .in('artist_id', artistIds)
    .neq('status', 'cancelled')
    .order('show_date', { ascending: true, nullsFirst: false })

  const today = new Date().toISOString().split('T')[0]
  const upcoming = (deals ?? []).filter(d => d.show_date && d.show_date >= today)
  const past = (deals ?? []).filter(d => !d.show_date || d.show_date < today).reverse()

  function AdvanceRow({ deal }: { deal: NonNullable<typeof deals>[number] }) {
    const pts = deal.deal_points as Record<string, string> | null
    const city = pts?.city ?? deal.title
    const state = pts?.state ?? ''
    const venue = pts?.venue ?? ''
    const artistName = artistLabel[deal.artist_id] ?? ''
    const daysUntil = deal.show_date
      ? Math.floor((new Date(deal.show_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null
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
                {artistIds.length > 1 && (
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{artistName}</span>
                )}
                {daysUntil !== null && daysUntil <= 3 && daysUntil >= 0 && (
                  <span className="text-[10px] text-orange-600 font-bold">
                    {daysUntil === 0 ? '🔥 TODAY' : daysUntil === 1 ? '🔥 Tomorrow' : `${daysUntil} days`}
                  </span>
                )}
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
