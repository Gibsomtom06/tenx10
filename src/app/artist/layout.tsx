import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { redirect } from 'next/navigation'
import { ArtistNav } from './ArtistNav'

export default async function ArtistLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const access = await getArtistAccess(supabase)

  if (!access) redirect('/dashboard')

  return (
    <div className="flex h-screen bg-background">
      <ArtistNav role={access.role} artistName={access.artistName} memberName={access.memberName} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
