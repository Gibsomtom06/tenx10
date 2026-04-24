'use client'

import { ArrowRight, Music2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const SERVICES = [
  {
    title: 'Booking Management',
    desc: '6-step deal evaluation engine — guarantee floor checks, market tier scoring, CPT analysis, radius clause tracking, promoter grading, and marketing commitment verification.',
  },
  {
    title: 'Streaming Intelligence',
    desc: 'Real-time Popularity Score monitoring, save-to-stream ratio tracking, catalog health scoring, and automated release timing recommendations across DSPs.',
  },
  {
    title: 'Revenue Sustainability Engine',
    desc: 'Seven-pillar income tracking per artist: live, streaming, publishing, merch, content, education, and brand. Monthly goal vs. actuals with gap analysis and top unlocks.',
  },
  {
    title: 'AI Agent Team',
    desc: 'Eight specialist agents — booking, CMO/PR, social, manager, release, promo, UX, and architecture — coordinated by an orchestrator that runs daily briefings and offer evaluations.',
  },
]

const STATS = [
  { stat: '8', label: 'AI specialist agents per roster' },
  { stat: '7', label: 'Revenue pillars tracked per artist' },
  { stat: '6-step', label: 'Booking decision engine' },
  { stat: 'Real data', label: 'Not spreadsheets' },
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
          Artist Management Platform
        </Badge>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.0] mb-6">
          TENx10<br />
          <span className="text-white/30">Platform</span>
        </h1>
        <p className="text-xl text-white/60 max-w-2xl leading-relaxed mb-10">
          Management infrastructure for artists who are serious about their career. While most managers run on email chains and gut instinct, TENx10 gives you systems — booking analysis, streaming intelligence, revenue tracking, and an AI team that runs daily briefings so nothing slips.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/auth/login">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold h-12 px-8">
              Open platform <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="#contact">
            <Button size="lg" variant="outline" className="h-12 px-8 border-white/20 text-white hover:bg-white/10">
              Work with us
            </Button>
          </Link>
        </div>
      </section>

      {/* What we do */}
      <section className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-12">
            <h2 className="text-3xl font-black mb-3">What the platform does</h2>
            <p className="text-white/50 max-w-xl">Purpose-built for managers, labels, and artists — not adapted from generic CRMs.</p>
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
              <Badge className="mb-4 bg-white/10 text-white/60 border-0">Built different</Badge>
              <h2 className="text-3xl font-black mb-4">Systems, not spreadsheets</h2>
              <p className="text-white/60 leading-relaxed mb-4">
                TENx10 builds proprietary technology that handles what spreadsheets can't — 6-step booking evaluations, live streaming intelligence, tour operations, and daily briefings across your full roster. Your artists get more of your attention because the operational overhead is handled.
              </p>
              <p className="text-white/60 leading-relaxed">
                DAD, our autonomous AI system, manages communications, files, and operational tasks across every business. It&apos;s not a side project — it&apos;s how the whole operation stays sharp.
              </p>
              <Link href="/dad" className="inline-flex items-center gap-2 mt-6 text-sm text-white/50 hover:text-white transition-colors">
                Learn about DAD <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {STATS.map((item) => (
                <div key={item.label} className="flex items-center justify-between border border-white/10 rounded-xl px-5 py-4">
                  <span className="text-sm text-white/50">{item.label}</span>
                  <span className="font-black text-white">{item.stat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-black mb-4">Work with us</h2>
          <p className="text-white/50 mb-8">
            Artist management inquiries, platform access, and press — reach out directly.
          </p>
          <div className="space-y-3">
            <a
              href="mailto:thomas@dirtysnatcha.com"
              className="flex items-center justify-center gap-3 w-full bg-white text-black font-bold h-12 rounded-xl hover:bg-white/90 transition-colors"
            >
              thomas@dirtysnatcha.com
            </a>
            <Link href="/auth/login">
              <button className="w-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 h-12 rounded-xl text-sm font-medium transition-colors mt-3">
                Access platform
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
          <span className="text-white/30 text-sm">Platform</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-white/30">
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/dad" className="hover:text-white transition-colors">DAD</Link>
          <Link href="/auth/login" className="hover:text-white transition-colors">Portal</Link>
        </div>
        <span className="text-xs text-white/20">TENx10 © 2026</span>
      </footer>
    </div>
  )
}
