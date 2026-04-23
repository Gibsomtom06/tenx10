import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Plus, Music2, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function ArtistsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Only show artists this user manages
  const { data: memberships } = await (supabase as any)
    .from('artist_members')
    .select('artist_id, role, artists(*)')
    .or(`user_id.eq.${user?.id ?? ''},email.eq.${user?.email ?? ''}`)

  const seen = new Set<string>()
  const artists = ((memberships ?? []) as any[])
    .filter((m: any) => m.artists && !seen.has(m.artist_id) && seen.add(m.artist_id))
    .map((m: any) => ({ ...m.artists, _role: m.role }))
    .sort((a: any, b: any) => (a.stage_name ?? a.name).localeCompare(b.stage_name ?? b.name))

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Artists</h1>
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
          {artists?.map(artist => (
            <TableRow key={artist.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={artist.avatar_url ?? undefined} />
                    <AvatarFallback>{artist.name[0]}</AvatarFallback>
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
                {(artist as any).user_id ? (
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <UserCheck className="h-3.5 w-3.5" />
                    Linked
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">No portal</span>
                )}
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
          {!artists?.length && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No artists yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
