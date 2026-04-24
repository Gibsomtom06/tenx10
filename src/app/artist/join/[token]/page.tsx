import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ArtistJoinClient from './ArtistJoinClient'

export default async function ArtistJoinPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createServiceClient()

  // Look up the invite
  const { data: invite } = await supabase
    .from('artist_invites')
    .select('id, artist_id, email, expires_at, accepted_at, artists(id, stage_name, name, genre, email)')
    .eq('token', token)
    .single()

  if (!invite) return notFound()

  // Check expiry
  const expired = new Date(invite.expires_at) < new Date()
  const accepted = !!invite.accepted_at

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artist = (invite as any).artists as { id: string; stage_name: string | null; name: string; genre: string | null; email: string | null } | null

  return (
    <ArtistJoinClient
      token={token}
      inviteId={invite.id}
      artistId={invite.artist_id}
      artistName={artist?.stage_name ?? artist?.name ?? 'Unknown'}
      genre={artist?.genre ?? ''}
      email={invite.email}
      expired={expired}
      alreadyAccepted={accepted}
    />
  )
}
