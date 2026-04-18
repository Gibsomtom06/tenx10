import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OutreachClient from './OutreachClient'

export const metadata = { title: 'Outreach — TENx10' }

export default async function OutreachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .order('region', { ascending: true })
    .order('name', { ascending: true })

  // Auto-seed if table empty
  let initialContacts = contacts ?? []
  if (!initialContacts.length) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/contacts`, {
      cache: 'no-store',
    })
    if (res.ok) {
      const json = await res.json()
      initialContacts = json.contacts ?? []
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Outreach</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate AI-powered booking pitches and track your promoter outreach.
        </p>
      </div>
      <OutreachClient initialContacts={initialContacts} />
    </div>
  )
}
