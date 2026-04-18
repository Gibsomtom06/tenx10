import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Settings — TENx10' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: gmail } = await supabase.from('gmail_connections').select('email, updated_at').eq('user_id', user.id).single()
  const { data: artists } = await supabase.from('artists').select('id, stage_name, spotify_artist_id, spotify_token_expires_at').order('name')

  const anthropicSet = !!process.env.ANTHROPIC_API_KEY
  const geminiSet = !!process.env.GEMINI_API_KEY || !!process.env.GEMINI_CLOUD_RUN_URL

  function Status({ ok, label }: { ok: boolean; label: string }) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {ok
          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
          : <XCircle className="h-4 w-4 text-muted-foreground" />
        }
        <span className={ok ? '' : 'text-muted-foreground'}>{label}</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Account, integrations, and platform config</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Account</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="outline">{profile?.role ?? 'manager'}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs text-muted-foreground">{user.id}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Integrations</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Gmail</p>
              {gmail
                ? <p className="text-xs text-muted-foreground">{gmail.email}</p>
                : <p className="text-xs text-muted-foreground">Not connected</p>
              }
            </div>
            {gmail
              ? <Badge variant="default" className="bg-green-600">Connected</Badge>
              : <Link href="/api/gmail/connect" className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}>Connect</Link>
            }
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Spotify for Artists — Roster</p>
            {(artists ?? []).map(artist => (
              <div key={artist.id} className="flex items-center justify-between ml-2">
                <div>
                  <p className="text-sm">{artist.stage_name}</p>
                  {artist.spotify_artist_id && (
                    <p className="text-xs text-muted-foreground font-mono">{artist.spotify_artist_id}</p>
                  )}
                </div>
                {artist.spotify_artist_id
                  ? <Badge variant="outline" className="text-green-600 border-green-600/30">Connected</Badge>
                  : <Link
                      href={`/api/spotify/connect?artistId=${artist.id}`}
                      className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                    >
                      Connect
                    </Link>
                }
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">AI Services</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Status ok={true} label="Anthropic Claude — offer parsing, pitch generation, decision engine" />
          <Status ok={geminiSet} label="Gemini — X agent, web search" />
          <Status ok={true} label="Supabase — database, auth, storage" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">DSR Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            ['Floor Guarantee', '$1,500'],
            ['CPT Target', '< $5'],
            ['CPT Kill', '$8+'],
            ['Agent Commission', '10% (AB Touring — Andrew)'],
            ['Manager Commission', '10% (Thomas Nalian)'],
            ['Artist Split', '80% (Lee Bray)'],
            ['Booking Agent Email', 'andrew@abtouring.com'],
            ['Manager Phone', '248-765-1997'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
