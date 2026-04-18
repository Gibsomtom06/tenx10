'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Loader2, Copy, Check, Music2, Mail, Phone,
  Camera, Globe, ExternalLink, FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { PITCH_ARTIST_LIST, type PitchArtistSlug } from '@/lib/outreach/artist-profiles'
import type { EPKData } from '@/app/api/epk/generate/route'

export default function EPKPage() {
  const [artistSlug, setArtistSlug] = useState<PitchArtistSlug>('dirtysnatcha')
  const [loading, setLoading] = useState(false)
  const [epk, setEpk] = useState<EPKData | null>(null)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/epk/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistSlug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEpk(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  function buildPlainText(epk: EPKData) {
    return `
========================================
${epk.artist.name.toUpperCase()} — ELECTRONIC PRESS KIT
========================================

GENRE: ${epk.artist.genre}

BIO
${epk.artist.bio}

BY THE NUMBERS
${epk.artist.metrics}

TOP TRACKS
${epk.artist.topTracks}

RECENT ACTIVITY
${epk.artist.tourHistory}

BOOKING
Booking: ${epk.booking.contact}
Email: ${epk.booking.email}
Manager: ${epk.booking.manager}
Manager Email: ${epk.booking.managerEmail}
Manager Phone: ${epk.booking.managerPhone}

GUARANTEE RANGE
${epk.artist.guarantee}

SOCIAL / STREAMING
Spotify: ${epk.social.spotify}
Instagram: ${epk.social.instagram}
SoundCloud: ${epk.social.soundcloud}
${epk.social.facebook ? `Facebook: ${epk.social.facebook}` : ''}

PRESS TEXT (copy/paste)
${epk.pressText}

========================================
DirtySnatcha Records — thomas@dirtysnatcha.com
`.trim()
  }

  async function copyText() {
    if (!epk) return
    await navigator.clipboard.writeText(buildPlainText(epk))
    setCopied(true)
    toast.success('EPK copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Electronic Press Kit</h1>
        <p className="text-sm text-muted-foreground mt-1">
          One-click artist EPK — ready to paste into emails or share with promoters.
        </p>
      </div>

      {/* Generator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <select
              value={artistSlug}
              onChange={e => { setArtistSlug(e.target.value as PitchArtistSlug); setEpk(null) }}
              className="flex-1 text-sm border rounded-md px-3 py-2 bg-background"
            >
              {PITCH_ARTIST_LIST.map(a => (
                <option key={a.slug} value={a.slug}>{a.name}</option>
              ))}
            </select>
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
              {loading ? 'Generating...' : 'Generate EPK'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {epk && (
        <Card className="overflow-hidden">
          {/* EPK Header */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 px-6 py-8 border-b">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black tracking-tight">{epk.artist.name}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  {epk.artist.genre.split('/').map(g => (
                    <Badge key={g} variant="secondary" className="text-xs">{g.trim()}</Badge>
                  ))}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={copyText} className="shrink-0">
                {copied ? <Check className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copied!' : 'Copy EPK'}
              </Button>
            </div>
          </div>

          <CardContent className="pt-6 space-y-6">
            {/* Bio */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Bio</h3>
              <p className="text-sm leading-relaxed">{epk.artist.bio}</p>
            </div>

            <Separator />

            {/* Metrics */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">By the Numbers</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {epk.artist.metrics.split('|').map((m, i) => (
                  <div key={i} className="bg-muted/40 rounded-lg px-3 py-2 text-sm font-medium text-center">
                    {m.trim()}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Top Tracks */}
            {epk.artist.topTracks && (
              <>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    <Music2 className="h-3 w-3 inline mr-1" />Top Tracks
                  </h3>
                  <div className="space-y-1.5">
                    {epk.artist.topTracks.split('|').map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground font-mono text-xs w-4">{i + 1}.</span>
                        {t.trim()}
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Tour History */}
            {epk.artist.tourHistory && (
              <>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Recent Activity</h3>
                  <p className="text-sm">{epk.artist.tourHistory}</p>
                </div>
                <Separator />
              </>
            )}

            {/* Booking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Booking</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="font-medium">{epk.booking.contact}</div>
                  <a href={`mailto:${epk.booking.email}`} className="flex items-center gap-1.5 text-primary hover:underline">
                    <Mail className="h-3 w-3" />{epk.booking.email}
                  </a>
                  <div className="text-muted-foreground pt-1 text-xs">Management</div>
                  <div>{epk.booking.manager}</div>
                  <a href={`mailto:${epk.booking.managerEmail}`} className="flex items-center gap-1.5 text-primary hover:underline">
                    <Mail className="h-3 w-3" />{epk.booking.managerEmail}
                  </a>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3 w-3" />{epk.booking.managerPhone}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Streaming / Social</h3>
                <div className="space-y-1.5 text-sm">
                  {epk.social.spotify && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Music2 className="h-3 w-3 text-[#1DB954]" />
                      <span className="text-xs">{epk.social.spotify}</span>
                    </div>
                  )}
                  {epk.social.instagram && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Camera className="h-3 w-3 text-pink-500" />
                      <span className="text-xs">{epk.social.instagram}</span>
                    </div>
                  )}
                  {epk.social.soundcloud && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Globe className="h-3 w-3 text-orange-500" />
                      <span className="text-xs">{epk.social.soundcloud}</span>
                    </div>
                  )}
                  {epk.social.facebook && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ExternalLink className="h-3 w-3 text-blue-500" />
                      <span className="text-xs">{epk.social.facebook}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Guarantee Range</h3>
                  <p className="text-sm font-semibold">{epk.artist.guarantee}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Press text */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Press Text</h3>
              <div className="bg-muted/30 rounded-lg p-3 text-sm italic">{epk.pressText}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
