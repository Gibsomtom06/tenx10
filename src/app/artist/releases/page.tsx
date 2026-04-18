import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Award, Music2, ExternalLink, Info } from 'lucide-react'
import type { CatalogTrack } from '@/types/database'

export const metadata = { title: 'Releases — TENx10' }

// RIAA thresholds at 150 streams per unit
const RIAA_TIERS = [
  { label: 'Gold', streams: 500_000, color: 'text-yellow-600 dark:text-yellow-400' },
  { label: 'Platinum', streams: 1_000_000, color: 'text-slate-400' },
  { label: '2x Platinum', streams: 2_000_000, color: 'text-slate-400' },
  { label: '3x Platinum', streams: 3_000_000, color: 'text-slate-400' },
  { label: 'Diamond', streams: 10_000_000, color: 'text-cyan-500' },
]

function getRiaaCert(streams: number) {
  const earned = RIAA_TIERS.filter(t => streams >= t.streams)
  return earned[earned.length - 1] ?? null
}

function getNextTier(streams: number) {
  return RIAA_TIERS.find(t => streams < t.streams) ?? null
}

function StreamBar({ streams, target }: { streams: number; target: number }) {
  const pct = Math.min(100, Math.round((streams / target) * 100))
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">{pct}%</span>
    </div>
  )
}

function ReleaseCard({ track, rank }: { track: CatalogTrack; rank: number }) {
  const cert = track.streams ? getRiaaCert(track.streams) : null
  const next = track.streams ? getNextTier(track.streams) : null

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl font-black text-muted-foreground/30 w-8 shrink-0 text-right">{rank}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{track.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge variant="outline" className="text-[10px] capitalize">{track.type}</Badge>
                  {track.collaborators && (
                    <span className="text-[10px] text-muted-foreground">w/ {track.collaborators}</span>
                  )}
                  {track.release_date && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(track.release_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {cert && (
                  <Badge className={`text-[10px] ${cert.color} bg-transparent border-current`} variant="outline">
                    <Award className="h-2.5 w-2.5 mr-0.5" />{cert.label}
                  </Badge>
                )}
                {track.streaming_url && (
                  <a href={track.streaming_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>

            {track.streams != null && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-bold">{(track.streams / 1_000_000).toFixed(2)}M</span>
                  <span className="text-xs text-muted-foreground">streams</span>
                </div>
                {next && (
                  <div className="space-y-0.5">
                    <StreamBar streams={track.streams} target={next.streams} />
                    <p className="text-[10px] text-muted-foreground">
                      {((next.streams - track.streams) / 1_000).toFixed(0)}K more to {next.label}
                    </p>
                  </div>
                )}
                {!next && (
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">Diamond certified</p>
                )}
              </div>
            )}

            {track.isrc && (
              <p className="text-[10px] text-muted-foreground font-mono mt-1.5">{track.isrc}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function ArtistReleasesPage() {
  const supabase = await createClient()
  const access = await getArtistAccess(supabase)
  if (!access) redirect('/dashboard')
  if (access.role === 'agent') redirect('/artist/pipeline')

  const { data: allTracks } = await supabase
    .from('catalog')
    .select('*')
    .eq('artist_id', access.artistId)
    .in('bucket', ['released_full', 'soundcloud_only'])
    .order('streams', { ascending: false, nullsFirst: false })

  const released = allTracks ?? []
  const totalStreams = released.reduce((s, t) => s + (t.streams ?? 0), 0)
  const goldCount = released.filter(t => t.streams && t.streams >= 500_000).length
  const platCount = released.filter(t => t.streams && t.streams >= 1_000_000).length

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Releases</h1>
        <p className="text-sm text-muted-foreground mt-1">Your released catalog and RIAA certification progress</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-black">{released.length}</p>
            <p className="text-xs text-muted-foreground">tracks released</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-black">{(totalStreams / 1_000_000).toFixed(1)}M</p>
            <p className="text-xs text-muted-foreground">total streams</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-black text-yellow-600">{goldCount}</p>
            <p className="text-xs text-muted-foreground">Gold+ tracks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-black text-slate-400">{platCount}</p>
            <p className="text-xs text-muted-foreground">Platinum+ tracks</p>
          </CardContent>
        </Card>
      </div>

      {/* RIAA legend */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">RIAA Certification Thresholds</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {RIAA_TIERS.map(tier => (
            <div key={tier.label} className="flex items-center gap-1.5">
              <Award className={`h-3 w-3 ${tier.color}`} />
              <span className="text-xs text-muted-foreground">{tier.label}:</span>
              <span className="text-xs font-medium">{(tier.streams / 1_000_000).toFixed(1)}M</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Based on 150 streams per unit. Certifications require RIAA submission through your distributor.</p>
      </div>

      {/* Tracks list */}
      {released.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Releases</h2>
          {released.map((track, i) => (
            <ReleaseCard key={track.id} track={track} rank={i + 1} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Music2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No released tracks in your catalog yet.</p>
        </div>
      )}
    </div>
  )
}
