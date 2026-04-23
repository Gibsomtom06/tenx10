import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Globe, Share2, Ticket, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import DealActions from './DealActions'
import DealPointsEditor from './DealPointsEditor'

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: rawDeal } = await supabase
    .from('deals')
    .select('*, artists(*), venues(*), promoters(*)')
    .eq('id', id)
    .single()

  if (!rawDeal) notFound()

  const deal = rawDeal as any
  const points = deal.deal_points ?? {}

  const STATUS_COLOR: Record<string, string> = {
    inquiry: 'secondary', offer: 'outline', negotiating: 'default',
    confirmed: 'default', completed: 'secondary', cancelled: 'destructive',
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/deals" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{deal.title}</h1>
          <p className="text-sm text-muted-foreground">{deal.show_date ?? 'No date set'}</p>
          {/* Social + ticket signals */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {deal.tickets_sold != null && (
              <span className="flex items-center gap-1 text-[10px] bg-muted px-2 py-0.5 rounded-full">
                <Ticket className="h-2.5 w-2.5" />
                {deal.tickets_sold.toLocaleString()} sold
                {deal.ticket_capacity ? ` / ${deal.ticket_capacity.toLocaleString()} cap (${Math.round(deal.tickets_sold / deal.ticket_capacity * 100)}%)` : ''}
              </span>
            )}
            {deal.ticket_link && (
              <a href={deal.ticket_link} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                <ExternalLink className="h-2.5 w-2.5" /> Ticket link
              </a>
            )}
            <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
              deal.fb_event_posted
                ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                : 'bg-muted text-muted-foreground border-transparent'
            }`}>
              <Globe className="h-2.5 w-2.5" />
              {deal.fb_event_posted ? (
                deal.fb_event_link
                  ? <a href={deal.fb_event_link} target="_blank" rel="noopener noreferrer" className="hover:underline">FB event live</a>
                  : 'FB event live'
              ) : 'No FB event'}
            </span>
            <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
              deal.promoter_posting
                ? 'bg-purple-500/10 text-purple-600 border-purple-500/30'
                : 'bg-muted text-muted-foreground border-transparent'
            }`}>
              <Share2 className="h-2.5 w-2.5" />
              {deal.promoter_posting ? (
                deal.promoter_post_link
                  ? <a href={deal.promoter_post_link} target="_blank" rel="noopener noreferrer" className="hover:underline">Promoter posting</a>
                  : 'Promoter posting'
              ) : 'Promoter not tracked'}
            </span>
          </div>
        </div>
        <Badge variant={STATUS_COLOR[deal.status] as any}>{deal.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Artist</CardTitle></CardHeader>
          <CardContent>
            <p className="font-semibold">{(deal.artists as any)?.stage_name ?? (deal.artists as any)?.name ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Offer</CardTitle></CardHeader>
          <CardContent>
            <p className="font-semibold text-xl">
              {deal.offer_amount ? `$${Number(deal.offer_amount).toLocaleString()}` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Venue</CardTitle></CardHeader>
          <CardContent>
            {deal.venues ? (
              <>
                <p className="font-semibold">{(deal.venues as any).name}</p>
                <p className="text-sm text-muted-foreground">
                  {[(deal.venues as any).city, (deal.venues as any).state].filter(Boolean).join(', ')}
                  {(deal.venues as any).capacity && ` · Cap. ${(deal.venues as any).capacity.toLocaleString()}`}
                </p>
              </>
            ) : <p className="text-muted-foreground">—</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Promoter</CardTitle></CardHeader>
          <CardContent>
            {deal.promoters ? (
              <>
                <p className="font-semibold">{(deal.promoters as any).name}</p>
                {(deal.promoters as any).email && (
                  <p className="text-sm text-muted-foreground">{(deal.promoters as any).email}</p>
                )}
              </>
            ) : <p className="text-muted-foreground">—</p>}
          </CardContent>
        </Card>
      </div>

      {deal.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{deal.notes}</p></CardContent>
        </Card>
      )}

      {points.decision && (
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">AI Decision</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className={cn('text-sm font-semibold px-2 py-1 rounded w-fit',
              points.decision.recommendation === 'ACCEPT' ? 'bg-green-500/10 text-green-600' :
              points.decision.recommendation === 'DECLINE' ? 'bg-red-500/10 text-red-600' :
              'bg-yellow-500/10 text-yellow-600'
            )}>
              {points.decision.recommendation}
            </div>
            {points.decision.steps?.map((step: any, i: number) => (
              <div key={i} className="text-sm border-l-2 border-muted pl-3">
                <p className="font-medium">{step.step}</p>
                <p className="text-muted-foreground">{step.reasoning}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {points.counterTerms && (
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Counter Terms</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {points.counterTerms.adjustedGuarantee && (
              <p><span className="font-medium">Adjusted Guarantee:</span> ${points.counterTerms.adjustedGuarantee.toLocaleString()}</p>
            )}
            {points.counterTerms.radiusClause && (
              <p><span className="font-medium">Radius Clause:</span> {points.counterTerms.radiusClause}</p>
            )}
            {points.counterTerms.paymentTiming && (
              <p><span className="font-medium">Payment:</span> {points.counterTerms.paymentTiming}</p>
            )}
            {points.counterTerms.hotelBuyout && (
              <p><span className="font-medium">Hotel Buyout:</span> {points.counterTerms.hotelBuyout}</p>
            )}
          </CardContent>
        </Card>
      )}

      {points.emailDraft && (
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Counter Email Draft</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/30 rounded p-3">{points.emailDraft}</pre>
          </CardContent>
        </Card>
      )}

      <DealPointsEditor dealId={deal.id} dealPoints={points as any} />

      <DealActions
        dealId={deal.id}
        currentStatus={deal.status}
        gmailDraftId={deal.gmail_draft_id}
        initialTickets={{ sold: deal.tickets_sold, price: deal.ticket_price, link: deal.ticket_link, capacity: deal.ticket_capacity }}
        initialSocial={{ fbEventPosted: deal.fb_event_posted, fbEventLink: deal.fb_event_link, promoterPosting: deal.promoter_posting, promoterPostLink: deal.promoter_post_link }}
      />
    </div>
  )
}
