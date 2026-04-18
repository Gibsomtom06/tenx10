import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users, Handshake, Mail, Music2, DollarSign,
  Send, ArrowUpRight, Globe, MapPin, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Top listener cities from DSR knowledge base — cities not yet on TMTYL 2026
const LISTENER_MARKETS = [
  { city: 'Seattle, WA', listeners: 4200, growth: 18 },
  { city: 'Portland, OR', listeners: 3800, growth: 14 },
  { city: 'Atlanta, GA', listeners: 5100, growth: 22 },
  { city: 'Miami, FL', listeners: 4600, growth: 19 },
  { city: 'San Diego, CA', listeners: 3400, growth: 11 },
  { city: 'Salt Lake City, UT', listeners: 2900, growth: 16 },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { count: artistCount },
    { data: deals },
    { data: gmailConn },
    { data: contacts },
    { data: profile },
  ] = await Promise.all([
    supabase.from('artists').select('*', { count: 'exact', head: true }),
    supabase.from('deals').select('offer_amount, status, show_date, deal_points').neq('status', 'cancelled'),
    supabase.from('gmail_connections').select('id, email').eq('user_id', user?.id ?? '').single(),
    supabase.from('contacts').select('pitch_status', { count: 'exact' }).neq('pitch_status', 'not_contacted'),
    supabase.from('profiles').select('full_name').eq('id', user?.id ?? '').single(),
  ])

  const setupSteps = [
    { label: 'Account configured', done: !!profile?.full_name, href: '/onboarding' },
    { label: 'Artist on roster', done: (artistCount ?? 0) > 0, href: '/dashboard/artists/new' },
    { label: 'Gmail connected', done: !!gmailConn, href: '/api/gmail/connect' },
    { label: 'Bookings imported', done: (deals?.length ?? 0) > 0, href: '/dashboard/import' },
  ]
  const setupComplete = setupSteps.every(s => s.done)
  const setupProgress = setupSteps.filter(s => s.done).length

  const activeDealCount = deals?.length ?? 0
  const confirmedDeals = deals?.filter(d => ['confirmed', 'completed'].includes(d.status)) ?? []
  const totalRevenue = confirmedDeals.reduce((sum, d) => sum + (d.offer_amount ?? 0), 0)
  const pitchedCount = contacts?.length ?? 0

  // Cities already covered by confirmed deals
  const coveredCities = new Set(
    (deals ?? [])
      .filter(d => ['confirmed', 'offer', 'negotiating'].includes(d.status))
      .map(d => {
        const pts = d.deal_points as Record<string, string> | null
        return pts?.city?.toLowerCase()
      })
      .filter(Boolean)
  )

  const missingMarkets = LISTENER_MARKETS.filter(
    m => !coveredCities.has(m.city.split(',')[0].toLowerCase())
  )

  return (
    <div className="p-6 space-y-8">

      {/* Setup progress banner */}
      {!setupComplete && (
        <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Setup {setupProgress}/{setupSteps.length} complete</p>
                <p className="text-xs text-muted-foreground mt-0.5">Finish setup to unlock the full pipeline</p>
                <div className="flex flex-wrap gap-3 mt-3">
                  {setupSteps.map(s => (
                    <a key={s.label} href={s.href} className={cn(
                      'flex items-center gap-1.5 text-xs',
                      s.done ? 'text-green-600 pointer-events-none' : 'text-yellow-600 hover:underline'
                    )}>
                      {s.done
                        ? <CheckCircle2 className="h-3 w-3" />
                        : <span className="h-3 w-3 rounded-full border border-yellow-500 inline-block" />
                      }
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <Link href="/onboarding" className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'shrink-0 border-yellow-500/50 text-yellow-700 hover:bg-yellow-500/10')}>
              Continue setup
            </Link>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground text-sm">DirtySnatcha Records — TMTYL 2026</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Guaranteed Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">
              ${totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{confirmedDeals.length} confirmed show{confirmedDeals.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Deals</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDealCount}</div>
            <p className="text-xs text-muted-foreground mt-1">inquiry → confirmed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Promoters Pitched</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pitchedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/dashboard/outreach" className="hover:underline">view outreach →</Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Roster</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{artistCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/dashboard/artists" className="hover:underline">manage roster →</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-primary" /> Market Intelligence
            </CardTitle>
            <CardDescription>High-listener cities not yet on TMTYL 2026</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {missingMarkets.length === 0 ? (
              <p className="text-sm text-muted-foreground">All major listener markets covered.</p>
            ) : (
              missingMarkets.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border group hover:border-primary/40 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" /> {m.city}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      ~{m.listeners.toLocaleString()} est. monthly listeners
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 dark:text-green-400 font-mono flex items-center">
                      <ArrowUpRight className="h-3 w-3" />+{m.growth}%
                    </span>
                    <Link
                      href={`/dashboard/outreach`}
                      className="text-xs opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:underline"
                    >
                      Pitch →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/outreach" className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' w-full justify-start gap-2'}>
              <Send className="h-4 w-4" /> Generate booking pitch
            </Link>
            <Link href="/dashboard/gmail?tab=analyze" className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' w-full justify-start gap-2'}>
              <Mail className="h-4 w-4" /> Analyze incoming offer
            </Link>
            <Link href="/dashboard/gmail" className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' w-full justify-start gap-2'}>
              <Mail className="h-4 w-4" /> Check inbox for offers
            </Link>
            <Link href="/dashboard/deals" className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' w-full justify-start gap-2'}>
              <Handshake className="h-4 w-4" /> View all deals
            </Link>
            {!gmailConn && (
              <a href="/api/gmail/connect" className={buttonVariants({ size: 'sm' }) + ' w-full justify-start gap-2'}>
                <Mail className="h-4 w-4" /> Connect Gmail
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connection status */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${gmailConn ? 'bg-green-500' : 'bg-muted-foreground'}`} />
          Gmail {gmailConn ? `(${gmailConn.email})` : 'not connected'}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-muted-foreground" />
          Spotify not connected
        </div>
      </div>
    </div>
  )
}
