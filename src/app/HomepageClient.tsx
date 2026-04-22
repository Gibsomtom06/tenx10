'use client'

import { ArrowRight, Music2, Zap, Globe, Users, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const ROSTER = [
  {
    name: 'DirtySnatcha',
    genre: 'Bass Music / Electronic',
    label: 'DirtySnatcha Records',
    dist: 'Virgin Music / Ingrooves',
    bio: 'Detroit-based bass music producer and DJ with a global underground following. Headline shows across the US, distributed through Virgin Music via Ingrooves.',
    links: {
      spotify: 'https://open.spotify.com/artist/13dsmcZVkb1XlhT6RQYh1n',
      site: 'https://www.dirtysnatcha.com',
    },
    slug: 'dirtysnatcha',
  },
  {
    name: 'WHOiSEE',
    genre: 'Electronic / Bass',
    label: 'DirtySnatcha Records',
    dist: 'Corson Agency (Booking)',
    bio: 'Emerging electronic artist with international reach. Booked through Corson Agency with label support from DirtySnatcha Records.',
    links: {},
    slug: 'whoisee',
  },
  {
    name: 'DARK MATTER',
    genre: 'Electronic',
    label: 'DirtySnatcha Records',
    dist: '',
    bio: 'High-energy electronic act on the DirtySnatcha Records roster. Press assets available on request.',
    links: {},
    slug: 'dark-matter',
  },
]

const SERVICES = [
  {
    title: 'Artist Management',
    desc: 'Full-service management — touring, deal negotiations, release strategy, day-to-day operations, and long-term career planning.',
  },
  {
    title: 'Label & Distribution',
    desc: 'DirtySnatcha Records is distributed through Virgin Music via Ingrooves. We handle catalog consolidation, ISRC management, and DSP delivery.',
  },
  {
    title: 'Booking Coordination',
    desc: 'We advance every show — riders, hospitality, logistics, and promoter communication. Partnered with Prysm Talent Agency and Corson Agency.',
  },
  {
    title: 'Technology & Operations',
    desc: 'We build our own tools. Our internal systems handle booking analysis, streaming intelligence, and daily operations — giving our artists an edge no spreadsheet can match.',
  },
]

export default function HomepageClient() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 sticky top-0 bg-black/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
              <Music2 className="h-4 w-4 text-black" />
            </div>
            <span className="font-black text-lg tracking-tight">TENx10</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/artists" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">Artists</Link>
            <Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">About</Link>
            <Link href="/dad" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">DAD</Link>
            <Link href="#contact">
              <Button size="sm" className="bg-white text-black hover:bg-white/90 font-bold">Contact</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <Badge className="mb-6 bg-white/10 text-white/70 border-0 hover:bg-white/10">
          Music Management · Detroit
        </Badge>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.0] mb-6">
          TENx10<br />
          <span className="text-white/30">Management</span>
        </h1>
        <p className="text-xl text-white/60 max-w-2xl leading-relaxed mb-10">
          We manage artists differently. While most management companies run on email chains and gut instinct, we build our own systems — giving every artist on our roster an operational edge that scales.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/artists">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold h-12 px-8">
              Our Roster <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="#contact">
            <Button size="lg" variant="outline" className="h-12 px-8 border-white/20 text-white hover:bg-white/10">
              Work With Us
            </Button>
          </Link>
        </div>
      </section>

      {/* What we do */}
      <section className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-12">
            <h2 className="text-3xl font-black mb-3">What we do</h2>
            <p className="text-white/50 max-w-xl">Full-service management for artists who are serious about building a career — not just a moment.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {SERVICES.map((s) => (
              <div key={s.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The edge */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-white/10 text-white/60 border-0">Our edge</Badge>
              <h2 className="text-3xl font-black mb-4">We build our own tools</h2>
              <p className="text-white/60 leading-relaxed mb-4">
                Most managers have a Gmail and a prayer. We have systems. TENx10 builds proprietary technology that handles what spreadsheets can't — booking analysis, streaming intelligence, tour operations, and daily briefings — so our artists get more of our attention and less of our overhead.
              </p>
              <p className="text-white/60 leading-relaxed">
                DAD, our autonomous AI system, manages communications, files, and operational tasks across every business we run. It's not a side project — it's how we stay sharp.
              </p>
              <Link href="/dad" className="inline-flex items-center gap-2 mt-6 text-sm text-white/50 hover:text-white transition-colors">
                Learn about DAD <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { stat: 'Virgin Music', label: 'Distribution partner via Ingrooves' },
                { stat: '3+', label: 'Artists on active roster' },
                { stat: 'National', label: 'Touring footprint across the US' },
                { stat: 'Built in-house', label: 'Proprietary management technology' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between border border-white/10 rounded-xl px-5 py-4">
                  <span className="text-sm text-white/50">{item.label}</span>
                  <span className="font-black text-white">{item.stat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Roster preview */}
      <section className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black mb-2">Roster</h2>
              <p className="text-white/50">Artists we represent</p>
            </div>
            <Link href="/artists" className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {ROSTER.map((a) => (
              <div key={a.name} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <span className="font-black text-lg">{a.name[0]}</span>
                </div>
                <h3 className="font-black text-lg mb-1">{a.name}</h3>
                <p className="text-white/40 text-xs mb-3">{a.genre}</p>
                <p className="text-white/60 text-sm leading-relaxed">{a.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-black mb-4">Work with us</h2>
          <p className="text-white/50 mb-8">
            Artist inquiries, booking, press, and business — reach us directly.
          </p>
          <div className="space-y-3">
            <a
              href="mailto:contact@dirtysnatcharecords.com"
              className="flex items-center justify-center gap-3 w-full bg-white text-black font-bold h-12 rounded-xl hover:bg-white/90 transition-colors"
            >
              contact@dirtysnatcharecords.com
            </a>
            <Link href="/artists">
              <button className="w-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 h-12 rounded-xl text-sm font-medium transition-colors">
                View Artist Roster
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
            <Music2 className="w-3 h-3 text-black" />
          </div>
          <span className="text-sm font-black">TENx10</span>
          <span className="text-white/30 text-sm">Management</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-white/30">
          <Link href="/artists" className="hover:text-white transition-colors">Artists</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/dad" className="hover:text-white transition-colors">DAD</Link>
          <Link href="/auth/login" className="hover:text-white transition-colors">Portal</Link>
        </div>
        <span className="text-xs text-white/20">TENx10 © 2026</span>
      </footer>
    </div>
  )
}
