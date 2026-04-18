'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { FileEdit, ChevronDown, ChevronUp, Loader2, CheckCircle2 } from 'lucide-react'

interface DealPoints {
  city?: string
  state?: string
  venue?: string
  promoterName?: string
  promoterEmail?: string
  promoterPhone?: string
  support?: string
  loadIn?: string
  soundCheck?: string
  setTime?: string
  doors?: string
  hotel?: boolean
  hotelName?: string
  hotelAddress?: string
  hotelConfirmation?: string
  flight?: boolean
  ground?: boolean
  groundContact?: string
  ticketLink?: string
  depositPaid?: boolean
  depositAmount?: string
  balancePaid?: boolean
  [key: string]: string | boolean | number | undefined
}

interface Props {
  dealId: string
  dealPoints: DealPoints | null
}

export default function DealPointsEditor({ dealId, dealPoints }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pts, setPts] = useState<DealPoints>(dealPoints ?? {})

  function set(k: keyof DealPoints, v: string | boolean) {
    setPts(p => ({ ...p, [k]: v }))
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('deals')
      .update({ deal_points: pts } as any)
      .eq('id', dealId)
    setSaving(false)
    if (error) {
      toast.error('Failed to save: ' + error.message)
    } else {
      toast.success('Advance details saved')
      router.refresh()
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <FileEdit className="h-4 w-4" />
        Edit Advance Details
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <Card className="mt-3 border-muted">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Advance Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Location */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Show Info</p>
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="City" value={pts.city ?? ''} onChange={e => set('city', e.target.value)} className="text-sm" />
                <Input placeholder="State" value={pts.state ?? ''} onChange={e => set('state', e.target.value)} className="text-sm" />
                <Input placeholder="Venue" value={pts.venue ?? ''} onChange={e => set('venue', e.target.value)} className="text-sm col-span-3 md:col-span-1" />
              </div>
              <div className="mt-2">
                <Input placeholder="Support artists (e.g. OZZTIN, MAVIC)" value={pts.support ?? ''} onChange={e => set('support', e.target.value)} className="text-sm" />
              </div>
            </div>

            {/* Run of Show */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Run of Show</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Doors</label>
                  <Input placeholder="7:00 PM" value={pts.doors ?? ''} onChange={e => set('doors', e.target.value)} className="text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Load In</label>
                  <Input placeholder="5:00 PM" value={pts.loadIn ?? ''} onChange={e => set('loadIn', e.target.value)} className="text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Sound Check</label>
                  <Input placeholder="6:00 PM" value={pts.soundCheck ?? ''} onChange={e => set('soundCheck', e.target.value)} className="text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Set Time</label>
                  <Input placeholder="10:00 PM" value={pts.setTime ?? ''} onChange={e => set('setTime', e.target.value)} className="text-sm" />
                </div>
              </div>
            </div>

            {/* Promoter */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Promoter Contact</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input placeholder="Promoter name" value={pts.promoterName ?? ''} onChange={e => set('promoterName', e.target.value)} className="text-sm" />
                <Input placeholder="Promoter email" type="email" value={pts.promoterEmail ?? ''} onChange={e => set('promoterEmail', e.target.value)} className="text-sm" />
                <Input placeholder="Promoter phone" value={pts.promoterPhone ?? ''} onChange={e => set('promoterPhone', e.target.value)} className="text-sm" />
              </div>
            </div>

            {/* Hotel */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Hotel</p>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={!!pts.hotel}
                    onChange={e => set('hotel', e.target.checked)}
                    className="h-3 w-3"
                  />
                  Included in deal
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input placeholder="Hotel name" value={pts.hotelName ?? ''} onChange={e => set('hotelName', e.target.value)} className="text-sm" />
                <Input placeholder="Hotel address" value={pts.hotelAddress ?? ''} onChange={e => set('hotelAddress', e.target.value)} className="text-sm" />
                <Input placeholder="Confirmation #" value={pts.hotelConfirmation ?? ''} onChange={e => set('hotelConfirmation', e.target.value)} className="text-sm" />
              </div>
            </div>

            {/* Travel + Ground */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Travel</p>
              <div className="flex items-center gap-4 text-xs mb-2">
                <label className="flex items-center gap-1.5 text-muted-foreground">
                  <input type="checkbox" checked={!!pts.flight} onChange={e => set('flight', e.target.checked)} className="h-3 w-3" />
                  Flight included
                </label>
                <label className="flex items-center gap-1.5 text-muted-foreground">
                  <input type="checkbox" checked={!!pts.ground} onChange={e => set('ground', e.target.checked)} className="h-3 w-3" />
                  Ground transport
                </label>
              </div>
              <Input placeholder="Ground contact (name + number)" value={pts.groundContact ?? ''} onChange={e => set('groundContact', e.target.value)} className="text-sm" />
            </div>

            {/* Ticket link */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Tickets</p>
              <Input placeholder="Ticket link (dice.fm, ra.co, etc.)" value={pts.ticketLink ?? ''} onChange={e => set('ticketLink', e.target.value)} className="text-sm" />
            </div>

            {/* Payment status */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Payment Status</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input type="checkbox" checked={!!pts.depositPaid} onChange={e => set('depositPaid', e.target.checked)} className="h-3 w-3" />
                    <span className={pts.depositPaid ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                      {pts.depositPaid ? '✓ Deposit received' : 'Deposit not received'}
                    </span>
                  </label>
                  <Input placeholder="Deposit amount ($)" type="number" value={pts.depositAmount ?? ''} onChange={e => set('depositAmount', e.target.value)} className="text-sm" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs">
                    <input type="checkbox" checked={!!pts.balancePaid} onChange={e => set('balancePaid', e.target.checked)} className="h-3 w-3" />
                    <span className={pts.balancePaid ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                      {pts.balancePaid ? '✓ Balance received' : 'Balance not received'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <Button onClick={save} disabled={saving} size="sm">
              {saving ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Saving...</> : <><CheckCircle2 className="h-3 w-3 mr-1" />Save Advance Details</>}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
