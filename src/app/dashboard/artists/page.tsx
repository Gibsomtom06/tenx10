import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Plus, Music2 } from 'lucide-react'

export default async function ArtistsPage() {
  const supabase = await createClient()
  const { data: artists } = await supabase
    .from('artists')
    .select('*')
    .order('name')

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Artists</h1>
        <Button size="sm" asChild>
          <Link href="/dashboard/artists/new"><Plus className="h-4 w-4 mr-1" />Add Artist</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Artist</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Spotify</TableHead>
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
                <Badge variant={artist.status === 'active' ? 'default' : 'secondary'}>
                  {artist.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/artists/${artist.id}`}>View</Link>
                </Button>
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
