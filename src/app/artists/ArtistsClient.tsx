'use client'

import { ArrowLeft, ExternalLink, Music2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const ARTISTS = [
  {
    name: 'DirtySnatcha',
    realName: 'Leigh Bray',
    genre: 'Bass Music / Electronic',
    location: 'Detroit, MI',
    label: 'DirtySnatcha Records',
    dist: 'Virgin Music / Ingrooves',
    bio: `Leigh Bray, known as DirtySnatcha, is a Detroit-based bass music producer and DJ with a distinctive sound built on heavy sub frequencies, hard-hitting percussion, and relentless energy. Since founding DirtySnatcha Records in 2015, he's built one of the most loyal followings in the underground bass music scene — earning Insomniac bookings, a national headline touring footprint, and distribution through Virgin Music via Ingrooves.

His music spans bass house, riddim, and experimental electronic — always raw, always loud, always his.`,
    touring: 'Active national touring — Take Me To Your Leader Tour',
    links: {
      spotify: 'https://open.spotify.com/artist/13dsmcZVkb1XlhT6RQYh1n',
      site: 'https://www.dirtysnatcha.com',
      label: 'https://www.dirtysnatcharecords.com',
    },
    booking: 'Prysm Talent Agency',
    status: 'Active',
  },
  {
    name: 'WHOiSEE',
    realName: '',
    genre: 'Electronic / Bass',
    location: 'US',
    label: 'DirtySnatcha Records',
    dist: 'Virgin Music / Ingrooves',
    bio: `WHOiSEE is an emerging electronic artist managed by TENx10 and signed to DirtySnatcha Records. With international reach and a growing presence in the bass and electronic music community, WHOiSEE is building momentum with support from Circus Records UK and booking through Corson Agency.`,
    touring: 'Active — US and international dates',
    links: {},
    booking: 'Corson Agency',
    status: 'Active',
  },
  {
    name: 'DARK MATTER',
    realName: '',
    genre: 'Electronic',
    location: 'US',
    label: 'DirtySnatcha Records',
    dist: 'Virgin Music / Ingrooves',
    bio: `DARK MATTER is a high-energy electronic act on the DirtySnatcha Records roster. Press assets and booking information available on request through TENx10 Management.`,
    touring: '',
    links: {},
    booking: 'TENx10 Management',
    status: 'Active',
  },
]

export default function ArtistsClient() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 sticky top-0 bg-black/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                <Music2 className="h-4 w-4 text-black" />
              </div>
              <span className="font-black text-lg tracking-tight">TENx10</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">About</Link>
            <Link href="/dad" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">DAD</Link>
            <Link href="/#contact">
              <Button size="sm" className="bg-white text-black hover:bg-white/90 font-bold">Contact</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <Badge className="mb-4 bg-white/10 text-white/60 border-0">TENx10 Management</Badge>
        <h1 className="text-5xl font-black tracking-tight mb-4">Our Artists</h1>
        <p className="text-white/50 text-lg max-w-xl">
          A roster built on talent, trust, and the right infrastructure to grow. Each artist gets full-service management backed by our own technology.
        </p>
      </section>

      {/* Artists */}
      <section className="max-w-5xl mx-auto px-6 pb-20 space-y-8">
        {ARTISTS.map((artist) => (
          <div key={artist.name} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-colors">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <span className="font-black text-3xl">{artist.name[0]}</span>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h2 className="text-2xl font-black">{artist.name}</h2>
                  {artist.realName && (
                    <span className="text-white/40 text-sm">{artist.realName}</span>
                  )}
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">{artist.status}</Badge>
                </div>

                <div className="flex flex-wrap gap-3 mb-4 text-xs text-white/40">
                  <span>{artist.genre}</span>
                  {artist.location && <><span>·</span><span>{artist.location}</span></>}
                  <span>·</span><span>{artist.label}</span>
                  {artist.dist && <><span>·</span><span>{artist.dist}</span></>}
                </div>

                <p className="text-white/60 text-sm leading-relaxed mb-4 whitespace-pre-line">{artist.bio}</p>

                {artist.touring && (
                  <p className="text-white/40 text-xs mb-4">🎤 {artist.touring}</p>
                )}

                <div className="flex flex-wrap gap-3 items-center">
                  {artist.links.spotify && (
                    <a href={artist.links.spotify} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="border-white/20 text-white/60 hover:text-white hover:border-white/40 text-xs gap-1">
                        Spotify <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  )}
                  {artist.links.site && (
                    <a href={artist.links.site} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="border-white/20 text-white/60 hover:text-white hover:border-white/40 text-xs gap-1">
                        Website <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  )}
                  {artist.links.label && (
                    <a href={artist.links.label} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="border-white/20 text-white/60 hover:text-white hover:border-white/40 text-xs gap-1">
                        Label <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  )}
                  <span className="text-white/30 text-xs ml-auto">Booking: {artist.booking}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Contact CTA */}
      <section className="border-t border-white/10">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-black mb-3">Artist inquiries & press</h2>
          <p className="text-white/50 text-sm mb-8">
            For booking, collaboration, press requests, or to submit music to DirtySnatcha Records.
          </p>
          <a href="mailto:contact@dirtysnatcharecords.com">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold h-12 px-8">
              contact@dirtysnatcharecords.com
            </Button>
          </a>
          <p className="text-white/30 text-xs mt-4">We respond within 48 hours.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
            <Music2 className="w-3 h-3 text-black" />
          </div>
          <span className="text-sm font-black">TENx10</span>
          <span className="text-white/30 text-sm">Management</span>
        </Link>
        <span className="text-xs text-white/20">TENx10 © 2026</span>
      </footer>
    </div>
  )
}
