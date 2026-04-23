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
 * When a user manages multiple artists, pass preferArtistId to select one.
 * allArtists always contains the full list for building artist switchers in the nav.
 */
export async function getArtistAccess(
  supabase: SupabaseClient,
  preferArtistId?: string | null
): Promise<ArtistAccess | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const userEmail = user.email || ''
  const orFilter = 'user_id.eq.' + user.id + ',email.eq.' + userEmail
  // Cast to any to bypass Supabase generated-type inference on .or() chains
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data: membershipsRaw } = await sb
    .from('artist_members')
    .select('id, role, name, artist_id, artists(id, name, stage_name)')
    .or(orFilter)

  const rows: any[] = membershipsRaw ?? []
  if (!rows.length) return null

  // Build the full list for the artist switcher
  const allArtists = rows.map((m: any) => {
    const a = m.artists as { id: string; name: string; stage_name: string | null } | null
    return {
      artistId: m.artist_id as string,
      artistName: (a ? (a.stage_name || a.name || 'Artist') : 'Artist') as string,
      role: m.role as MemberRole,
    }
  })

  // Prefer the explicitly requested artist, then fall back to first
  const chosen: any = (preferArtistId
    ? rows.find((m: any) => m.artist_id === preferArtistId)
    : null) || rows[0]

  const chosenArtist = chosen.artists as { id: string; name: string; stage_name: string | null } | null

  return {
    role: chosen.role as MemberRole,
    artistId: chosen.artist_id as string,
    artistName: (chosenArtist ? (chosenArtist.stage_name || chosenArtist.name || 'Artist') : 'Artist') as string,
    memberName: chosen.name as string,
    memberId: chosen.id as string,
    allArtists,
  }
}
