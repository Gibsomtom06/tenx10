import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Plus, Music2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import InviteButton from './InviteButton'

export default async function ArtistsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get manager's name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id ?? '')
    .single()

  const managerName = (profile as any)?.full_name ?? 'Your Manager'

  // Only show artists this user manages
  const { data: memberships } = await (supabase as any)
    .from('artist_members')
    .select('artist_id, role, artists(*)')
    .or(`user_id.eq.${user?.id ?? ''},email.eq.${user?.email ?? ''}`)

  const seen = new Set<string>()
  const artists = ((memberships ?? []) as any[])
    .filter((m: any) => m.artists && m.artists.is_managed !== false && !seen.has(m.artist_id) && seen.add(m.artist_id))
    .map((m: any) => ({ ...m.artists, _role: m.role }))
    .sort((a: any, b: any) => (a.stage_name ?? a.name).localeCompare(b.stage_name ?? b.name))

  // Also get direct artists (manager_id based, managed only)
  const { data: directArtists } = await supabase
    .from('artists')
    .select('*')
    .eq('manager_id', user?.id ?? '')
    .eq('is_managed', true)

  // Merge and deduplicate
  const allArtistIds = new Set(artists.map((a: any) => a.id))
  const allArtists = [
    ...artists,
    ...((directArtists ?? []) as any[]).filter((a: any) => !allArtistIds.has(a.id)),
  ].sort((a: any, b: any) => (a.stage_name ?? a.name).localeCompare(b.stage_name ?? b.name))

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Artists</h1>
          <p className="text-sm text-muted-foreground">{allArtists.length} artist{allArtists.length !== 1 ? 's' : ''} on your roster</p>
        </div>
        <Link href="/dashboard/artists/new" className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4 mr-1" />Add Artist
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Artist</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Spotify</TableHead>
            <TableHead>Portal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allArtists?.map((artist: any) => (
            <TableRow key={artist.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={artist.avatar_url ?? undefined} />
                    <AvatarFallback>{(artist.stage_name ?? artist.name ?? '?')[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{artist.stage_name ?? artist.name}</div>
                    {artist.email && <div className="text-xs text-muted-foreground">{artist.email}</div>}
                  </div>
                </div>
              </TableCell>
              <TableCell>{artist.genre ?? '—'}</TableCell>
              <TableCell>
                {artist.spotify_artist_id ? (
                  <Music2 className="h-4 w-4 text-green-500" />
                ) : '—'}
              </TableCell>
              <TableCell>
                <InviteButton
                  artistId={artist.id}
                  artistName={artist.stage_name ?? artist.name}
                  managerName={managerName}
                  existingEmail={artist.email ?? undefined}
                  alreadyLinked={!!artist.user_id}
                />
              </TableCell>
              <TableCell>
                <Badge variant={artist.status === 'active' ? 'default' : 'secondary'}>
                  {artist.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Link href={`/dashboard/artists/${artist.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {!allArtists?.length && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No artists yet — <Link href="/dashboard/artists/new" className="underline text-primary">add your first</Link>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {allArtists.length > 0 && allArtists.some((a: any) => !a.user_id) && (
        <p className="text-xs text-muted-foreground">
          Artists without a portal account can be invited by clicking "Invite" and entering their email.
          They&apos;ll receive a link to set up their artist dashboard.
        </p>
      )}
    </div>
  )
}
