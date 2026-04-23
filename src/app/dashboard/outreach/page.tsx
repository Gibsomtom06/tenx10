import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SmartOutreachClient from './SmartOutreachClient'
import MarketEstimator from './MarketEstimator'
import BriefingClient from './BriefingClient'
import BookingAgentClient from '@/app/artist/booking/BookingAgentClient'
import MarketMap from '@/app/artist/booking/MarketMap'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Booking Outreach</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Daily briefing, routing gaps, warm contacts, AI booking agent with full scraping + decision trail, and market estimator for the full DSR roster.
        </p>
      </div>

      <Tabs defaultValue="briefing" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="briefing">Daily Briefing</TabsTrigger>
          <TabsTrigger value="agent">AI Booking Agent</TabsTrigger>
          <TabsTrigger value="map">Market Map</TabsTrigger>
          <TabsTrigger value="smart">Smart Outreach</TabsTrigger>
          <TabsTrigger value="market">Market Estimator</TabsTrigger>
        </TabsList>

        <TabsContent value="briefing" className="mt-6 space-y-6">
          <BriefingClient />
        </TabsContent>

        <TabsContent value="agent" className="mt-6 space-y-6">
          <div className="text-xs text-muted-foreground">
            AI agent pulls routing gaps, runs each candidate through the 6-step decision engine
            (guarantee floor, market tier, CPT projection, calendar, relationship, marketing commitment),
            and shows the reasoning trail per market. Approved candidates get a draft pitch written.
          </div>
          <BookingAgentClient />
        </TabsContent>

        <TabsContent value="map" className="mt-6 space-y-6">
          <div className="text-xs text-muted-foreground">
            Markets scored by search volume, CPT projection, tier, and relationship strength.
            Click a pin to see the scraping reasoning for that market.
          </div>
          <MarketMap />
        </TabsContent>

        <TabsContent value="smart" className="mt-6 space-y-6">
          <SmartOutreachClient initialContacts={contacts ?? []} />
        </TabsContent>

        <TabsContent value="market" className="mt-6 space-y-6">
          <MarketEstimator />
        </TabsContent>
      </Tabs>
    </div>
  )
}
