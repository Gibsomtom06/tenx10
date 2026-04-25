'use client'

import { ArrowLeft, Music2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const PILLARS = [
  {
    title: 'Booking intelligence',
    desc: 'Every offer runs through a 6-step evaluation engine — guarantee floor, market tier, CPT projection, calendar conflicts, promoter grade, and marketing commitment. Not gut instinct. Data.',
  },
  {
    title: 'Streaming operations',
    desc: 'Popularity Score tracking per ISRC, save-to-stream ratio monitoring, catalog health grades, and release timing recommendations. Algorithmically sound by default.',
  },
  {
    title: 'Revenue sustainability',
    desc: 'Seven income pillars tracked per artist with monthly goal vs. actual and gap analysis. Most artists have 3 of 7 active. The platform shows exactly what to unlock next.',
  },
  {
    title: 'AI agent team',
    desc: 'Eight specialist agents — booking, CMO/PR, social, manager, release, promo, and platform architecture — coordinated by an orchestrator. Daily briefings. No emails missed.',
  },
  {
    title: 'Multi-tenant infrastructure',
    desc: 'Row-level security isolates every artist, manager, and label. A tier-4 label manager sees everything. A tier-1 artist sees only their own data. Permission mismatches are a DB error, not an app bug.',
  },
  {
    title: 'Gmail & calendar integration',
    desc: 'Offer detection from inbound emails, auto-parsed against your deal history. Advance checklists built from Google Calendar show conflicts before they happen.',
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
            <Link href="/dad" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">DAD</Link>
            <Link href="/#contact">
              <Button size="sm" className="bg-white text-black hover:bg-white/90 font-bold">Contact</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-16">
        <Badge className="mb-4 bg-white/10 text-white/60 border-0">About</Badge>
        <h1 className="text-5xl font-black tracking-tight mb-6">
          Management infrastructure<br />
          <span className="text-white/30">for serious artists.</span>
        </h1>
        <p className="text-white/60 text-lg max-w-2xl leading-relaxed">
          TENx10 is an AI-powered artist management platform built by a manager who was tired of running his business on spreadsheets and email threads. Every feature solves a real problem that came up managing real artists on real tours.
        </p>
      </section>

      {/* Origin */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-black mb-4">Built from the inside</h2>
              <div className="space-y-4 text-white/60 leading-relaxed text-sm">
                <p>
                  TENx10 started as internal tooling for a Detroit-based management company. The booking evaluation engine came from too many bad offers slipping through with red flags nobody caught. The streaming intelligence module came from watching Popularity Score drop between releases because the timing was off. The revenue engine came from the realization that most artists had 3 of 7 income pillars active and didn&apos;t know the other 4 existed.
                </p>
                <p>
                  The platform is built by managers, for managers. It knows the difference between a $2K headline in a 200-cap room and a $2K support slot in a 2,500-cap room — and which one builds the career faster. It knows that a save-to-stream ratio below 5% means you stop ad spend immediately. It knows that an offer with a 90-mile radius clause for 60 days is sometimes worth walking away from, and why.
                </p>
                <p>
                  That knowledge is now in the platform, available to every manager and label that runs on TENx10.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Proof of concept</p>
                <p className="text-white font-bold">Built on a live independent label</p>
                <p className="text-white/50 text-sm">Every feature is tested against real booking history, real streaming numbers, and an active national touring operation — not a prototype dataset.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Philosophy</p>
                <p className="text-white font-bold">Revenue is the only metric that matters</p>
                <p className="text-white/50 text-sm">Streams, saves, followers, booking rates — all KPIs that feed into one number: monthly income per artist. The platform optimizes for that, and only that.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform pillars */}
      <section className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-12">
            <h2 className="text-3xl font-black mb-3">What the platform covers</h2>
            <p className="text-white/50 max-w-xl">Six operational domains, each with purpose-built tooling.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PILLARS.map((p) => (
              <div key={p.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                <h3 className="font-bold text-base mb-2">{p.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{p.desc}</p>
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
            Management inquiries, platform questions, press, and business.
          </p>
          <a href="mailto:thomas@dirtysnatcha.com">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold h-12 px-8 gap-2">
              <Mail className="w-4 h-4" /> thomas@dirtysnatcha.com
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
            <Music2 className="w-3 h-3 text-black" />
          </div>
          <span className="text-sm font-black">TENx10</span>
          <span className="text-white/30 text-sm">Platform</span>
        </Link>
        <span className="text-xs text-white/20">TENx10 © 2026</span>
      </footer>
    </div>
  )
}
