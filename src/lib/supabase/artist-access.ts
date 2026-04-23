import type { SupabaseClient } from '@supabase/supabase-js'

export type MemberRole = 'admin' | 'artist' | 'agent'

export interface ArtistAccess {
  role: MemberRole
  artistId: string
  artistName: string
  memberName: string
  memberId: string
  allArtists: { artistId: string; artistName: string; role: MemberRole }[]
}

/**
 * Returns artist access for the current user.
 * When a user manages multiple artists, pass `preferArtistId` to select one.
 * `allArtists` always contains the full list for building artist switchers in the nav.
 */
export async function getArtistAccess(
  supabase: SupabaseClient,
  preferArtistId?: string | null
): Promise<ArtistAccess | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: memberships } = await supabase
    .from('artist_members')
    .select('id, role, name, artist_id, artists(id, name, stage_name)')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)

  if (!memberships?.length) return null

  // Build the full list for the artist switcher
  const allArtists = memberships.map(m => {
    const a = (m as any).artists as { id: string; name: string; stage_name: string | null } | null
    return {
      artistId: m.artist_id,
      artistName: a?.stage_name ?? a?.name ?? 'Artist',
      role: m.role as MemberRole,
    }
  })

  // Prefer the explicitly requested artist, then fall back to first
  const chosen = (preferArtistId
    ? memberships.find(m => m.artist_id === preferArtistId)
    : null) ?? memberships[0]

  const chosenArtist = (chosen as any).artists as { id: string; name: string; stage_name: string | null } | null

  return {
    role: chosen.role as MemberRole,
    artistId: chosen.artist_id,
    artistName: chosenArtist?.stage_name ?? chosenArtist?.name ?? 'Artist',
    memberName: chosen.name,
    memberId: chosen.id,
    allArtists,
  }
}
