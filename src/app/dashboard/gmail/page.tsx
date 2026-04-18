import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, CheckCircle2, FileText } from 'lucide-react'
import InboxClient from './InboxClient'
import OfferAnalyzerClient from './OfferAnalyzerClient'

export const metadata = { title: 'Gmail — TENx10' }

export default async function GmailPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string; tab?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: connection } = await supabase
    .from('gmail_connections')
    .select('*')
    .eq('user_id', user?.id ?? '')
    .single()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gmail</h1>
        <p className="text-muted-foreground text-sm">Inbound offer pipeline + paste-offer analyzer</p>
      </div>

      {params.error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-md">
          Connection failed. Please try again.
        </div>
      )}
      {params.connected && (
        <div className="bg-green-500/10 text-green-700 dark:text-green-400 text-sm px-4 py-2 rounded-md">
          Gmail connected successfully.
        </div>
      )}

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail Account
          </CardTitle>
          <CardDescription>Required for the offer-to-draft pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          {connection ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Connected</span>
              <Badge variant="secondary">{connection.email || 'Gmail'}</Badge>
            </div>
          ) : (
            <a href="/api/gmail/connect" className={buttonVariants()}>Connect Gmail</a>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue={params.tab === 'analyze' ? 'analyze' : 'inbox'}>
        <TabsList>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Inbox
          </TabsTrigger>
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Paste Offer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-4">
          {connection ? (
            <InboxClient />
          ) : (
            <p className="text-sm text-muted-foreground py-4">Connect Gmail above to view your inbox.</p>
          )}
        </TabsContent>

        <TabsContent value="analyze" className="mt-4">
          <OfferAnalyzerClient />
        </TabsContent>
      </Tabs>
    </div>
  )
}
