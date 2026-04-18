import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { redirect } from 'next/navigation'
import BriefingClient from '@/app/dashboard/outreach/BriefingClient'
import MarketEstimator from '@/app/dashboard/outreach/MarketEstimator'
import BookingAgentClient from './BookingAgentClient'
import MarketMap from './MarketMap'

export const metadata = { title: 'Booking Tools — TENx10' }

export default async function ArtistBookingPage() {
  const supabase = await createClient()
  const access = await getArtistAccess(supabase)
  if (!access) redirect('/dashboard')

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Booking Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered booking for {access.artistName}.
          Check Pipeline first to avoid double-pitching markets already in play.
        </p>
      </div>

      {/* Market Intelligence Map */}
      <MarketMap />

      {/* Booking Agent */}
      <BookingAgentClient />

      {/* Manual tools below */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Manual Tools</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <MarketEstimator />
        <BriefingClient />
      </div>
    </div>
  )
}
