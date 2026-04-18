'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Bot, Calendar, DollarSign, Globe, Mail,
  Music2, TrendingUp, Zap, CheckCircle2, ArrowRight,
  BarChart2, Send, MapPin, FileText, Users, Star,
  Activity, Layers, Award, Mic2, ClipboardList,
  PieChart, Target, MessageSquare, Radio, BookOpen,
  Sparkles, ChevronRight, Lock, Shield,
} from 'lucide-react'

const FEATURE_CATEGORIES = [
  {
    label: 'Booking & Tour',
    color: 'text-blue-400',
    features: [
      {
        icon: Bot,
        title: 'Autonomous Booking Agent',
        desc: 'Runs the full DSR 6-step booking engine on every opportunity — guarantee floor, CPT analysis, promoter credibility, routing logic — then generates Gmail pitch drafts automatically.',
      },
      {
        icon: Globe,
        title: 'Market Intelligence Map',
        desc: 'Interactive US map showing audience density across Spotify, Meta, TikTok, Apple Music, Pandora, YouTube, and web traffic. See where to pitch before you pitch.',
      },
      {
        icon: DollarSign,
        title: 'Deal Pipeline',
        desc: 'Track every offer from inquiry to settlement. Guarantee floors, CPT projection, promoter history, radius clause enforcement, and payment scheduling — one view.',
      },
      {
        icon: Calendar,
        title: 'Show Advance System',
        desc: 'Tech riders, hospitality, logistics, and thread-based promoter communication per show. Google Drive folder auto-created. PDF contracts parsed on drop.',
      },
      {
        icon: FileText,
        title: 'Contract Management',
        desc: '2/3 partner vote enforcement at the database level. Counter-offer templates with guarantee, radius clause, deposit timing, and hotel buyout pre-filled.',
      },
    ],
  },
  {
    label: 'Streaming & Releases',
    color: 'text-green-400',
    features: [
      {
        icon: TrendingUp,
        title: 'Spotify Algorithm Optimizer',
        desc: 'Tracks your popularity score, save-to-stream ratio, and programmed vs organic audience split. Alerts when you hit Release Radar (20) and Discover Weekly (30) thresholds.',
      },
      {
        icon: Award,
        title: 'RIAA Certification Tracker',
        desc: 'Real-time Gold/Platinum/Diamond progress bars per release. Stream counts, ISRC management, and certification milestone alerts across your full catalog.',
      },
      {
        icon: Layers,
        title: 'Release Cadence System',
        desc: 'Waterfall ISRC strategy engine: bundle singles into EPs to inherit algorithmic authority. New ISRC scheduling every 6–8 weeks to reset decay clock.',
      },
      {
        icon: Music2,
        title: 'Catalog Management',
        desc: '5-bucket system: Full Distribution | SoundCloud/YouTube Only | Unreleased Collabs | Work in Progress | Vault. Stream counts, release dates, and ISRC per track.',
      },
      {
        icon: Radio,
        title: 'DSP Submission Tracker',
        desc: 'VMG delivery timeline per platform — Apple Music, Amazon, Tidal, Deezer, Asia-Pacific, China via UMG/Tencent. Never miss a platform again.',
      },
    ],
  },
  {
    label: 'Marketing & Content',
    color: 'text-purple-400',
    features: [
      {
        icon: ClipboardList,
        title: 'AI Content Calendar',
        desc: 'Generates a 4-week post schedule tailored to your voice profile and current goals — release traction, show sellout, RIAA push. Platform-specific formats auto-built.',
      },
      {
        icon: Target,
        title: 'Meta Ads Command Center',
        desc: '[BUILD], [SONG], and [SHOW] campaign architecture. 4-phase show campaign system. CPT tracking with $8 kill threshold. Scratch-hook creative library included.',
      },
      {
        icon: Activity,
        title: 'Algorithmic Health Dashboard',
        desc: 'Save-to-stream ratio, programmed audience %, Discovery Mode eligibility, Release Radar status. Know exactly which lever to pull to move the algorithm.',
      },
      {
        icon: BookOpen,
        title: 'EPK Generator',
        desc: 'Auto-builds your electronic press kit from live platform data — monthly listeners, top markets, confirmed shows, bio, and press photos — always up to date.',
      },
    ],
  },
  {
    label: 'Operations & Intelligence',
    color: 'text-orange-400',
    features: [
      {
        icon: Mail,
        title: 'Gmail Offer Pipeline',
        desc: 'Incoming booking offers parsed automatically. The 6-step engine evaluates in seconds. Counter-offer drafted by AI and saved to your Gmail Drafts — no copy-paste.',
      },
      {
        icon: PieChart,
        title: 'Finance Dashboard',
        desc: 'Guarantee tracking, deposit status, final settlement, and commission splits (agent / manager / artist) across your entire tour. No more spreadsheets.',
      },
      {
        icon: Users,
        title: 'Multi-Artist Roster',
        desc: 'Manage an entire label or agency from one account. Fully isolated data per artist with RLS at the database level. Artist tier never sees another artist\'s data.',
      },
      {
        icon: Star,
        title: 'Promoter Intelligence',
        desc: 'A–F grade per promoter based on show history, marketing commitment, responsiveness, and settlement speed. Private to manager/label tier — never visible to artists.',
      },
      {
        icon: MessageSquare,
        title: 'Ask X — AI Agent',
        desc: '"What\'s my CPT on the Denver show?" "Draft a follow-up to the Austin promoter." X knows your tour, your catalog, and your metrics. Natural language, real answers.',
      },
    ],
  },
]

