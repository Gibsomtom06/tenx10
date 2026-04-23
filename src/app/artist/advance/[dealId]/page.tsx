import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, MapPin, Calendar, DollarSign, Music2, Phone, Mail, Hotel, Car } from 'lucide-react'
import Link from 'next/link'
import { AdvanceTabs } from './AdvanceTabs'

export const metadata = { title: 'Show Advance — TENx10' }

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-500/15 text-green-700 dark:text-green-400',
  offer: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  negotiating: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  inquiry: 'bg-muted text-muted-foreground',
  completed: 'bg-muted text-muted-foreground',
}

export default async function ArtistAdvancePage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get all artist_ids this user manages
  const { data: memberships } = await supabase
    .from('artist_members')
    .select('artist_id')
    .eq('user_id', user.id)
  const managedArtistIds = ((memberships ?? []) as any[]).map((m: any) => m.artist_id)
  if (!managedArtistIds.length) redirect('/dashboard')

  const { data: rawDeal } = await supabase
    .from('deals')
    .select('*, venues(name, city, state), promoters(name, email, phone)')
    .eq('id', dealId)
    .single()

  if (!rawDeal) redirect('/artist/advance')
  const deal = rawDeal as any

  // Verify this deal belongs to one of the user's managed artists
  if (!managedArtistIds.includes(deal.artist_id)) redirect('/artist/advance')

  // Load threads with messages
  const { data: rawThreads } = await supabase
    .from('deal_threads')
    .select('*, deal_messages(*)')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true })

  const threads = ((rawThreads ?? []) as any[]).map((t: any) => ({
    ...t,
    messages: ((t.deal_messages ?? []) as any[]).sort((a: any, b: any) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  }))

  const { data: attachments } = await supabase
    .from('deal_attachments')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false })

  const pts = (deal.deal_points as Record<string, unknown>) ?? {}
  const joinedVenue = deal.venues as { name: string; city: string | null; state: string | null } | null
  const joinedPromoter = deal.promoters as { name: string; email: string | null; phone: string | null } | null

  const city = (pts.city as string) ?? joinedVenue?.city ?? deal.title
  const state = (pts.state as string) ?? joinedVenue?.state ?? ''
  const venue = (pts.venue as string) ?? joinedVenue?.name ?? ''
  const promoterName = (pts.promoterName as string) ?? (pts.promoter as string) ?? joinedPromoter?.name ?? ''
  const promoterEmail = (pts.promoterEmail as string) ?? joinedPromoter?.email ?? ''
  const promoterPhone = (pts.promoterPhone as string) ?? joinedPromoter?.phone ?? ''

  const showDateFormatted = deal.show_date
    ? new Date(deal.show_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'TBD'

  const isConfirmed = ['confirmed', 'completed'].includes(deal.status)
  const daysUntil = deal.show_date
    ? Math.floor((new Date(deal.show_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/artist/advance" className="text-xs text-muted-foreground hover:text-foreground">← Back to advances</Link>
          <h1 className="text-2xl font-bold mt-1">
            <MapPin className="h-5 w-5 inline mr-1.5 text-muted-foreground" />
            {city}{state ? `, ${state}` : ''}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`text-xs ${STATUS_COLORS[deal.status] ?? ''}`}>{deal.status}</Badge>
            {daysUntil !== null && daysUntil >= 0 && (
              <span className="text-xs text-muted-foreground">
                {daysUntil === 0 ? '🔥 TODAY' : daysUntil === 1 ? '🔥 Tomorrow' : `${daysUntil} days away`}
              </span>
            )}
          </div>
        </div>
        {deal.offer_amount && (
          <div className="text-right">
            <div className="text-2xl font-black text-primary">${deal.offer_amount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">guarantee</div>
          </div>
        )}
      </div>

      {!isConfirmed && (
        <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm"><span className="font-medium">Not yet confirmed.</span> <span className="text-muted-foreground">Thomas is negotiating.</span></p>
        </div>
      )}

      {/* Show Details */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" />Show Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{showDateFormatted}</p>
            </div>
            {venue && <div><p className="text-xs text-muted-foreground">Venue</p><p className="font-medium">{venue}</p></div>}
          </div>
        </CardContent>
      </Card>

      {/* Tech Rider */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Music2 className="h-4 w-4" />Technical Requirements</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="font-medium text-foreground text-sm mb-2">DirtySnatcha Tech Rider</p>
            <p>· 1× DJM 900NXS mixer</p>
            <p>· 4× Pioneer CDJ-2000NXS2 (all linked, latest firmware)</p>
            <p>· 2× 15" booth monitors, adjustable through mixer</p>
            <p>· 1× wireless microphone with spare batteries</p>
            <p>· 1× large fan on stage pointed toward setup</p>
            <p>· LED wall capable of displaying artist visual pack</p>
            <p className="pt-1">
              Visuals:{' '}
              <a href="https://drive.google.com/drive/folders/1Too2Xz07O6dl5VuSvvRjWccOLlu1onWs" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Drive folder →
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Management */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Your Management</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Thomas Nalian</p>
              <p className="text-xs text-muted-foreground">Manager</p>
              <a href="mailto:thomas@dirtysnatcha.com" className="text-xs text-primary hover:underline">thomas@dirtysnatcha.com</a>
              <p className="text-xs text-muted-foreground">248-765-1997</p>
            </div>
            <div>
              <p className="font-medium">Andrew @ AB Touring</p>
              <p className="text-xs text-muted-foreground">Booking Agent</p>
              <a href="mailto:andrew@abtouring.com" className="text-xs text-primary hover:underline">andrew@abtouring.com</a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed section: Advance Details + Threads + Documents */}
      <AdvanceTabs
        dealId={dealId}
        dealPoints={pts as Record<string, unknown>}
        threads={threads}
        attachments={attachments ?? []}
      />
    </div>
  )
}
