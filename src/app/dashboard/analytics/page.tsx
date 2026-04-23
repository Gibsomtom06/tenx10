import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, Music2, MapPin, Share2, Radio, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import DspToolbox from './DspToolbox'

export const metadata = { title: 'Analytics — TENx10' }

// Per-artist hardcoded baseline — swap with live API data when connected
const ARTIST_METRICS: Record<string, {
  monthlyListeners: number
  spotifyFollowers: number
  popularityScore: number
  saveToStreamRatio: number
  programmedAudience: number
  instagram: number
  tiktok: number
  soundcloud: number
  youtube: number
  topTracks: { name: string; streams: number }[]
  topCities: { city: string; listeners: number; country: string }[]
  ageBreakdown: { range: string; pct: number }[]
  genderBreakdown: { label: string; pct: number }[]
  igAgeBreakdown: { range: string; pct: number }[]
  igTopCities: { city: string; pct: number }[]
  tiktokAgeBreakdown: { range: string; pct: number }[]
}> = {
  // DirtySnatcha — artist_id 3816c060
  'DirtySnatcha': {
    monthlyListeners: 8500,
    spotifyFollowers: 4500,
    popularityScore: 28,
    saveToStreamRatio: 0.12,
    programmedAudience: 0.52,
    instagram: 11000,
    tiktok: 3200,
    soundcloud: 9000,
    youtube: 1800,
    topTracks: [
      { name: 'I Need Your High', streams: 3890000 },
      { name: 'Something Wicked', streams: 1200000 },
      { name: 'Warpath', streams: 890000 },
      { name: 'Berserk', streams: 650000 },
      { name: 'Alien Nation', streams: 420000 },
    ],
    topCities: [
      { city: 'Detroit', listeners: 1240, country: 'US' },
      { city: 'Chicago', listeners: 980, country: 'US' },
      { city: 'Atlanta', listeners: 870, country: 'US' },
      { city: 'Seattle', listeners: 650, country: 'US' },
      { city: 'Denver', listeners: 590, country: 'US' },
      { city: 'Los Angeles', listeners: 520, country: 'US' },
      { city: 'London', listeners: 410, country: 'GB' },
      { city: 'Toronto', listeners: 380, country: 'CA' },
    ],
    ageBreakdown: [
      { range: '18–24', pct: 34 },
      { range: '25–34', pct: 41 },
      { range: '35–44', pct: 16 },
      { range: '45+', pct: 6 },
      { range: '13–17', pct: 3 },
    ],
    genderBreakdown: [
      { label: 'Male', pct: 68 },
      { label: 'Female', pct: 29 },
      { label: 'Other', pct: 3 },
    ],
    igAgeBreakdown: [
      { range: '18–24', pct: 38 },
      { range: '25–34', pct: 39 },
      { range: '35–44', pct: 14 },
      { range: '45+', pct: 5 },
      { range: '13–17', pct: 4 },
    ],
    igTopCities: [
      { city: 'Detroit', pct: 14 },
      { city: 'Chicago', pct: 11 },
      { city: 'Atlanta', pct: 9 },
      { city: 'Los Angeles', pct: 7 },
      { city: 'New York', pct: 6 },
    ],
    tiktokAgeBreakdown: [
      { range: '18–24', pct: 44 },
      { range: '25–34', pct: 32 },
      { range: '35–44', pct: 14 },
      { range: '45+', pct: 4 },
      { range: '13–17', pct: 6 },
    ],
  },
}

function getMetrics(artistName: string) {
  return ARTIST_METRICS[artistName] ?? ARTIST_METRICS['DirtySnatcha']
}

