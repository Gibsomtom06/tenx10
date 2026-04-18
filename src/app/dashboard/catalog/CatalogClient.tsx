'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Music2, Plus, Loader2, CheckCircle2, ExternalLink,
  TrendingUp, Lock, FileAudio, Users, Archive,
} from 'lucide-react'
import { toast } from 'sonner'
import type { CatalogTrack } from '@/types/database'

type Bucket = CatalogTrack['bucket']

interface BucketDef {
  id: Bucket
  label: string
  description: string
  icon: React.ElementType
  color: string
  border: string
}

const BUCKETS: BucketDef[] = [
  {
    id: 'released_full',
    label: 'Released — Full Distribution',
    description: 'Live on all DSPs via VMG',
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    border: 'border-l-green-500',
  },
  {
    id: 'soundcloud_only',
    label: 'SoundCloud / YouTube Only',
    description: 'Free platforms, limited distribution',
    icon: Music2,
    color: 'text-orange-600 dark:text-orange-400',
    border: 'border-l-orange-500',
  },
  {
    id: 'unreleased_collab',
    label: 'Unreleased Collabs',
    description: 'Collab tracks pending release decisions',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    border: 'border-l-blue-500',
  },
  {
    id: 'wip',
    label: 'Work in Progress',
    description: 'In studio — not mastered or released',
    icon: FileAudio,
    color: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-l-yellow-500',
  },
  {
    id: 'vault',
    label: 'Vault',
    description: 'Shelved / archived — not for release',
    icon: Archive,
    color: 'text-muted-foreground',
    border: 'border-l-muted-foreground',
  },
]

interface AddTrackFormProps {
  artistId: string
  onAdded: (track: CatalogTrack) => void
}

