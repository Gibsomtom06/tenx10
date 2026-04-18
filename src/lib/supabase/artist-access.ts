import type { SupabaseClient } from '@supabase/supabase-js'

export type MemberRole = 'admin' | 'artist' | 'agent'

export interface ArtistAccess {
  role: MemberRole
  artistId: string
  artistName: string
  memberName: string
  memberId: string
}

export async function getArtistAccess(supabase: SupabaseClient): Promise<ArtistAccess | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('artist_members')
    .select('id, role, name, artist_id, artists(id, name, stage_name)')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .limit(1)
    .single()

  if (!membership) return null

  const artist = (membership as any).artists as { id: string; name: string; stage_name: string | null } | null

  return {
    role: membership.role as MemberRole,
    artistId: membership.artist_id,
    artistName: artist?.stage_name ?? artist?.name ?? 'Artist',
    memberName: membership.name,
    memberId: membership.id,
  }
}