const ALL_FEATURES = FEATURE_CATEGORIES.flatMap(c => c.features)

const SOCIAL_PROOF = [
  { metric: '17', label: 'confirmed shows tracked' },
  { metric: '$38K+', label: 'tour income managed' },
  { metric: '6-step', label: 'booking decision engine' },
  { metric: '5 DSPs', label: 'platform intelligence' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: BarChart2,
    title: 'Connect your platforms',
    desc: 'Link Spotify for Artists, Gmail, and Meta Ads. The platform ingests your live data in minutes — no CSV exports, no manual entry.',
  },
  {
    step: '02',
    icon: Sparkles,
    title: 'Agent analyzes everything',
    desc: 'X reads your audience map, routing windows, streaming health, and promoter history. It runs every opportunity through the 6-step decision engine.',
  },
  {
    step: '03',
    icon: Send,
    title: 'Pitches go to Gmail Drafts',
    desc: 'Approved targets get personalized pitch emails saved directly to your drafts. Review, send, and track — all inside your existing Gmail workflow.',
  },
]

const HIGHLIGHTS = [
  {
    badge: 'Streaming Intelligence',
    badgeColor: 'bg-green-500/10 text-green-400 border-green-500/20',
    headline: 'Know your algorithm score before you pitch',
    body: 'Popularity Score 20 unlocks Release Radar. Score 30 unlocks Discover Weekly. Your save-to-stream ratio and programmed audience % are tracked in real time — so you know exactly when to release and when to advertise.',
    stats: [
      { label: 'Release Radar threshold', value: '20' },
      { label: 'Discover Weekly threshold', value: '30' },
      { label: 'Target save-to-stream ratio', value: '15%+' },
    ],
    icon: TrendingUp,
    color: 'from-green-500/10',
  },
  {
    badge: 'Booking Automation',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    headline: 'Offer comes in. Counter-offer goes out.',
    body: 'Gmail surfaces an offer. X parses it — venue, date, guarantee, promoter. Runs the 6-step engine. If the math works, a counter-offer draft appears in your Gmail in under 60 seconds. You just hit send.',
    stats: [
      { label: 'Steps in decision engine', value: '6' },
      { label: 'CPT kill threshold', value: '$8' },
      { label: 'Counter-offer elements', value: '4' },
    ],
    icon: Mail,
    color: 'from-blue-500/10',
  },
  {
    badge: 'Market Intelligence',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    headline: 'See your audience before you book a date',
    body: 'The market map overlays your Spotify, Meta, TikTok, Apple Music, Pandora, and YouTube audience density across every US city — plus your show history, last promoter, and last guarantee per market.',
    stats: [
      { label: 'Platforms tracked', value: '7' },
      { label: 'Markets mapped', value: '100+' },
      { label: 'History depth', value: 'All shows' },
    ],
    icon: MapPin,
    color: 'from-purple-500/10',
  },
]