function AddTrackForm({ artistId, onAdded }: AddTrackFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    type: 'single',
    bucket: 'released_full' as Bucket,
    release_date: '',
    isrc: '',
    streams: '',
    collaborators: '',
    streaming_url: '',
    notes: '',
  })

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return
    setLoading(true)
    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          artist_id: artistId,
          streams: form.streams ? parseInt(form.streams) : null,
          release_date: form.release_date || null,
          isrc: form.isrc || null,
          collaborators: form.collaborators || null,
          streaming_url: form.streaming_url || null,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onAdded(data.track)
      setForm({ title: '', type: 'single', bucket: 'released_full', release_date: '', isrc: '', streams: '', collaborators: '', streaming_url: '', notes: '' })
      setOpen(false)
      toast.success('Track added to catalog')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" /> Add Track
      </Button>
    )
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4">
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Track title *"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="col-span-2 text-sm"
              required
            />
            <select
              value={form.type}
              onChange={e => set('type', e.target.value)}
              className="text-sm border rounded-md px-3 py-2 bg-background"
            >
              <option value="single">Single</option>
              <option value="ep">EP</option>
              <option value="album">Album</option>
              <option value="remix">Remix</option>
              <option value="collab">Collab</option>
              <option value="unreleased">Unreleased</option>
            </select>
            <select
              value={form.bucket}
              onChange={e => set('bucket', e.target.value as Bucket)}
              className="text-sm border rounded-md px-3 py-2 bg-background"
            >
              {BUCKETS.map(b => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
            <Input placeholder="Release date" type="date" value={form.release_date} onChange={e => set('release_date', e.target.value)} className="text-sm" />
            <Input placeholder="ISRC" value={form.isrc} onChange={e => set('isrc', e.target.value)} className="text-sm" />
            <Input placeholder="Stream count" type="number" value={form.streams} onChange={e => set('streams', e.target.value)} className="col-span-2 text-sm" />
            <Input placeholder="Collaborators (e.g. OZZTIN)" value={form.collaborators} onChange={e => set('collaborators', e.target.value)} className="col-span-2 text-sm" />
            <Input placeholder="Streaming URL" value={form.streaming_url} onChange={e => set('streaming_url', e.target.value)} className="col-span-2 text-sm" />
            <Input placeholder="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} className="col-span-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading || !form.title}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

interface TrackCardProps {
  track: CatalogTrack
  onMove: (id: string, bucket: Bucket) => void
}

function TrackCard({ track, onMove }: TrackCardProps) {
  const [moving, setMoving] = useState(false)

  async function moveTo(bucket: Bucket) {
    if (bucket === track.bucket) return
    setMoving(true)
    try {
      const res = await fetch('/api/catalog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: track.id, bucket }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onMove(track.id, bucket)
      toast.success(`Moved to ${BUCKETS.find(b => b.id === bucket)?.label}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setMoving(false)
    }
  }

  return (
    <div className="p-3 rounded-lg bg-background border group hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{track.title}</div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Badge variant="outline" className="text-[10px] capitalize">{track.type}</Badge>
            {track.collaborators && (
              <span className="text-[10px] text-muted-foreground">w/ {track.collaborators}</span>
            )}
            {track.release_date && (
              <span className="text-[10px] text-muted-foreground">{new Date(track.release_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            )}
          </div>
          {track.streams && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
              <TrendingUp className="h-2.5 w-2.5" />
              {(track.streams / 1000000).toFixed(2)}M streams
            </div>
          )}
          {track.isrc && (
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{track.isrc}</div>
          )}
          {track.notes && (
            <div className="text-[10px] text-muted-foreground italic mt-1">{track.notes}</div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {track.streaming_url && (
            <a href={track.streaming_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {moving ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : (
            <select
              value={track.bucket}
              onChange={e => moveTo(e.target.value as Bucket)}
              className="text-[10px] border rounded px-1 py-0.5 bg-background opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {BUCKETS.map(b => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  )
}

interface Props {
  initialTracks: CatalogTrack[]
  artistId: string
  artistName: string
}

export default function CatalogClient({ initialTracks, artistId, artistName }: Props) {
  const [tracks, setTracks] = useState<CatalogTrack[]>(initialTracks)
  const [searchQuery, setSearchQuery] = useState('')

  function handleAdded(track: CatalogTrack) {
    setTracks(t => [track, ...t])
  }

  function handleMove(id: string, bucket: Bucket) {
    setTracks(t => t.map(tr => tr.id === id ? { ...tr, bucket } : tr))
  }

  const filtered = searchQuery
    ? tracks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.collaborators?.toLowerCase().includes(searchQuery.toLowerCase()))
    : tracks

  const totalStreams = tracks.reduce((s, t) => s + (t.streams ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="font-bold text-2xl">{tracks.length}</span>
          <span className="text-muted-foreground ml-1">tracks</span>
        </div>
        {totalStreams > 0 && (
          <div>
            <span className="font-bold text-2xl">{(totalStreams / 1000000).toFixed(1)}M</span>
            <span className="text-muted-foreground ml-1">total streams</span>
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <Input
            placeholder="Search catalog..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-48 text-sm h-8"
          />
          <AddTrackForm artistId={artistId} onAdded={handleAdded} />
        </div>
      </div>

      {/* Buckets */}
      <div className="space-y-6">
        {BUCKETS.map(bucket => {
          const bucketTracks = filtered.filter(t => t.bucket === bucket.id)
          const Icon = bucket.icon
          return (
            <Card key={bucket.id} className={`border-l-4 ${bucket.border}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${bucket.color}`} />
                    <CardTitle className="text-sm">{bucket.label}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{bucketTracks.length}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{bucket.description}</span>
                </div>
              </CardHeader>
              {bucketTracks.length > 0 && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                    {bucketTracks.map(track => (
                      <TrackCard key={track.id} track={track} onMove={handleMove} />
                    ))}
                  </div>
                </CardContent>
              )}
              {bucketTracks.length === 0 && (
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground py-2">No tracks in this bucket.</p>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
