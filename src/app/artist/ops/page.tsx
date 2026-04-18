import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { redirect } from 'next/navigation'
import { OpsCards } from './OpsCards'

export const metadata = { title: 'Show Ops — TENx10' }

export default async function ShowOpsPage() {
  const supabase = await createClient()
  const access = await getArtistAccess(supabase)
  if (!access) redirect('/dashboard')

  const { data: deals } = await supabase
    .from('deals')
    .select('id, title, show_date, offer_amount, status, deal_points, venues(name, capacity)')
    .eq('artist_id', access.artistId)
    .in('status', ['confirmed', 'negotiating', 'offer'])
    .order('show_date', { ascending: true })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Show Ops</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sellout tracker — contract, deposit, marketing, and ticket status per show.
        </p>
      </div>
      <OpsCards deals={deals ?? []} />
    </div>
  )
}
