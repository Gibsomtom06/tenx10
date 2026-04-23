import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardNav } from './DashboardNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get all artists this user manages
  const sb = supabase as any
  const { data: memberships } = await sb
    .from('artist_members')
    .select('artist_id, role, artists(id, name, stage_name)')
    .or(`user_id.eq.${user.id},email.eq.${user.email ?? ''}`)

  const artists = ((memberships ?? []) as any[])
    .filter((m: any) => m.artists)
    .map((m: any) => ({
      id: m.artist_id as string,
      name: (m.artists.stage_name || m.artists.name || 'Artist') as string,
      role: m.role as string,
    }))
    .filter((a, i, arr) => arr.findIndex((x: any) => x.id === a.id) === i)

  return (
    <div className="flex h-screen bg-background">
      <DashboardNav artists={artists} userEmail={user.email ?? ''} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
