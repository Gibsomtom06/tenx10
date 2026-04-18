import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, Music2, MapPin } from 'lucide-react'
import Link from 'next/link'
import DspToolbox from './DspToolbox'

export const metadata = { title: 'Analytics — TENx10' }

const DSR_METRICS = {
  monthlyListeners: 8500,
  spotifyFollowers: 4500,
  popularityScore: 28,
  instagram: 11000,
  soundcloud: 9000,
  saveToStreamRatio: 0.12,
  programmedAudience: 0.52,
  topTracks: [
    { name: 'I Need Your High', streams: 3890000 },
    { name: 'Something Wicked', streams: 1200000 },
    { name: 'Warpath', streams: 890000 },
    { name: 'Berserk', streams: 650000 },
    { name: 'Alien Nation', streams: 420000 },
  ],
  topMarkets: ['Detroit', 'Chicago', 'Atlanta', 'Seattle', 'Denver'],
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: artists },
    { data: deals },
    { data: catalogTracks },
  ] = await Promise.all([
    supabase.from('artists').select('id, name, stage_name, spotify_artist_id').order('name'),
    supabase.from('deals').select('status, show_date, offer_amount').neq('status', 'cancelled'),
    supabase.from('catalog').select('title, streams, bucket').eq('bucket', 'released_full').order('streams', { ascending: false }).limit(10),
  ])

  const confirmedShows = (deals ?? []).filter(d => ['confirmed', 'completed'].includes(d.status)).length
  const fmtNum = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n)

  // Use live catalog data if available, otherwise fall back to hardcoded DSR metrics
  const liveTracks = (catalogTracks ?? []).filter(t => t.streams && t.streams > 0)
  const topTracks = liveTracks.length > 0
    ? liveTracks.map(t => ({ name: t.title, streams: t.streams ?? 0 }))
    : DSR_METRICS.topTracks

  const saveRatePct = Math.round(DSR_METRICS.saveToStreamRatio * 100)
  const saveRateColor = saveRatePct >= 15 ? 'text-green-600' : saveRatePct >= 10 ? 'text-yellow-600' : 'text-red-500'
  const progColor = DSR_METRICS.programmedAudience > 0.4 ? 'text-red-500' : 'text-yellow-600'

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          DSR streaming metrics — connect Spotify for Artists to pull live data
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />MONTHLY LISTENERS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmtNum(DSR_METRICS.monthlyListeners)}</p>
            <p className="text-xs text-muted-foreground mt-1">Spotify</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Music2 className="h-3 w-3" />POPULARITY SCORE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{DSR_METRICS.popularityScore}</p>
            <p className="text-xs text-muted-foreground mt-1">target: 30+ for Discover Weekly</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">SAVE-TO-STREAM</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${saveRateColor}`}>{saveRatePct}%</p>
            <p className="text-xs text-muted-foreground mt-1">target: 15%+ for algo push</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">PROGRAMMED AUDIENCE</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${progColor}`}>
              {Math.round(DSR_METRICS.programmedAudience * 100)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">structural growth risk &gt;40%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Top Tracks</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topTracks.map((track, i) => (
              <div key={track.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-4">{i + 1}</span>
                  <span className="font-medium">{track.name}</span>
                </div>
                <span className="text-muted-foreground">{fmtNum(track.streams)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Platform Presence</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Spotify Followers', value: fmtNum(DSR_METRICS.spotifyFollowers) },
              { label: 'Instagram', value: fmtNum(DSR_METRICS.instagram) },
              { label: 'SoundCloud', value: fmtNum(DSR_METRICS.soundcloud) },
              { label: 'Confirmed Shows', value: String(confirmedShows) },
              { label: 'Roster Artists', value: String((artists ?? []).length) },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" />Top Markets</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DSR_METRICS.topMarkets.map(market => (
              <span key={market} className="text-sm bg-muted px-3 py-1 rounded-full">{market}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="py-4">
          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Algorithmic Health Flags</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc list-inside">
            <li>Save-to-stream at {saveRatePct}% — needs 15%+ for Release Radar eligibility</li>
            <li>Popularity score {DSR_METRICS.popularityScore} — needs 30 for Discover Weekly, 20 for Release Radar</li>
            <li>52% programmed audience — structural growth problem, reduce playlist dependency</li>
            <li>New ISRC every 6-8 weeks resets decay clock — plan releases accordingly</li>
          </ul>
          <p className="mt-3 text-xs">
            <Link href="/dashboard/spotify" className="underline text-primary">Connect Spotify for Artists</Link>
            {' '}to pull live metrics automatically.
          </p>
        </CardContent>
      </Card>

      {/* Algorithm Hack Guide */}
      <AlgoHackGuide saveRatePct={saveRatePct} popularityScore={DSR_METRICS.popularityScore} programmedPct={Math.round(DSR_METRICS.programmedAudience * 100)} />

      {/* RIAA Certification Tracker */}
      <RiaaCertTracker tracks={topTracks} />

      {/* DSP Toolboxes */}
      <DspToolbox />
    </div>
  )
}

function AlgoHackGuide({ saveRatePct, popularityScore, programmedPct }: { saveRatePct: number; popularityScore: number; programmedPct: number }) {
  const steps = [
    {
      label: 'Release Radar eligibility',
      target: 'Track popularity 20+ AND save-to-stream 10%+',
      current: `Track score: ${popularityScore} | Save rate: ${saveRatePct}%`,
      done: popularityScore >= 20 && saveRatePct >= 10,
      action: 'Enable Discovery Mode per track in Spotify for Artists → boosts save rate',
    },
    {
      label: 'Discover Weekly eligibility',
      target: 'Track popularity 30+ AND save-to-stream 15%+',
      current: `Track score: ${popularityScore} | Save rate: ${saveRatePct}%`,
      done: popularityScore >= 30 && saveRatePct >= 15,
      action: 'Run a 2-week save-rate campaign: DM fans to save the track, not just stream',
    },
    {
      label: 'Reduce programmed audience',
      target: 'Programmed < 40%',
      current: `Currently ${programmedPct}% programmed (playlist/radio)`,
      done: programmedPct < 40,
      action: 'Shift promo from playlist pitching to direct fan acquisition (ads, organic). Every new organic listener lowers ratio.',
    },
    {
      label: 'Reset decay clock',
      target: 'New ISRC every 6-8 weeks',
      current: 'Each track popularity score decays without streams',
      done: false,
      action: 'Plan next release — use waterfall ISRC strategy: bundle singles into EP under new UPC to inherit algo authority',
    },
    {
      label: 'VMG DSP submission coverage',
      target: 'Apple Music, Amazon, Tidal, Deezer confirmed on every release',
      current: 'Shannon at VMG handles non-Spotify DSPs — confirm per release',
      done: false,
      action: 'Email Shannon at VMG before each release: "Confirm Apple, Amazon, Tidal, Deezer, Deezer MENA/Asia are all live"',
    },
  ]

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Algorithm Hack Checklist</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Step-by-step actions to unlock each tier of algorithmic support</p>
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className={`rounded-lg border p-4 ${step.done ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
            <div className="flex items-start gap-3">
              <div className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${step.done ? 'bg-green-500 text-white' : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/50'}`}>
                {step.done ? '✓' : i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{step.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium">Target:</span> {step.target}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Now:</span> {step.current}
                </p>
                <p className="text-xs mt-1.5 font-medium text-primary">→ {step.action}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RiaaCertTracker({ tracks }: { tracks: { name: string; streams: number }[] }) {
  const THRESHOLDS = [
    { label: 'Gold', streams: 500000, color: 'text-yellow-600' },
    { label: 'Platinum', streams: 1000000, color: 'text-slate-400' },
    { label: '2x Platinum', streams: 2000000, color: 'text-slate-400' },
    { label: '3x Platinum', streams: 3000000, color: 'text-slate-400' },
    { label: 'Diamond', streams: 10000000, color: 'text-cyan-400' },
  ]

  function getCert(streams: number) {
    let cert = null
    for (const t of THRESHOLDS) {
      if (streams >= t.streams) cert = t
    }
    return cert
  }

  function nextCert(streams: number) {
    return THRESHOLDS.find(t => streams < t.streams)
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">RIAA Certification Tracker</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          RIAA counts audio streams at 150 streams = 1 unit. Certifications require a label or distributor to file.
          VMG can file on behalf of DSR.
        </p>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-xs uppercase font-semibold text-muted-foreground">
              <th className="px-4 py-2 text-left">Track</th>
              <th className="px-4 py-2 text-right">Streams</th>
              <th className="px-4 py-2 text-center">Current Cert</th>
              <th className="px-4 py-2 text-left">Next Target</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tracks.map(track => {
              const cert = getCert(track.streams)
              const next = nextCert(track.streams)
              const needed = next ? next.streams - track.streams : 0
              return (
                <tr key={track.name} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{track.name}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                    {(track.streams / 1000000).toFixed(2)}M
                  </td>
                  <td className="px-4 py-3 text-center">
                    {cert ? (
                      <span className={`text-xs font-bold ${cert.color}`}>{cert.label}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {next ? (
                      <div>
                        <span className={`text-xs font-medium ${next.color}`}>{next.label}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({(needed / 1000).toFixed(0)}K more streams needed)
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Diamond tracked</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        RIAA threshold: Gold = 500K units · Platinum = 1M · Diamond = 10M. Audio streams count at 150:1.
        File through VMG — contact Shannon to initiate certification.
      </p>
    </div>
  )
}
