'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Users, Mail, Loader2, Music2, Globe, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function VenueIntelPage() {
  const params = useParams()
  const venueId = params.venueId as string
  const [loading, setLoading] = useState(false)
  interface VenueIntel {
    talentBuyer?: string | null
    bookingEmail?: string | null
    typicalGenres?: string | null
    sellRadius?: string | null
    otherShows?: Array<{ artist: string; date: string | null; notes: string | null }> | null
    summary?: string | null
  }
  const [intel, setIntel] = useState<VenueIntel | null>(null)

  async function research() {
    setLoading(true)
    try {
      const res = await fetch('/api/venues/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setIntel(data.intel)
      toast.success('Venue intel updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Research failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/artist/pipeline" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
          <ChevronLeft className="h-3 w-3" />Back to pipeline
        </Link>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            Venue Intelligence
          </h1>
          <Button onClick={research} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
            {loading ? 'Researching...' : 'Research Venue'}
          </Button>
        </div>
      </div>

      {intel ? (
        <div className="space-y-4">
          {intel.talentBuyer && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Talent Buyer</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{intel.talentBuyer}</p>
                {intel.bookingEmail && (
                  <a href={`mailto:${intel.bookingEmail}`} className="flex items-center gap-1.5 text-primary hover:underline text-xs">
                    <Mail className="h-3 w-3" />{intel.bookingEmail}
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {intel.typicalGenres && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Music2 className="h-4 w-4" />Genres Booked</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {intel.typicalGenres!.split(',').map(g => (
                    <Badge key={g} variant="secondary" className="text-xs">{g.trim()}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {intel.sellRadius && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Sell Radius</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{intel.sellRadius}</p></CardContent>
            </Card>
          )}

          {intel.otherShows && intel.otherShows.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Other Acts Booked</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {intel.otherShows.map((show, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">{show.artist}</span>
                    {show.date && <span className="text-muted-foreground ml-2">· {show.date}</span>}
                    {show.notes && <p className="text-xs text-muted-foreground mt-0.5">{show.notes}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {intel.summary && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-relaxed">{intel.summary}</p></CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Globe className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Click "Research Venue" to pull AI booking intelligence for this venue.</p>
        </div>
      )}
    </div>
  )
}
