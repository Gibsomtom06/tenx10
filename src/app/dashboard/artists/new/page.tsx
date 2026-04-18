'use client'

import { useState } from 'react'
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

export default function NewArtistPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    stage_name: '',
    email: '',
    phone: '',
    genre: '',
    bio: '',
    status: 'active',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { toast.error('Legal name is required'); return }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const { error } = await supabase.from('artists').insert({
        name: form.name,
        stage_name: form.stage_name || null,
        email: form.email || null,
        phone: form.phone || null,
        genre: form.genre || null,
        bio: form.bio || null,
        status: form.status as any,
        manager_id: user.id,
      })
      if (error) throw error
      toast.success('Artist added')
      router.push('/dashboard/artists')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to add artist')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/artists" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Add Artist</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Artist Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Legal Name *</Label>
                <Input placeholder="Lee Bray" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Stage Name</Label>
                <Input placeholder="DirtySnatcha" value={form.stage_name} onChange={e => set('stage_name', e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Genre</Label>
              <Input placeholder="Dubstep, Riddim, Bass Music" value={form.genre} onChange={e => set('genre', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="artist@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" placeholder="555-000-0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => v && set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                placeholder="Short artist bio..."
                value={form.bio}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set('bio', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Adding...' : 'Add Artist'}
          </Button>
          <Link href="/dashboard/artists">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
