import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users, Handshake, Mail,
  DollarSign, Send, AlertTriangle,
  Calendar, TrendingUp, Clock, Inbox, Disc3,
} from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { InboxScanner } from './InboxScanner'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string }>
}) {
  const { artist: artistId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const access = await getArtistAccess(supabase, artistId)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: deals },
    { data: gmailConn },
    { data: contacts },
    { data: memberships },
    { data: newOffers },
  ] = await Promise.all([
    supabase.from('deals')
      .select('id, offer_amount, status, show_date, deal_points, title')
      .eq('artist_id', access?.artistId ?? '')
      .neq('status', 'cancelled'),
    supabase.from('gmail_connections').select('id, email').eq('user_id', user?.id ?? '').single(),
    supabase.from('contacts').select('id', { count: 'exact' }).neq('pitch_status', 'not_contacted'),
    (supabase as any).from('artist_members')
      .select('artist_id')
      .or(`user_id.eq.${user?.id ?? ''},email.eq.${user?.email ?? ''}`),
    supabase.from('deals')
      .select('id, title, offer_amount, deal_points, created_at, source_email_id')
      .eq('artist_id', access?.artistId ?? '')
      .eq('status', 'inquiry')
      .not('source_email_id', 'is', null)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const rosterCount = ((memberships ?? []) as any[])
    .filter((v: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.artist_id === v.artist_id) === i)
    .length

  const allDeals = (deals ?? []) as any[]
  const today = new Date().toISOString().split('T')[0]
  const confirmedDeals = allDeals.filter(d => ['confirmed', 'completed'].includes(d.status))
  const upcomingConfirmed = confirmedDeals.filter(d => d.show_date && d.show_date >= today)
  const pendingDeals = allDeals.filter(d => ['inquiry', 'offer', 'negotiating'].includes(d.status))
  const totalRevenue = confirmedDeals.reduce((sum, d) => sum + (Number(d.offer_amount) || 0), 0)
  const pipelineValue = pendingDeals.reduce((sum, d) => sum + (Number(d.offer_amount) || 0), 0)

  const nextShows = upcomingConfirmed
    .sort((a, b) => (a.show_date ?? '').localeCompare(b.show_date ?? ''))
    .slice(0, 5)

  const needsAttention = pendingDeals
    .sort((a, b) => (a.show_date ?? '').localeCompare(b.show_date ?? ''))
    .slice(0, 5)

  const freshOffers = (newOffers ?? []) as any[]

  const setupSteps = [
    { label: 'Artist on roster', done: rosterCount > 0, href: '/dashboard/artists/new' },
    { label: 'Gmail connected', done: !!gmailConn, href: '/api/gmail/connect' },
    { label: 'Bookings imported', done: allDeals.length > 0, href: '/dashboard/import' },
  ]
  const setupComplete = setupSteps.every(s => s.done)
  const setupProgress = setupSteps.filter(s => s.done).length

  const STATUS_COLORS: Record<string, string> = {
    confirmed: 'bg-green-500/15 text-green-700 dark:text-green-400',
    offer: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    negotiating: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
    inquiry: 'bg-muted text-muted-foreground',
  }

  function dealLabel(deal: any) {
    const pts = (deal.deal_points ?? {}) as Record<string, string>
    const city = pts.city ?? deal.title ?? 'TBD'
    const state = pts.state ?? ''
    return city + (state ? `, ${state}` : '')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{access?.artistName ?? 'Dashboard'}</h1>
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        {!setupComplete && (
          <div className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Setup {setupProgress}/{setupSteps.length} —{' '}
            <Link href="/onboarding" className="underline">Finish →</Link>
          </div>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirmed Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{confirmedDeals.length} confirmed show{confirmedDeals.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pipeline Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pipelineValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{pendingDeals.length} open deal{pendingDeals.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Promoters Pitched</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(contacts as any)?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/dashboard/outreach" className="hover:underline">view outreach →</Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Roster</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rosterCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/dashboard/artists" className="hover:underline">manage roster →</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* New Offers Inbox */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Inbox className="h-4 w-4 text-blue-500" /> New Offers
              {freshOffers.length > 0 && (
                <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{freshOffers.length}</span>
              )}
            </CardTitle>
            <InboxScanner gmailConnected={!!gmailConn} />
          </div>
          <CardDescription>Offers parsed from Gmail in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {freshOffers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No new offers this week. Hit &ldquo;Scan Gmail for Offers&rdquo; to check your inbox.
            </p>
          ) : (
            <div className="space-y-2">
              {freshOffers.map((offer: any) => {
                const pts = (offer.deal_points ?? {}) as Record<string, any>
                const city = pts.city ?? offer.title ?? '—'
                const state = pts.state ?? ''
                const promoter = pts.promoterName ?? pts.rawFrom ?? ''
                return (
                  <Link key={offer.id} href={`/dashboard/deals/${offer.id}`} className="block">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/30 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{city}{state ? `, ${state}` : ''}</p>
                        {promoter && <p className="text-xs text-muted-foreground">{promoter}</p>}
                      </div>
                      <div className="text-right">
                        {offer.offer_amount
                          ? <p className="text-sm font-bold text-primary">${Number(offer.offer_amount).toLocaleString()}</p>
                          : <p className="text-xs text-muted-foreground">No guarantee yet</p>
                        }
                        <p className="text-[10px] text-muted-foreground">Review →</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Shows */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" /> Upcoming Shows
            </CardTitle>
            <CardDescription>{upcomingConfirmed.length} confirmed on the books</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {nextShows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No upcoming confirmed shows yet.</p>
            ) : (
              nextShows.map(deal => {
                const daysOut = deal.show_date
                  ? Math.floor((new Date(deal.show_date).getTime() - Date.now()) / 86400000)
                  : null
                return (
                  <Link key={deal.id} href={`/dashboard/deals/${deal.id}`} className="block">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{dealLabel(deal)}</p>
                        <p className="text-xs text-muted-foreground">
                          {deal.show_date ? new Date(deal.show_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}
                        </p>
                      </div>
                      <div className="text-right">
                        {deal.offer_amount && (
                          <p className="text-sm font-bold text-primary">${Number(deal.offer_amount).toLocaleString()}</p>
                        )}
                        {daysOut !== null && (
                          <p className={cn('text-xs', daysOut <= 7 ? 'text-orange-500 font-medium' : 'text-muted-foreground')}>
                            {daysOut === 0 ? '🔥 TODAY' : daysOut === 1 ? 'Tomorrow' : `${daysOut}d`}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
            {upcomingConfirmed.length > 5 && (
              <Link href="/dashboard/calendar" className="text-xs text-primary hover:underline block text-center pt-1">
                View all {upcomingConfirmed.length} shows →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Active Negotiations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-yellow-500" /> Active Negotiations
            </CardTitle>
            <CardDescription>{pendingDeals.length} deal{pendingDeals.length !== 1 ? 's' : ''} need attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {needsAttention.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Pipeline is clear.</p>
            ) : (
              needsAttention.map(deal => (
                <Link key={deal.id} href={`/dashboard/deals/${deal.id}`} className="block">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{dealLabel(deal)}</p>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full', STATUS_COLORS[deal.status] ?? '')}>
                        {deal.status}
                      </span>
                    </div>
                    {deal.offer_amount && (
                      <p className="text-sm font-semibold">${Number(deal.offer_amount).toLocaleString()}</p>
                    )}
                  </div>
                </Link>
              ))
            )}
            <Link href="/dashboard/deals" className="text-xs text-primary hover:underline block text-center pt-1">
              Full pipeline →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Record Label */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Disc3 className="h-4 w-4 text-violet-400" /> DirtySnatcha Records
            </CardTitle>
            <Link href="/dashboard/label" className="text-xs text-primary hover:underline">open label →</Link>
          </div>
          <CardDescription>A&amp;R submissions, label roster, and release pipeline</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/dashboard/label" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}>
            <Disc3 className="h-4 w-4" /> Label Dashboard
          </Link>
          <Link href="/dashboard/catalog" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}>
            <TrendingUp className="h-4 w-4" /> Catalog
          </Link>
          <Link href="/dashboard/artists" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}>
            <Users className="h-4 w-4" /> Roster
          </Link>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/dashboard/outreach" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}>
            <Send className="h-4 w-4" /> Generate booking pitch
          </Link>
          <Link href="/dashboard/gmail?tab=analyze" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}>
            <Mail className="h-4 w-4" /> Analyze incoming offer
          </Link>
          <Link href="/dashboard/deals/new" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}>
            <Handshake className="h-4 w-4" /> New deal
          </Link>
          <Link href="/dashboard/analytics" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}>
            <TrendingUp className="h-4 w-4" /> Analytics
          </Link>
          {!gmailConn && (
            <a href="/api/gmail/connect" className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}>
              <Mail className="h-4 w-4" /> Connect Gmail
            </a>
          )}
        </CardContent>
      </Card>

      {/* Connection status */}
      <div className="flex gap-4 flex-wrap text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${gmailConn ? 'bg-green-500' : 'bg-red-400'}`} />
          Gmail {gmailConn ? `connected (${gmailConn.email})` : '— not connected'}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted-foreground" />
          Spotify — not connected
        </div>
      </div>
    </div>
  )
}
