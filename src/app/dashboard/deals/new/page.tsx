'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewDealPage() {
  const router = useRouter()
  const supabase = createClient()
  const [artists, setArtists] = useState<{ id: string; name: string; stage_name: string | null }[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    artist_id: '',
    title: '',
    show_date: '',
    offer_amount: '',
    venue_name: '',
    venue_city: '',
    venue_state: '',
    venue_capacity: '',
    promoter_name: '',
    promoter_email: '',
    notes: '',
    status: 'inquiry',
  })

  useEffect(() => {
    supabase.from('artists').select('id, name, stage_name').order('name').then(({ data }) => {
      setArtists(data ?? [])
    })
  }, [])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.artist_id || !form.title) {
      toast.error('Artist and title are required')
      return
    }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      let venue_id: string | null = null
      let promoter_id: string | null = null

      if (form.venue_name) {
        const { data: venue } = await supabase.from('venues').insert({
          name: form.venue_name,
          city: form.venue_city || null,
          state: form.venue_state || null,
          capacity: form.venue_capacity ? parseInt(form.venue_capacity) : null,
        }).select('id').single()
        venue_id = venue?.id ?? null
      }

      if (form.promoter_name) {
        const { data: promoter } = await supabase.from('promoters').insert({
          name: form.promoter_name,
          email: form.promoter_email || null,
        }).select('id').single()
        promoter_id = promoter?.id ?? null
      }

      const { data: deal, error } = await supabase.from('deals').insert({
        artist_id: form.artist_id,
        title: form.title,
        show_date: form.show_date || null,
        offer_amount: form.offer_amount ? parseFloat(form.offer_amount) : null,
        venue_id,
        promoter_id,
        notes: form.notes || null,
        status: form.status as any,
        created_by: user.id,
      }).select('id').single()

      if (error) throw error
      toast.success('Deal created')
      router.push(`/dashboard/deals/${deal.id}`)
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create deal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/deals" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">New Deal</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Deal Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Artist *</Label>
              <Select value={form.artist_id} onValueChange={v => v && set('artist_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select artist..." />
                </SelectTrigger>
                <SelectContent>
                  {artists.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.stage_name ?? a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deal Title *</Label>
              <Input
                placeholder="e.g. Club Venue — Chicago, IL — May 2026"
                value={form.title}
                onChange={e => set('title', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Show Date</Label>
                <Input type="date" value={form.show_date} onChange={e => set('show_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Offer Amount ($)</Label>
                <Input type="number" placeholder="2500" value={form.offer_amount} onChange={e => set('offer_amount', e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => v && set('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['inquiry', 'offer', 'negotiating', 'confirmed', 'completed', 'cancelled'].map(s => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Venue</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Venue Name</Label>
              <Input placeholder="Concourse Project" value={form.venue_name} onChange={e => set('venue_name', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2 col-span-1">
                <Label>City</Label>
                <Input placeholder="Austin" value={form.venue_city} onChange={e => set('venue_city', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input placeholder="TX" value={form.venue_state} onChange={e => set('venue_state', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" placeholder="500" value={form.venue_capacity} onChange={e => set('venue_capacity', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Promoter</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Promoter Name</Label>
                <Input placeholder="Dylan Phillips" value={form.promoter_name} onChange={e => set('promoter_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Promoter Email</Label>
                <Input type="email" placeholder="promoter@email.com" value={form.promoter_email} onChange={e => set('promoter_email', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea placeholder="Routing context, special terms, etc." value={form.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set('notes', e.target.value)} rows={3} />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Creating...' : 'Create Deal'}
          </Button>
          <Link href="/dashboard/deals">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
