import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DealsView } from './DealsView'

export const metadata = { title: 'Deals — TENx10' }

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string; status?: string }>
}) {
  const { artist: artistId, status: filterStatus } = await searchParams
  const supabase = await createClient()
  const access = await getArtistAccess(supabase, artistId)

  let query = supabase
    .from('deals')
    .select('id, title, show_date, offer_amount, status, deal_points, artist_id, deposit_paid, artists(name, stage_name), venues(name, city)')
    .eq('artist_id', access?.artistId ?? '')
    .order('show_date', { ascending: true })

  if (filterStatus) query = query.eq('status', filterStatus as any)

  const { data: raw } = await query
  const deals = (raw ?? []) as any[]

  const total = deals.filter(d => d.status !== 'cancelled').length
  const upcoming = deals.filter(d => d.status !== 'cancelled' && d.show_date && d.show_date >= new Date().toISOString().split('T')[0]).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {upcoming} upcoming · {total} total
          </p>
        </div>
        <Link href="/dashboard/deals/new" className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4 mr-1" />New Deal
        </Link>
      </div>

      <DealsView deals={deals} artistParam={artistId} />
    </div>
  )
}
