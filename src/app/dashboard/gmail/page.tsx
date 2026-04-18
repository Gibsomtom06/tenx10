import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, CheckCircle2 } from 'lucide-react'
import InboxClient from './InboxClient'

export default async function GmailPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
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
        <p className="text-muted-foreground text-sm">Inbound booking offer → 6-step evaluation → counter draft → Gmail</p>
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
          <CardDescription>
            Required for the offer-to-draft pipeline
          </CardDescription>
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

      {connection && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Inbox</h2>
          <InboxClient />
        </div>
      )}
    </div>
  )
}
