'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ExternalLink, Ticket, Zap, CheckCircle2, Copy, ChevronDown, ChevronUp, Megaphone, Globe, Share2 } from 'lucide-react'
import type { ConfirmWorkflowResult } from '@/app/api/deals/confirm-workflow/route'
import type { MetaAdsBrief } from '@/app/api/meta-ads/campaign-brief/route'

const STATUSES = ['inquiry', 'offer', 'negotiating', 'confirmed', 'completed', 'cancelled']

export default function DealActions({
  dealId,
  currentStatus,
  gmailDraftId,
  initialTickets,
  initialSocial,
}: {
  dealId: string
  currentStatus: string
  gmailDraftId: string | null
  initialTickets?: { sold?: number | null; price?: number | null; link?: string | null; capacity?: number | null }
  initialSocial?: { fbEventPosted?: boolean; fbEventLink?: string | null; promoterPosting?: boolean; promoterPostLink?: string | null }
}) {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [showTickets, setShowTickets] = useState(false)
  const [ticketsSold, setTicketsSold] = useState(String(initialTickets?.sold ?? ''))
  const [ticketPrice, setTicketPrice] = useState(String(initialTickets?.price ?? ''))
  const [ticketLink, setTicketLink] = useState(initialTickets?.link ?? '')
  const [ticketCapacity, setTicketCapacity] = useState(String(initialTickets?.capacity ?? ''))
  const [savingTickets, setSavingTickets] = useState(false)
  // Social tracking
  const [showSocial, setShowSocial] = useState(false)
  const [fbEventPosted, setFbEventPosted] = useState(initialSocial?.fbEventPosted ?? false)
  const [fbEventLink, setFbEventLink] = useState(initialSocial?.fbEventLink ?? '')
  const [promoterPosting, setPromoterPosting] = useState(initialSocial?.promoterPosting ?? false)
  const [promoterPostLink, setPromoterPostLink] = useState(initialSocial?.promoterPostLink ?? '')
  const [savingSocial, setSavingSocial] = useState(false)
  const [workflowLoading, setWorkflowLoading] = useState(false)
  const [workflow, setWorkflow] = useState<ConfirmWorkflowResult | null>(null)
  const [workflowOpen, setWorkflowOpen] = useState(false)
  const [adsLoading, setAdsLoading] = useState(false)
  const [adsBrief, setAdsBrief] = useState<MetaAdsBrief | null>(null)
  const [adsOpen, setAdsOpen] = useState(false)

  async function updateStatus(newStatus: string | null) {
    if (!newStatus) return
    setStatus(newStatus)
    setSaving(true)
    const { error } = await supabase.from('deals').update({ status: newStatus as any }).eq('id', dealId)
    setSaving(false)
    if (error) toast.error('Failed to update status')
    else { toast.success('Status updated'); router.refresh() }
  }

  async function generateDraft() {
    setDrafting(true)
    try {
      const res = await fetch('/api/deals/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      toast.success('Draft saved to Gmail')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDrafting(false)
    }
  }

  async function generateAdsBrief() {
    setAdsLoading(true)
    try {
      const res = await fetch('/api/meta-ads/campaign-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setAdsBrief(data.brief)
      setAdsOpen(true)
      toast.success('Meta Ads campaign brief generated')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate brief')
    } finally {
      setAdsLoading(false)
    }
  }

  async function fireWorkflow() {
    setWorkflowLoading(true)
    try {
      const res = await fetch('/api/deals/confirm-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Workflow failed')
      setWorkflow(data)
      setWorkflowOpen(true)
      toast.success('Workflow fired — advance draft saved, tasks created, announcements ready')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Workflow failed')
    } finally {
      setWorkflowLoading(false)
    }
  }

  async function saveTickets() {
    setSavingTickets(true)
    const { error } = await supabase.from('deals').update({
      tickets_sold: ticketsSold ? parseInt(ticketsSold) : null,
      ticket_price: ticketPrice ? parseFloat(ticketPrice) : null,
      ticket_link: ticketLink || null,
      ticket_capacity: ticketCapacity ? parseInt(ticketCapacity) : null,
    } as any).eq('id', dealId)
    setSavingTickets(false)
    if (error) toast.error('Failed to save ticket data')
    else { toast.success('Ticket data saved'); setShowTickets(false); router.refresh() }
  }

  async function saveSocial() {
    setSavingSocial(true)
    const { error } = await supabase.from('deals').update({
      fb_event_posted: fbEventPosted,
      fb_event_link: fbEventLink || null,
      promoter_posting: promoterPosting,
      promoter_post_link: promoterPostLink || null,
    } as any).eq('id', dealId)
    setSavingSocial(false)
    if (error) toast.error('Failed to save social data')
    else { toast.success('Social tracking saved'); setShowSocial(false); router.refresh() }
  }

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={status} onValueChange={updateStatus} disabled={saving}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" onClick={generateDraft} disabled={drafting}>
          {drafting ? 'Generating...' : 'Generate Counter Draft'}
        </Button>

        <Button variant="outline" size="sm" onClick={() => setShowTickets(!showTickets)}>
          <Ticket className="h-3 w-3 mr-1" />
          Ticket Sales
        </Button>

        <Button variant="outline" size="sm" onClick={() => setShowSocial(!showSocial)}
          className={promoterPosting || fbEventPosted ? 'border-green-500/50 text-green-600' : ''}>
          <Share2 className="h-3 w-3 mr-1" />
          {promoterPosting || fbEventPosted ? 'Social Active' : 'Social Tracking'}
        </Button>

        {(status === 'confirmed' || status === 'completed') && (
          <Button
            variant="default"
            size="sm"
            onClick={fireWorkflow}
            disabled={workflowLoading}
            className="gap-1.5"
          >
            {workflowLoading
              ? <><span className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />Running...</>
              : workflow
              ? <><CheckCircle2 className="h-3 w-3" />Workflow Done</>
              : <><Zap className="h-3 w-3" />Fire Confirm Workflow</>
            }
          </Button>
        )}

        {(status === 'confirmed' || status === 'completed') && (
          <Button variant="outline" size="sm" onClick={generateAdsBrief} disabled={adsLoading} className="gap-1.5">
            {adsLoading
              ? <><span className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />Building ads...</>
              : <><Megaphone className="h-3 w-3" />{adsBrief ? 'Ads Brief Ready' : 'Build Meta Ads'}</>
            }
          </Button>
        )}

        {gmailDraftId && (
          <a href="https://mail.google.com/mail/#drafts" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-3 w-3 mr-1" />
              View in Gmail
            </Button>
          </a>
        )}
      </div>

      {workflow && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-green-500/10"
            onClick={() => setWorkflowOpen(o => !o)}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-semibold">Confirm Workflow Complete</span>
              <span className="text-xs text-muted-foreground">{workflow.tasks.length} tasks created · Advance draft ready</span>
            </div>
            {workflowOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>

          {workflowOpen && (
            <div className="border-t px-4 pb-4 space-y-4 pt-4">
              {/* Advance email */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Advance Email</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs">To: <strong>{workflow.advance.to || 'No email — add promoter email to deal'}</strong></span>
                  {workflow.advance.draftId
                    ? <span className="text-[10px] text-green-600 flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" />Saved to Gmail</span>
                    : <span className="text-[10px] text-yellow-600">Draft not saved — Gmail not connected or no promoter email</span>
                  }
                </div>
                <div className="bg-background border rounded p-3 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto font-mono">
                  {workflow.advance.body}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(workflow.advance.body).then(() => toast.success('Copied'))}
                  className="mt-1 text-[10px] text-primary flex items-center gap-1 hover:underline"
                >
                  <Copy className="h-3 w-3" /> Copy email body
                </button>
              </div>

              {/* Announcements */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Show Announcement</p>
                <div className="space-y-2">
                  <div className="bg-background border rounded p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">INSTAGRAM</p>
                    <p className="text-xs whitespace-pre-wrap">{workflow.announcement.instagramCaption}</p>
                    <p className="text-[10px] text-primary mt-1 opacity-70">
                      {workflow.announcement.hashtags.map(h => `#${h}`).join(' ')}
                    </p>
                    <button onClick={() => navigator.clipboard.writeText(workflow.announcement.instagramCaption + '\n\n' + workflow.announcement.hashtags.map(h => `#${h}`).join(' ')).then(() => toast.success('Copied'))} className="text-[10px] text-primary flex items-center gap-1 mt-1 hover:underline">
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                  <div className="bg-background border rounded p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">TWITTER / X</p>
                    <p className="text-xs">{workflow.announcement.twitterCaption}</p>
                    <button onClick={() => navigator.clipboard.writeText(workflow.announcement.twitterCaption).then(() => toast.success('Copied'))} className="text-[10px] text-primary flex items-center gap-1 mt-1 hover:underline">
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Drive folder */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Google Drive Folder</p>
                <div className="bg-background border rounded p-3 space-y-1">
                  <p className="text-xs font-mono font-medium">{workflow.driveFolder.name}</p>
                  {workflow.driveFolder.subfolders.map((f, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground pl-3">{f}</p>
                  ))}
                  <a href={workflow.driveFolder.rootUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-1 pt-1 hover:underline">
                    <ExternalLink className="h-3 w-3" /> Open Drive root → create folder manually
                  </a>
                </div>
              </div>

              {/* Tasks */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Tasks Created ({workflow.tasks.length})</p>
                <div className="space-y-1">
                  {workflow.tasks.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="h-3 w-3 rounded-full border border-muted-foreground/50 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">{t.title}</span>
                        {t.due_date && <span className="text-muted-foreground ml-1">· due {new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {adsBrief && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-blue-500/10"
            onClick={() => setAdsOpen(o => !o)}
          >
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-semibold">Meta Ads Campaign Brief</span>
              <span className="text-xs text-muted-foreground">{adsBrief.campaignName}</span>
            </div>
            {adsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>

          {adsOpen && (
            <div className="border-t px-4 pb-4 pt-4 space-y-4">
              {/* Overview */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><p className="text-[10px] text-muted-foreground uppercase tracking-widest">Budget</p><p className="font-bold">${adsBrief.totalBudget}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase tracking-widest">Target CPT</p><p className="font-bold text-green-600">{adsBrief.targetCPT}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase tracking-widest">Kill Threshold</p><p className="font-bold text-red-500">{adsBrief.killThreshold}</p></div>
              </div>

              {/* Phases */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Campaign Phases</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {adsBrief.phases?.map((phase, i) => (
                    <div key={i} className="bg-background border rounded p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{phase.name}</span>
                        <span className="text-muted-foreground">{phase.timing}</span>
                      </div>
                      <p className="text-muted-foreground">Budget: <span className="font-medium text-foreground">${phase.budget}</span></p>
                      <p className="text-muted-foreground">KPI: <span className="font-medium text-foreground">{phase.kpi} {phase.kpiTarget}</span></p>
                      <p className="italic text-muted-foreground">{phase.creativeDirection}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ad Creatives */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Creative Concepts</p>
                <div className="space-y-2">
                  {adsBrief.creativeFormats?.map((creative, i) => (
                    <div key={i} className="bg-background border rounded p-3 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{creative.format}</span>
                      </div>
                      <p><span className="text-muted-foreground">Hook:</span> {creative.hook}</p>
                      <p><span className="text-muted-foreground">Headline:</span> {creative.headline}</p>
                      <p><span className="text-muted-foreground">Body:</span> {creative.body}</p>
                      <p><span className="text-muted-foreground">CTA:</span> {creative.cta}</p>
                      {creative.notes && <p className="italic text-muted-foreground">{creative.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tracking */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Tracking Setup</p>
                <div className="bg-background border rounded p-3 text-xs space-y-1 font-mono">
                  <p>Pixel: {adsBrief.trackingSetup?.pixel}</p>
                  <p>UTM: {adsBrief.trackingSetup?.utmParams}</p>
                  <p>Events: {adsBrief.trackingSetup?.standardEvents?.join(', ')}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  const text = JSON.stringify(adsBrief, null, 2)
                  navigator.clipboard.writeText(text).then(() => toast.success('Brief copied as JSON'))
                }}
                className="text-[10px] text-primary flex items-center gap-1 hover:underline"
              >
                <Copy className="h-3 w-3" /> Copy full brief as JSON
              </button>
            </div>
          )}
        </div>
      )}

      {showTickets && (
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium">Ticket Sales</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Tickets Sold</label>
              <Input type="number" placeholder="350" value={ticketsSold} onChange={e => setTicketsSold(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Capacity</label>
              <Input type="number" placeholder="500" value={ticketCapacity} onChange={e => setTicketCapacity(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Ticket Price ($)</label>
              <Input type="number" placeholder="20" value={ticketPrice} onChange={e => setTicketPrice(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Ticket Link</label>
              <Input placeholder="https://..." value={ticketLink} onChange={e => setTicketLink(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {ticketsSold && ticketPrice && (
              <span>Gross: <strong className="text-foreground">${(parseInt(ticketsSold) * parseFloat(ticketPrice)).toLocaleString()}</strong></span>
            )}
            {ticketsSold && ticketCapacity && (
              <span>Sell-through: <strong className={
                parseInt(ticketsSold) / parseInt(ticketCapacity) >= 0.8 ? 'text-green-600' :
                parseInt(ticketsSold) / parseInt(ticketCapacity) >= 0.5 ? 'text-yellow-600' : 'text-red-500'
              }>{Math.round(parseInt(ticketsSold) / parseInt(ticketCapacity) * 100)}%</strong></span>
            )}
            {ticketLink && (
              <a href={ticketLink} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 hover:underline">
                <ExternalLink className="h-3 w-3" /> View tickets
              </a>
            )}
          </div>
          <Button size="sm" onClick={saveTickets} disabled={savingTickets}>
            {savingTickets ? 'Saving...' : 'Save'}
          </Button>
        </div>
      )}

      {showSocial && (
        <div className="bg-muted/30 rounded-lg p-4 space-y-4">
          <p className="text-sm font-medium">Social &amp; Promoter Activity</p>

          {/* FB Event */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-blue-500 shrink-0" />
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={fbEventPosted}
                  onChange={e => setFbEventPosted(e.target.checked)}
                  className="h-3 w-3 accent-blue-500"
                />
                <span className={fbEventPosted ? 'text-blue-600 font-medium' : 'text-muted-foreground'}>
                  {fbEventPosted ? 'FB event is live' : 'FB event not posted yet'}
                </span>
              </label>
              {fbEventLink && (
                <a href={fbEventLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-1 hover:underline ml-auto">
                  <ExternalLink className="h-3 w-3" /> Open event
                </a>
              )}
            </div>
            <Input
              placeholder="Facebook event URL (https://facebook.com/events/...)"
              value={fbEventLink}
              onChange={e => setFbEventLink(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Promoter posting */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Share2 className="h-4 w-4 text-purple-500 shrink-0" />
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoterPosting}
                  onChange={e => setPromoterPosting(e.target.checked)}
                  className="h-3 w-3 accent-purple-500"
                />
                <span className={promoterPosting ? 'text-purple-600 font-medium' : 'text-muted-foreground'}>
                  {promoterPosting ? 'Promoter is actively posting / advertising' : 'Promoter posting not confirmed'}
                </span>
              </label>
              {promoterPostLink && (
                <a href={promoterPostLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-1 hover:underline ml-auto">
                  <ExternalLink className="h-3 w-3" /> Latest post
                </a>
              )}
            </div>
            <Input
              placeholder="Link to promoter's most recent post/story about the show"
              value={promoterPostLink}
              onChange={e => setPromoterPostLink(e.target.value)}
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              Search: <a href={`https://www.facebook.com/search/events`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">FB Events</a>
              {' · '}
              <a href={`https://www.instagram.com/explore/`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Instagram</a>
              {' · '}
              <a href={`https://twitter.com/search`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">X/Twitter</a>
            </p>
          </div>

          <Button size="sm" onClick={saveSocial} disabled={savingSocial}>
            {savingSocial ? 'Saving...' : 'Save Social Tracking'}
          </Button>
        </div>
      )}
    </div>
  )
}
