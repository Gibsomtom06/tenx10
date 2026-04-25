import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { redirect } from 'next/navigation'
import ArtistProfileForm from './ArtistProfileForm'

export const metadata = { title: 'My Profile — TENx10' }

export default async function ArtistProfilePage() {
  const supabase = await createClient()
  const access = await getArtistAccess(supabase)
  if (!access) redirect('/auth/login')

  const { data: artist } = await supabase
    .from('artists')
    .select('id, name, stage_name, bio, email, phone, genre, spotify_artist_id, avatar_url, social_stats')
    .eq('id', access.artistId)
    .single()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update your bio, social handles, and contact info. Your management team sees this.
        </p>
      </div>
      <ArtistProfileForm artist={artist as any} artistId={access.artistId} />
    </div>
  )
}
