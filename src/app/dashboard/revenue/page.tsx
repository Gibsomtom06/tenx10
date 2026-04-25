import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { redirect } from 'next/navigation'
import RevenueEngine from './RevenueEngine'

export const metadata = { title: 'Revenue Engine — TENx10' }

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string }>
}) {
  const { artist: artistId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const access = await getArtistAccess(supabase, artistId)

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: artistData },
    { data: confirmedShows },
    { data: upcomingShows },
  ] = await Promise.all([
    supabase
      .from('artists')
      .select('stage_name, name, minimum_guarantee, spotify_artist_id, social_stats')
      .eq('id', access?.artistId ?? '')
      .single(),
    supabase
      .from('deals')
      .select('offer_amount, show_date, status')
      .eq('artist_id', access?.artistId ?? '')
      .in('status', ['confirmed', 'completed'])
      .gte('show_date', thirtyDaysAgo)
      .lte('show_date', today),
    supabase
      .from('deals')
      .select('offer_amount, show_date, status')
      .eq('artist_id', access?.artistId ?? '')
      .in('status', ['confirmed'])
      .gt('show_date', today)
      .order('show_date', { ascending: true })
      .limit(20),
  ])

  const artist = artistData as any
  const shows30d = (confirmedShows ?? []) as any[]
  const nextShows = (upcomingShows ?? []) as any[]

  // Calculate live performance metrics
  const showsPerMonth = shows30d.length
  const avgGuarantee = shows30d.length > 0
    ? shows30d.reduce((s: number, d: any) => s + (Number(d.offer_amount) || 0), 0) / shows30d.length
    : (artist?.minimum_guarantee ?? 1500)
  const liveIncome = showsPerMonth * avgGuarantee * 0.8 // 80% to artist after 10/10 split

  // Streaming estimate — use 0 until Spotify is connected
  const hasSpotify = !!artist?.spotify_artist_id
  const streamingIncome = hasSpotify ? 0 : 0 // will be populated when Spotify API connected

  // Social stats for audience size
  const socialStats = (artist?.social_stats ?? {}) as Record<string, any>
  const igFollowers = Number(socialStats.instagram_followers ?? socialStats.instagram ?? 0)

  // Upcoming revenue (next 60 days)
  const upcomingRevenue = nextShows.reduce((s: number, d: any) => s + (Number(d.offer_amount) || 0) * 0.8, 0)

  return (
    <RevenueEngine
      artistName={artist?.stage_name ?? artist?.name ?? 'Artist'}
      showsPerMonth={showsPerMonth}
      avgGuarantee={avgGuarantee}
      liveIncome={Math.round(liveIncome)}
      streamingIncome={Math.round(streamingIncome)}
      hasSpotify={hasSpotify}
      igFollowers={igFollowers}
      upcomingRevenue={Math.round(upcomingRevenue)}
      nextShowsCount={nextShows.length}
      minimumGuarantee={artist?.minimum_guarantee ?? 1500}
    />
  )
}
