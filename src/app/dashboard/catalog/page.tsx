import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CatalogClient from './CatalogClient'
import type { CatalogTrack } from '@/types/database'

export const metadata = { title: 'Catalog — TENx10' }

// Pre-seed DirtySnatcha known catalog from knowledge base
const DS_SEED_TRACKS: Omit<CatalogTrack, 'id' | 'created_at' | 'updated_at' | 'upc' | 'distributor' | 'spotify_track_id' | 'artwork_url' | 'release_date'>[] = [
  { artist_id: '', title: 'I Need Your High', type: 'single', bucket: 'released_full', streams: 3890000, isrc: null, collaborators: null, streaming_url: null, notes: 'Biggest track — 3.89M streams' },
  { artist_id: '', title: 'Crashing', type: 'single', bucket: 'released_full', streams: 1310000, isrc: null, collaborators: null, streaming_url: null, notes: null },
  { artist_id: '', title: 'Get Fucked', type: 'single', bucket: 'released_full', streams: 1130000, isrc: null, collaborators: null, streaming_url: null, notes: null },
  { artist_id: '', title: 'Supersonic', type: 'single', bucket: 'released_full', streams: 1020000, isrc: null, collaborators: null, streaming_url: null, notes: 'Performed at Lost Lands main stage' },
]

export default async function CatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get first artist (DSR)
  const { data: artist } = await supabase
    .from('artists')
    .select('id, name, stage_name')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  let tracks: CatalogTrack[] = []

  if (artist) {
    const { data: existingTracks } = await supabase
      .from('catalog')
      .select('*')
      .eq('artist_id', artist.id)
      .order('streams', { ascending: false })

    // Auto-seed if empty
    if (!existingTracks?.length) {
      const seedData = DS_SEED_TRACKS.map(t => ({ ...t, artist_id: artist.id }))
      const { data: seeded } = await supabase
        .from('catalog')
        .insert(seedData)
        .select()
      tracks = (seeded ?? []) as CatalogTrack[]
    } else {
      tracks = existingTracks as CatalogTrack[]
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catalog</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {artist?.stage_name ?? artist?.name ?? 'Artist'} — 5-bucket catalog management system
        </p>
      </div>

      {artist ? (
        <CatalogClient
          initialTracks={tracks}
          artistId={artist.id}
          artistName={artist.stage_name ?? artist.name}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Add an artist first to manage their catalog.</p>
      )}
    </div>
  )
}
