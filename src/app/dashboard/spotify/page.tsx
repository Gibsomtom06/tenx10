import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Music2 } from 'lucide-react'

export default async function SpotifyPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: artists } = await supabase
    .from('artists')
    .select('id, name, spotify_artist_id, spotify_access_token')
    .order('name')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Spotify for Artists</h1>
        <p className="text-muted-foreground text-sm">Connect artist Spotify accounts for data insights</p>
      </div>

      {params.error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-md">
          Connection failed. Please try again.
        </div>
      )}

      <div className="grid gap-4 max-w-2xl">
        {artists?.map(artist => (
          <Card key={artist.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                {artist.name}
                {artist.spotify_access_token ? (
                  <Badge className="bg-green-500">Connected</Badge>
                ) : (
                  <Badge variant="outline">Not connected</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {artist.spotify_artist_id ?? 'No Spotify ID linked'}
              </CardDescription>
            </CardHeader>
            {!artist.spotify_access_token && (
              <CardContent>
                <Button size="sm" variant="outline" asChild>
                  <a href={`/api/spotify/connect?artistId=${artist.id}`}>
                    <Music2 className="h-4 w-4 mr-2" />
                    Connect Spotify
                  </a>
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
        {!artists?.length && (
          <p className="text-muted-foreground text-sm">Add artists first to connect their Spotify accounts.</p>
        )}
      </div>
    </div>
  )
}
