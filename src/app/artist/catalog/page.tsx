import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle2, Music2, Users, FileAudio, Archive,
  TrendingUp, ExternalLink, type LucideIcon,
} from 'lucide-react'
import type { CatalogTrack } from '@/types/database'

export const metadata = { title: 'My Catalog — TENx10' }

type Bucket = CatalogTrack['bucket']

const BUCKETS: { id: Bucket; label: string; description: string; icon: LucideIcon; color: string; border: string }[] = [
  {
    id: 'released_full',
    label: 'Released — Full Distribution',
    description: 'Live on all DSPs',
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    border: 'border-l-green-500',
  },
  {
    id: 'soundcloud_only',
    label: 'SoundCloud / YouTube Only',
    description: 'Free platforms only',
    icon: Music2,
    color: 'text-orange-600 dark:text-orange-400',
    border: 'border-l-orange-500',
  },
  {
    id: 'unreleased_collab',
    label: 'Unreleased Collabs',
    description: 'Pending release decisions',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    border: 'border-l-blue-500',
  },
  {
    id: 'wip',
    label: 'Work in Progress',
    description: 'In studio — not mastered yet',
    icon: FileAudio,
    color: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-l-yellow-500',
  },
  {
    id: 'vault',
    label: 'Vault',
    description: 'Shelved / archived',
    icon: Archive,
    color: 'text-muted-foreground',
    border: 'border-l-muted-foreground',
  },
]

function TrackCard({ track }: { track: CatalogTrack }) {
  return (
    <div className="p-3 rounded-lg bg-background border">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{track.title}</div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Badge variant="outline" className="text-[10px] capitalize">{track.type}</Badge>
            {track.collaborators && (
              <span className="text-[10px] text-muted-foreground">w/ {track.collaborators}</span>
            )}
            {track.release_date && (
              <span className="text-[10px] text-muted-foreground">
                {new Date(track.release_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
          {track.streams != null && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
              <TrendingUp className="h-2.5 w-2.5" />
              {(track.streams / 1_000_000).toFixed(2)}M streams
            </div>
          )}
          {track.isrc && (
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{track.isrc}</div>
          )}
          {track.notes && (
            <div className="text-[10px] text-muted-foreground italic mt-1">{track.notes}</div>
          )}
        </div>
        {track.streaming_url && (
          <a href={track.streaming_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary shrink-0">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}

export default async function ArtistCatalogPage() {
  const supabase = await createClient()
  const access = await getArtistAccess(supabase)
  if (!access) redirect('/dashboard')
  if (access.role === 'agent') redirect('/artist/pipeline')

  const { data: tracks } = await supabase
    .from('catalog')
    .select('*')
    .eq('artist_id', access.artistId)
    .order('streams', { ascending: false, nullsFirst: false })

  const allTracks = tracks ?? []
  const totalStreams = allTracks.reduce((s, t) => s + (t.streams ?? 0), 0)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Catalog</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {allTracks.length} tracks
          {totalStreams > 0 && ` · ${(totalStreams / 1_000_000).toFixed(1)}M total streams`}
        </p>
      </div>

      <div className="space-y-6">
        {BUCKETS.map(bucket => {
          const Icon = bucket.icon
          const bucketTracks = allTracks.filter(t => t.bucket === bucket.id)
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
              <CardContent className="pt-0">
                {bucketTracks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                    {bucketTracks.map(track => (
                      <TrackCard key={track.id} track={track} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">No tracks in this bucket.</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {allTracks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Music2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Your catalog will appear here once tracks are added by your team.</p>
        </div>
      )}
    </div>
  )
}