export default function HomepageClient() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccess() {
    if (!email) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setLoading(false)
    if (err) {
      setError(err.message.includes('rate limit')
        ? 'Too many requests — try again in a few minutes.'
        : err.message)
    } else {
      setSent(true)
    }
  }

  const EarlyAccessForm = ({ compact = false }: { compact?: boolean }) => (
    sent ? (
      <div className="inline-flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-6 py-4 text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <div className="text-left">
          <p className="font-semibold text-sm">Check your email</p>
          <p className="text-xs text-green-600/70 dark:text-green-400/70">Magic link sent to {email}</p>
        </div>
      </div>
    ) : (
      <div className={`flex flex-col sm:flex-row gap-3 ${compact ? 'max-w-sm' : 'max-w-md'} ${compact ? '' : 'mx-auto'}`}>
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAccess()}
          className={compact ? 'h-11' : 'h-12 text-base'}
        />
        <Button
          size={compact ? 'default' : 'lg'}
          onClick={handleAccess}
          disabled={loading || !email}
          className={`${compact ? 'h-11' : 'h-12 px-8'} font-bold shrink-0 gap-2`}
        >
          {loading ? 'Sending...' : <><ArrowRight className="h-4 w-4" /> Get Access</>}
        </Button>
      </div>
    )
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Music2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-black text-lg tracking-tight">TEN<span className="text-primary">x10</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs hidden sm:flex">Early Access</Badge>
            <a href="/auth/login">
              <Button size="sm" variant="ghost" className="text-muted-foreground">
                Log in
              </Button>
            </a>
            <Button size="sm" onClick={() => document.getElementById('access-form')?.scrollIntoView({ behavior: 'smooth' })}>
              Get Access
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
          <Zap className="h-3 w-3 mr-1" /> AI-Powered Artist Management
        </Badge>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
          The platform that
          <br />
          <span className="text-primary">multiplies your reach</span>
          <br />
          <span className="text-muted-foreground">× 10</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          AI booking agent. Streaming intelligence. Tour ops. Release strategy. Market map.
          Built for managers, artists, and labels who are serious about scaling.
        </p>

        <div id="access-form" className="mb-4">
          <EarlyAccessForm />
        </div>
        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        <p className="text-xs text-muted-foreground mt-3">No password. Magic link sent to your inbox.</p>
      </section>

      {/* Metrics strip */}
      <section className="border-y bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {SOCIAL_PROOF.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-black text-primary">{s.metric}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Highlight features — big 3 */}
      <section className="max-w-6xl mx-auto px-6 py-20 space-y-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-3">Built differently</h2>
          <p className="text-muted-foreground">Not a CRM. Not a spreadsheet. A system that does the work.</p>
        </div>
        {HIGHLIGHTS.map(h => {
          const Icon = h.icon
          return (
            <div key={h.headline} className={`rounded-2xl border bg-gradient-to-br ${h.color} to-transparent p-8 md:p-10`}>
              <div className="flex flex-col md:flex-row md:items-start gap-8">
                <div className="flex-1">
                  <Badge className={`mb-4 text-xs border ${h.badgeColor}`}>{h.badge}</Badge>
                  <h3 className="text-2xl font-black mb-3">{h.headline}</h3>
                  <p className="text-muted-foreground leading-relaxed">{h.body}</p>
                </div>
                <div className="md:w-64 shrink-0 space-y-3">
                  {h.stats.map(s => (
                    <div key={s.label} className="flex items-center justify-between rounded-xl border bg-background/60 px-4 py-3">
                      <span className="text-xs text-muted-foreground">{s.label}</span>
                      <span className="font-black text-primary">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* Full feature grid by category */}
      <section className="border-t bg-muted/10">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black mb-3">Everything your team needs</h2>
            <p className="text-muted-foreground">One platform for the entire artist operation — first offer to final settlement.</p>
          </div>

          <div className="space-y-14">
            {FEATURE_CATEGORIES.map(cat => (
              <div key={cat.label}>
                <div className="flex items-center gap-3 mb-6">
                  <h3 className={`text-xs font-bold uppercase tracking-widest ${cat.color}`}>{cat.label}</h3>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.features.map(f => {
                    const Icon = f.icon
                    return (
                      <div key={f.title} className="rounded-xl border bg-card p-5 hover:border-primary/40 transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <h4 className="font-bold text-sm mb-1.5">{f.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">Built on a proven system</h2>
            <p className="text-muted-foreground">The same 6-step booking engine used by DirtySnatcha Records — now available for any artist.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {HOW_IT_WORKS.map(s => {
              const Icon = s.icon
              return (
                <div key={s.step} className="text-center">
                  <div className="text-5xl font-black text-muted-foreground/20 mb-3">{s.step}</div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Permission / trust section */}
      <section className="border-t bg-muted/10">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-muted text-muted-foreground border-border">Enterprise-grade security</Badge>
              <h2 className="text-3xl font-black mb-4">Your data, your rules</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Row Level Security enforced at the database level — not just in the app.
                Artist tier never sees promoter grades, label financials, or another artist's data.
                Multi-tenant from day one: every label is a completely isolated environment.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Shield, text: 'Promoter grades never visible to artist tier' },
                  { icon: Lock, text: 'Label financials isolated per tenant' },
                  { icon: Users, text: '2/3 vote constraint enforced at DB level' },
                  { icon: CheckCircle2, text: 'Commission splits calculated per originating agent' },
                ].map(item => {
                  const Icon = item.icon
                  return (
                    <div key={item.text} className="flex items-center gap-3 text-sm">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">{item.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="space-y-4">
              {[
                { role: 'Artist', can: ['Own DSP metrics', 'Own show details', 'Catalog management', 'Ask X agent'], cannot: ['Promoter grades', 'Other artists\' data', 'Label financials'] },
                { role: 'Manager', can: ['Full roster visibility', 'Promoter grades', 'Commission tracking', 'Booking agent'], cannot: ['Label financials (unless owner)'] },
                { role: 'Label / Agency', can: ['All roster data', 'A&R queue', 'Full financials', 'White-label'], cannot: [] },
              ].map(tier => (
                <div key={tier.role} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-3 w-3 text-primary" />
                    </div>
                    <span className="font-bold text-sm">{tier.role}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tier.can.map(c => (
                      <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">{c}</span>
                    ))}
                    {tier.cannot.map(c => (
                      <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground line-through border border-border">{c}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing tiers teaser */}
      <section className="border-t">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Pricing</Badge>
            <h2 className="text-3xl font-black mb-3">Built for every stage</h2>
            <p className="text-muted-foreground">Solo artist to full label — one platform scales with you.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: 'Artist',
                desc: 'Independent artists managing their own career.',
                features: ['AI booking agent', 'Streaming analytics', 'Content calendar', 'Release tracking', 'EPK generator'],
                cta: 'Get Early Access',
              },
              {
                name: 'Manager',
                badge: 'Most Popular',
                desc: 'Managers running a roster of up to 5 artists.',
                features: ['Everything in Artist', 'Up to 5 artists', 'Promoter grades', 'Commission tracking', 'Multi-artist market map'],
                cta: 'Get Early Access',
                highlight: true,
              },
              {
                name: 'Label / Agency',
                desc: 'Full label or booking agency, unlimited roster.',
                features: ['Everything in Manager', 'Unlimited artists', 'A&R submission queue', 'White-label option', 'Done-for-you onboarding'],
                cta: 'Contact Us',
              },
            ].map(tier => (
              <div key={tier.name} className={`rounded-2xl border p-6 flex flex-col ${tier.highlight ? 'border-primary bg-primary/5 relative' : 'bg-card'}`}>
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs">{tier.badge}</Badge>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-black text-lg mb-1">{tier.name}</h3>
                  <p className="text-xs text-muted-foreground">{tier.desc}</p>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={tier.highlight ? 'default' : 'outline'}
                  className="w-full font-bold"
                  onClick={() => document.getElementById('access-form')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {tier.cta} <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">Early access pricing locked in at launch. Pricing announced Q2 2026.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-transparent p-12">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="h-3 w-3 mr-1" /> Early Access Open
          </Badge>
          <h2 className="text-4xl font-black mb-4">Ready to 10x your operation?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
            Join the artists and managers already using TENx10. No password — just your email and a magic link.
          </p>
          <EarlyAccessForm compact />
          {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <Music2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-black text-lg tracking-tight">TEN<span className="text-primary">x10</span></span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              {['Booking Agent', 'Market Map', 'Streaming Analytics', 'Content Calendar', 'EPK Generator', 'Finance Dashboard'].map(f => (
                <span key={f}>{f}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground border-t pt-6">
            <span>TENx10 © 2026</span>
            <span>AI-powered artist management · Built for the music industry</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
