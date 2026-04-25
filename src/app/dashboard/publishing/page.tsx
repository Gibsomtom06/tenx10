import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PublishingClient from './PublishingClient'

export const dynamic = 'force-dynamic'

export default async function PublishingPage({
  searchParams,
}: {
  searchParams: { artist?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Resolve artist
  const { data: artists } = await supabase
    .from('artists')
    .select('id, name')
    .eq('manager_id', user.id)
    .order('name')

  const artistId = searchParams.artist ?? artists?.[0]?.id
  const artist = artists?.find(a => a.id === artistId) ?? artists?.[0]

  if (!artist) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        no artists found. add an artist to use publishing tracker.
      </div>
    )
  }

  const { data: tracks } = await supabase
    .from('publishing_registrations')
    .select('*')
    .eq('artist_id', artist.id)
    .order('title')

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">publishing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          PRO registrations, royalty status, and gaps for {artist.name}
        </p>
      </div>
      <PublishingClient
        tracks={tracks ?? []}
        artistName={artist.name}
      />
    </div>
  )
}
