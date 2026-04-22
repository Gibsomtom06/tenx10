'use client'

import { ArrowLeft, Music2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const TIMELINE = [
  {
    year: 'Early',
    title: 'Born into music',
    desc: "Grew up around music — his father was a drummer. The industry wasn't a career choice, it was the environment.",
  },
  {
    year: '2000s',
    title: 'Laleo — Metal band',
    desc: 'Played and performed in Laleo, a metal band. First real experience with the raw energy of live music and what it takes to build an audience from nothing.',
  },
  {
    year: '2010s',
    title: 'SMD / 2Few2Mention — Rap management',
    desc: 'Managed SMD, later rebranded as 2Few2Mention. First hands-on management experience — booking, operations, artist development. Learned the business by doing it.',
  },
  {
    year: '2023',
    title: 'Joins DirtySnatcha Records',
    desc: 'Came on board to help Leigh Bray (DirtySnatcha) build the label infrastructure. Took over as head of A&R and began consolidating the catalog across platforms.',
  },
  {
    year: '2024',
    title: 'Virgin Music distribution deal',
    desc: 'Negotiated and closed distribution through Virgin Music via Ingrooves, moving the full DirtySnatcha catalog under one roof with major label infrastructure behind it.',
  },
  {
    year: '2024',
    title: 'Becomes DirtySnatcha\'s manager',
    desc: 'Officially stepped into full artist management — advancing national tour dates, handling deal negotiations, coordinating booking with Prysm Talent Agency, and growing the roster.',
  },
  {
    year: '2025',
    title: 'Expands roster, founds TENx10',
    desc: 'Added WHOiSEE and DARK MATTER to the roster. Founded TENx10 as a management company built on a different philosophy: technology as the operational edge.',
  },
  {
    year: '2026',
    title: 'Building the system',
    desc: 'Launched DAD — an autonomous AI system for managing communications, files, and operations across multiple businesses. TENx10 is building the tools the music industry should have had years ago.',
  },
]

export default function AboutClient() {
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
            <Link href="/artists" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">Artists</Link>
            <Link href="/dad" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">DAD</Link>
            <Link href="/#contact">
              <Button size="sm" className="bg-white text-black hover:bg-white/90 font-bold">Contact</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Photo placeholder */}
          <div>
            <div className="w-full aspect-square max-w-sm rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                  <span className="font-black text-4xl">T</span>
                </div>
                <p className="text-white/20 text-xs">Photo coming soon</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-white/40">
              <p>Thomas Nalian</p>
              <p>Founder, TENx10 Management</p>
              <p>Head of A&R, DirtySnatcha Records</p>
              <p>Detroit Metropolitan Area</p>
            </div>
          </div>

          {/* Bio */}
          <div>
            <Badge className="mb-4 bg-white/10 text-white/60 border-0">About</Badge>
            <h1 className="text-4xl font-black tracking-tight mb-6">Thomas Nalian</h1>

            <div className="space-y-4 text-white/60 leading-relaxed">
              <p>
                Thomas Nalian grew up in music. His father was a drummer — the sound of live performance was always in the house. He found his own voice fronting <strong className="text-white">Laleo</strong>, a metal band, before the business side pulled him in.
              </p>
              <p>
                His first management experience came with <strong className="text-white">SMD</strong>, a rap group he helped build from the ground up — later rebranded as <strong className="text-white">2Few2Mention</strong>. He learned what management actually meant: not a title, but the work of building careers while artists focus on the music.
              </p>
              <p>
                The turning point came when he connected with Leigh Bray, known as <strong className="text-white">DirtySnatcha</strong> — a Detroit-area bass music producer with a sound and a following built entirely from the underground up. Thomas came in to help run the label and never left. He consolidated the catalog, navigated publishing, and closed distribution through <strong className="text-white">Virgin Music via Ingrooves</strong>, putting DirtySnatcha Records on infrastructure used by major label imprints.
              </p>
              <p>
                Today, Thomas manages DirtySnatcha's national touring career, heads A&R at DirtySnatcha Records, and has expanded the roster to include <strong className="text-white">WHOiSEE</strong> and <strong className="text-white">DARK MATTER</strong> under <strong className="text-white">TENx10 Management</strong>.
              </p>
              <p>
                TENx10 is built on one belief: the operational side of music management should be as sharp as the artists it serves. Thomas is building proprietary technology — including <strong className="text-white">DAD</strong>, an autonomous AI system — to give every artist on the roster an edge that most management companies can't offer.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="mailto:thomas@dirtysnatcha.com">
                <Button size="sm" className="bg-white text-black hover:bg-white/90 font-bold gap-2">
                  <Mail className="w-3 h-3" /> Get in touch
                </Button>
              </a>
              <Link href="/artists">
                <Button size="sm" variant="outline" className="border-white/20 text-white/60 hover:text-white hover:border-white/40">
                  View Roster
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-black mb-12">Career timeline</h2>
          <div className="space-y-0">
            {TIMELINE.map((item, i) => (
              <div key={i} className="flex gap-6 pb-10 relative">
                {/* Line */}
                {i < TIMELINE.length - 1 && (
                  <div className="absolute left-[3.25rem] top-8 w-px h-full bg-white/10" />
                )}
                <div className="w-16 shrink-0 text-right">
                  <span className="text-xs text-white/30 font-mono">{item.year}</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-white/20 border border-white/40 shrink-0 mt-1" />
                <div className="flex-1 pb-2">
                  <h3 className="font-bold text-base mb-1">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-black mb-3">Get in touch</h2>
          <p className="text-white/50 text-sm mb-8">
            Management inquiries, press, artist submissions, and business.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:thomas@dirtysnatcha.com">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold h-12 px-8">
                thomas@dirtysnatcha.com
              </Button>
            </a>
            <a href="mailto:contact@dirtysnatcharecords.com">
              <Button size="lg" variant="outline" className="border-white/20 text-white/60 hover:text-white h-12 px-8">
                Label inquiries
              </Button>
            </a>
          </div>
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
