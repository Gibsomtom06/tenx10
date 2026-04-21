import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SmartOutreachClient from './SmartOutreachClient'
import MarketEstimator from './MarketEstimator'

export const metadata = { title: 'Outreach — TENx10' }

export default async function OutreachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id,name,company,email,city,state,region,market_type,pitch_status,last_pitched_at,notes')
    .order('pitch_status', { ascending: true })
    .order('name', { ascending: true })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Booking Outreach</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pitch the full DSR roster. Routing gaps, warm contacts, and AI-generated pitches — all in one place.
        </p>
      </div>
      <MarketEstimator />
      <SmartOutreachClient initialContacts={contacts ?? []} />
    </div>
  )
}