function fmtNum(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K`
    : String(n)
}

function BarRow({ label, pct, color = 'bg-primary' }: { label: string; pct: number; color?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-16 text-xs text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-xs text-right font-medium">{pct}%</span>
    </div>
  )
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string }>
}) {
  const { artist: artistId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const access = await getArtistAccess(supabase, artistId)
  const artistName = access?.artistName ?? 'DirtySnatcha'
  const m = getMetrics(artistName)

  const { data: confirmedDeals } = await supabase
    .from('deals')
    .select('offer_amount, show_date')
    .eq('artist_id', access?.artistId ?? '')
    .in('status', ['confirmed', 'completed'])

  const confirmedShows = (confirmedDeals ?? []).length
  const totalRevenue = (confirmedDeals ?? []).reduce((s, d) => s + (Number(d.offer_amount) || 0), 0)

  const saveRatePct = Math.round(m.saveToStreamRatio * 100)
  const progPct = Math.round(m.programmedAudience * 100)
  const saveColor = saveRatePct >= 15 ? 'text-green-600' : saveRatePct >= 10 ? 'text-yellow-600' : 'text-red-500'
  const progColor = progPct < 40 ? 'text-green-600' : 'text-red-500'

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics — {artistName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Streaming, social, and demographic data
          </p>
        </div>
        <Link href="/dashboard/spotify" className="text-xs text-primary underline">
          Connect Spotify for live data →
        </Link>
      </div>

      {/* === STREAMING METRICS === */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Spotify / DSP</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Monthly Listeners', value: fmtNum(m.monthlyListeners), sub: 'Spotify', icon: Music2 },
            { label: 'Followers', value: fmtNum(m.spotifyFollowers), sub: 'Spotify', icon: Users },
            { label: 'Popularity Score', value: String(m.popularityScore), sub: 'target: 30+ for Discover Weekly', icon: TrendingUp },
            { label: 'Confirmed Shows', value: String(confirmedShows), sub: `$${(totalRevenue / 1000).toFixed(0)}K guaranteed`, icon: MapPin },
          ].map(({ label, value, sub, icon: Icon }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                  <Icon className="h-3 w-3" />{label.toUpperCase()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Algorithm Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className={saveRatePct >= 15 ? 'border-green-500/30' : 'border-yellow-500/30'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">SAVE-TO-STREAM RATIO</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-black ${saveColor}`}>{saveRatePct}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {saveRatePct >= 15 ? '✓ Release Radar eligible' : `Need ${15 - saveRatePct}% more — enable Discovery Mode`}
              </p>
            </CardContent>
          </Card>
          <Card className={progPct < 40 ? 'border-green-500/30' : 'border-red-500/30'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">PROGRAMMED AUDIENCE</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-black ${progColor}`}>{progPct}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {progPct >= 40 ? '⚠ Structural risk — reduce playlist dependency' : '✓ Organic growth healthy'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Tracks + Top Cities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Top Tracks</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {m.topTracks.map((track, i) => (
                <div key={track.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-4 text-xs">{i + 1}</span>
                    <span className="font-medium">{track.name}</span>
                  </div>
                  <span className="text-muted-foreground text-xs font-mono">{fmtNum(track.streams)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" />Top Listener Cities</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {m.topCities.slice(0, 6).map((city, i) => (
                <div key={city.city} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs w-4">{i + 1}</span>
                    <span className="font-medium">{city.city}</span>
                    <span className="text-[10px] text-muted-foreground">{city.country}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{city.listeners.toLocaleString()} listeners</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* === SPOTIFY DEMOGRAPHICS === */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Spotify Audience Demographics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Age Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {m.ageBreakdown.map(row => (
                <BarRow key={row.range} label={row.range} pct={row.pct} color="bg-primary" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Gender Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-3 pt-2">
              {m.genderBreakdown.map((row, i) => (
                <BarRow
                  key={row.label}
                  label={row.label}
                  pct={row.pct}
                  color={i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-pink-500' : 'bg-muted-foreground'}
                />
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                Heavy male skew (68%) — typical for bass/electronic. Male-targeted venues (club nights, rave circuits) convert better.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* === SOCIAL MEDIA === */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Social Media</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Instagram', value: fmtNum(m.instagram), sub: 'followers', color: 'text-pink-500' },
            { label: 'TikTok', value: fmtNum(m.tiktok), sub: 'followers', color: 'text-white' },
            { label: 'SoundCloud', value: fmtNum(m.soundcloud), sub: 'followers', color: 'text-orange-500' },
            { label: 'YouTube', value: fmtNum(m.youtube), sub: 'subscribers', color: 'text-red-500' },
          ].map(({ label, value, sub, color }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-bold ${color}`}>{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instagram Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="text-pink-500">Instagram</span> — Age Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {m.igAgeBreakdown.map(row => (
                <BarRow key={row.range} label={row.range} pct={row.pct} color="bg-pink-500" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="text-pink-500">Instagram</span> — Top Cities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {m.igTopCities.map(row => (
                <BarRow key={row.city} label={row.city} pct={row.pct} color="bg-pink-500" />
              ))}
              <p className="text-xs text-muted-foreground pt-1">% of total Instagram audience</p>
            </CardContent>
          </Card>
        </div>

        {/* TikTok Demographics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">TikTok — Age Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              {m.tiktokAgeBreakdown.map(row => (
                <BarRow key={row.range} label={row.range} pct={row.pct} color="bg-white" />
              ))}
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">What this means for booking:</p>
              <p>18–24 core on TikTok (44%) = club promoters who target 21+ rooms need social proof for a younger demo. Lead with Instagram for 25–34 pitch.</p>
              <p>Spotify 25–34 (41%) is your strongest converting age group — these are the ticket buyers with disposable income.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* === DSP PLATFORM PRESENCE === */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">DSP Platform Health</h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2 text-left">Platform</th>
                <th className="px-4 py-2 text-right">Followers</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { platform: 'Spotify', value: fmtNum(m.spotifyFollowers), live: true, action: 'Enable Discovery Mode on top tracks' },
                { platform: 'Apple Music', value: '—', live: false, action: 'Confirm live with VMG/Shannon' },
                { platform: 'Amazon Music', value: '—', live: false, action: 'Confirm live with VMG/Shannon' },
                { platform: 'Tidal', value: '—', live: false, action: 'Confirm live with VMG/Shannon' },
                { platform: 'Deezer', value: '—', live: false, action: 'Confirm live with VMG/Shannon' },
                { platform: 'SoundCloud', value: fmtNum(m.soundcloud), live: true, action: 'Enable monetization' },
              ].map(row => (
                <tr key={row.platform} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{row.platform}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground font-mono text-xs">{row.value}</td>
                  <td className="px-4 py-3 text-center">
                    {row.live
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                      : <AlertCircle className="h-4 w-4 text-yellow-500 mx-auto" />
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* === ALGO HACK CHECKLIST === */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Algorithm Playbook</h2>
        <div className="space-y-2">
          {[
            {
              label: 'Release Radar eligibility',
              done: m.popularityScore >= 20 && saveRatePct >= 10,
              target: 'Popularity 20+ AND save rate 10%+',
              now: `Score: ${m.popularityScore} | Save rate: ${saveRatePct}%`,
              action: 'Enable Discovery Mode per track in Spotify for Artists → boosts save rate',
            },
            {
              label: 'Discover Weekly eligibility',
              done: m.popularityScore >= 30 && saveRatePct >= 15,
              target: 'Popularity 30+ AND save rate 15%+',
              now: `Score: ${m.popularityScore} | Save rate: ${saveRatePct}%`,
              action: 'Run 2-week save-rate campaign: ask fans to save the track, not just stream',
            },
            {
              label: 'Reduce programmed audience',
              done: progPct < 40,
              target: 'Programmed < 40%',
              now: `Currently ${progPct}% programmed`,
              action: 'Shift promo from playlist pitching to direct fan acquisition (ads, organic reels)',
            },
            {
              label: 'Reset decay clock',
              done: false,
              target: 'New ISRC every 6–8 weeks',
              now: 'Each track score decays without streams',
              action: 'Plan next release — bundle singles into EP under new UPC to inherit algo authority',
            },
            {
              label: 'VMG DSP coverage confirmed',
              done: false,
              target: 'Apple, Amazon, Tidal, Deezer live on every release',
              now: 'Shannon at VMG handles non-Spotify DSPs',
              action: 'Email Shannon before each release: "Confirm Apple, Amazon, Tidal, Deezer, Deezer MENA/Asia all live"',
            },
          ].map((step, i) => (
            <div key={i} className={`rounded-lg border p-4 ${step.done ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
              <div className="flex items-start gap-3">
                <div className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${step.done ? 'bg-green-500 text-white' : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/50'}`}>
                  {step.done ? '✓' : i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{step.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Target: {step.target}</p>
                  <p className="text-xs text-muted-foreground">Now: {step.now}</p>
                  <p className="text-xs mt-1.5 font-medium text-primary">→ {step.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DSP Toolbox */}
      <DspToolbox />
    </div>
  )
}
