import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MapPin } from 'lucide-react'

export const metadata = { title: 'Venues — TENx10' }

export default async function VenuesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: rawVenues } = await supabase
    .from('venues')
    .select('*')
    .order('name')

  const all = (rawVenues ?? []) as any[]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Venues</h1>
        <p className="text-sm text-muted-foreground mt-1">Venues are created automatically when you add a deal</p>
      </div>

      {!all.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p>No venues yet. They appear here when deals are created.</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Venue</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="text-right">Capacity</TableHead>
              <TableHead>Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {all.map(venue => (
              <TableRow key={venue.id}>
                <TableCell className="font-medium">{venue.name}</TableCell>
                <TableCell>{venue.city ?? '—'}</TableCell>
                <TableCell>{venue.state ?? '—'}</TableCell>
                <TableCell className="text-right">
                  {venue.capacity ? venue.capacity.toLocaleString() : '—'}
                </TableCell>
                <TableCell>
                  {venue.contact_email
                    ? <a href={`mailto:${venue.contact_email}`} className="text-sm underline text-muted-foreground">{venue.contact_email}</a>
                    : '—'
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
