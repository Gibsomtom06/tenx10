import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BriefingClient from './BriefingClient'
import MarketEstimator from './MarketEstimator'

export const metadata = { title: 'Outreach — TENx10' }

export default async function OutreachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Outreach</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Auto-briefing — routing windows, warm alerts, and new markets based on your current tour and relationships.
        </p>
      </div>
      <MarketEstimator />
      <BriefingClient />
    </div>
  )
}
