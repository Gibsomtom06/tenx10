import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Calendar, DollarSign, CheckSquare, Music2, AlertTriangle, ChevronRight, Disc3 } from 'lucide-react'
import MarketMap from './booking/MarketMap'

export const metadata = { title: 'Artist Dashboard — TENx10' }

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-500/15 text-green-700 dark:text-green-400',
  offer: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  negotiating: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  inquiry: 'bg-muted text-muted-foreground',
  completed: 'bg-muted text-muted-foreground',
}

export default async function ArtistDashboard() {
  const supabase = await createClient()
  const access = await getArtistAccess(supabase)
  if (!access) redirect('/dashboard')

  // Agents land on pipeline instead
  if (access.role === 'agent') redirect('/artist/pipeline')

  const today = new Date().toISOString().split('T')[0]

  const [{ data: deals }, { data: tasks }, { data: catalogTracks }] = await Promise.all([
    supabase
      .from('deals')
      .select('id, title, show_date, offer_amount, status, deal_points')
      .eq('artist_id', access.artistId)
      .neq('status', 'cancelled')
      .order('show_date', { ascending: true }),
    supabase
      .from('tasks')
      .select('*')
      .eq('artist_id', access.artistId)
      .neq('status', 'done')
      .order('due_date', { ascending: true }),
    supabase
      .from('catalog')
      .select('id, title, bucket, streams')
      .eq('artist_id', access.artistId)
      .eq('bucket', 'released_full')
      .order('streams', { ascending: false })
      .limit(5),
  ])

  const upcomingShows = (deals ?? [])
    .filter(d => ['confirmed', 'offer', 'negotiating'].includes(d.status) && d.show_date && d.show_date >= today)
    .slice(0, 5)

  const incomingOffers = (deals ?? [])
    .filter(d => ['inquiry', 'offer', 'negotiating'].includes(d.status))
    .slice(0, 3)

  const pendingTasks = (tasks ?? []).slice(0, 5)
  const confirmedRevenue = (deals ?? [])
    .filter(d => ['confirmed', 'completed'].includes(d.status))
    .reduce((s, d) => s + (d.offer_amount ?? 0), 0)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hey, {access.artistName} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's what's happening with your shows, catalog, and tasks.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />CONFIRMED REVENUE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-primary">${confirmedRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">guaranteed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />UPCOMING
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{upcomingShows.length}</p>
            <p className="text-xs text-muted-foreground mt-1">shows + pipeline</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />OPEN TASKS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingTasks.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/artist/tasks" className="hover:underline">view tasks →</Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Disc3 className="h-3 w-3" />CATALOG
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{catalogTracks?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/artist/catalog" className="hover:underline">released tracks →</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tour Map */}
      <MarketMap />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Upcoming Shows
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingShows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming shows scheduled.</p>
            ) : (
              upcomingShows.map(deal => {
                const pts = deal.deal_points as Record<string, string> | null
                return (
                  <Link key={deal.id} href={`/artist/advance/${deal.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/40 transition-colors group">
                    <div>
                      <p className="font-semibold text-sm">{pts?.city ?? deal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {deal.show_date ? new Date(deal.show_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}
                        {pts?.venue ? ` · ${pts.venue}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${STATUS_COLORS[deal.status] ?? ''}`}>{deal.status}</Badge>
                      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                )
              })
            )}
            <Link href="/artist/shows" className="text-xs text-primary hover:underline block pt-1">View all shows →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" /> Incoming Offers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {incomingOffers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending offers right now.</p>
            ) : (
              incomingOffers.map(deal => {
                const pts = deal.deal_points as Record<string, string> | null
                return (
                  <div key={deal.id} className="p-3 rounded-lg border bg-yellow-500/5 border-yellow-500/20">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{pts?.city ?? deal.title}</p>
                      <Badge className="text-[10px] bg-yellow-500/15 text-yellow-700 dark:text-yellow-400">{deal.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {deal.show_date ? new Date(deal.show_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD'}
                      {deal.offer_amount ? ` · $${deal.offer_amount.toLocaleString()} offer` : ''}
                    </p>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {pendingTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Open Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingTasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className={`mt-0.5 h-3 w-3 rounded-full shrink-0 ${task.status === 'in_progress' ? 'bg-yellow-500' : 'bg-muted-foreground/30'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
                </div>
              </div>
            ))}
            <Link href="/artist/tasks" className="text-xs text-primary hover:underline block pt-1">View all tasks →</Link>
          </CardContent>
        </Card>
      )}

      {catalogTracks && catalogTracks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Music2 className="h-4 w-4" /> Top Tracks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {catalogTracks.map((track, i) => (
              <div key={track.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-4 text-xs">{i + 1}</span>
                  <span className="font-medium">{track.title}</span>
                </div>
                {track.streams && <span className="text-xs text-muted-foreground">{(track.streams / 1000000).toFixed(2)}M streams</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
