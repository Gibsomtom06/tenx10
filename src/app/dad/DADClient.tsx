'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Mail, HardDrive, FolderOpen, Shield,
  CheckCircle2, ArrowRight, Bot, Inbox,
} from 'lucide-react'

const PROBLEMS = [
  '9 email accounts across 4 businesses',
  'Unread count in the thousands',
  'Important deals buried in spam',
  'Google Drive, OneDrive, Dropbox all a mess',
  'Hours lost every week just finding things',
]

const FEATURES = [
  {
    icon: Mail,
    title: 'Unified Email Intelligence',
    desc: 'Connects all your Gmail and Outlook accounts. Auto-labels by business, flags action-required items, and surfaces what matters every morning.',
  },
  {
    icon: Bot,
    title: 'Autonomous Triage Agent',
    desc: 'Runs daily. Scans every inbox, applies smart labels, archives noise, and builds your daily briefing — without you lifting a finger.',
  },
  {
    icon: HardDrive,
    title: 'Drive & Cloud Cleanup',
    desc: 'Deduplicates files across Google Drive and OneDrive. Organizes by business bucket. Quarantines before deleting — never loses your data.',
  },
  {
    icon: FolderOpen,
    title: 'Business-Aware Organization',
    desc: 'Understands you run multiple businesses. Routes music label emails to DSR, hydration pack emails to MHP, resale to Resale — automatically.',
  },
  {
    icon: Inbox,
    title: 'Daily Briefing',
    desc: 'Every morning: urgent emails, waiting replies, overdue items, and what to focus on — delivered in one clean summary.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    desc: 'Your emails never leave your network. No third-party training on your data. You stay in control.',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Connect', desc: 'Link your email accounts and cloud drives in one click.' },
  { step: '02', title: 'Map', desc: 'DAD learns your businesses and builds a custom organization system for you.' },
  { step: '03', title: 'Run', desc: 'The autonomous agent runs on a schedule — cleaning, labeling, briefing — while you work.' },
  { step: '04', title: 'Brief', desc: "Wake up to a daily briefing: what needs attention, what's waiting, what's done." },
]

const PRICING = [
  {
    name: 'Solo',
    price: 39,
    annual: 29,
    desc: 'For founders running 1–3 businesses',
    features: [
      'Up to 3 email accounts',
      'Up to 2 cloud drives',
      'Daily briefing digest',
      'Auto-label by business',
      'File deduplication',
    ],
    cta: 'Start 14-Day Free Trial',
    highlight: false,
  },
  {
    name: 'Portfolio',
    price: 69,
    annual: 49,
    desc: 'For operators running 4+ businesses',
    features: [
      'Up to 8 email accounts',
      'Up to 5 cloud drives',
      'Everything in Solo',
      '2x daily runs',
      'Business context memory',
      'Slack/Notion briefing delivery',
    ],
    cta: 'Start 14-Day Free Trial',
    highlight: true,
  },
]

export default function DADClient() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [joined, setJoined] = useState(false)
  const [billingAnnual, setBillingAnnual] = useState(false)

  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : null
  const didPay = searchParams?.get('success') === 'true'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch('/api/dad-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })
      const data = await res.json()
      if (res.ok) {
        setJoined(true)
        toast.success(data.message === "You're already on the list!" ? data.message : "You're on the list!")
      } else {
        toast.error(data.error || 'Something went wrong')
      }
    } catch {
      toast.error('Something went wrong — try again')
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckout(tier: string) {
    if (!email) {
      toast.error('Enter your email first')
      return
    }
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/dad-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, tier }),
      })
      const data = await res.json()
      if (data.url) {
        fetch('/api/dad-waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name }),
        }).catch(() => {})
        window.location.href = data.url
      } else {
        toast.error('Payment not available yet — joined waitlist instead')
        setJoined(true)
      }
    } catch {
      toast.error('Something went wrong — try again')
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-black text-sm">D</span>
          </div>
          <span className="font-bold text-lg tracking-tight">DAD</span>
          <Badge variant="outline" className="text-xs border-white/20 text-white/50 ml-1">Beta</Badge>
        </div>
        <a href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">
          Get Early Access
        </a>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <Badge className="mb-6 bg-white/10 text-white/80 border-0 hover:bg-white/10">
          Autonomous AI for entrepreneurs
        </Badge>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6">
          You run 3 businesses.<br />
          <span className="text-white/40">You shouldn't also run your inbox.</span>
        </h1>
        <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
          DAD connects all your email accounts and cloud drives, organizes everything by business, and sends you a daily briefing of what actually needs your attention — without you lifting a finger.
        </p>

        {/* Problems */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {PROBLEMS.map((p) => (
            <div key={p} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white/60">
              <span className="text-red-400">✕</span> {p}
            </div>
          ))}
        </div>

        <a href="#pricing">
          <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold h-12 px-8">
            Start Free for 14 Days <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </a>
        <p className="text-white/30 text-sm mt-3">No credit card required. Cancel anytime.</p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black mb-4">What DAD does for you</h2>
          <p className="text-white/50 max-w-xl mx-auto">One agent. All your accounts. Fully autonomous.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
              <f.icon className="w-8 h-8 text-white/60 mb-4" />
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black mb-4">How it works</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} className="text-center">
              <div className="text-5xl font-black text-white/10 mb-3">{step.step}</div>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-white/50 text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="grid sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-black mb-2">9+</div>
            <div className="text-white/50 text-sm">Email accounts supported</div>
          </div>
          <div>
            <div className="text-4xl font-black mb-2">∞</div>
            <div className="text-white/50 text-sm">Files, drives, and folders</div>
          </div>
          <div>
            <div className="text-4xl font-black mb-2">0</div>
            <div className="text-white/50 text-sm">Hours of manual sorting</div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-4">Simple pricing</h2>
          <p className="text-white/50 mb-8">14-day free trial. No credit card required. Early access members lock in pricing for life.</p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className={`text-sm ${!billingAnnual ? 'text-white' : 'text-white/40'}`}>Monthly</span>
            <button
              onClick={() => setBillingAnnual(!billingAnnual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${billingAnnual ? 'bg-white' : 'bg-white/20'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${billingAnnual ? 'translate-x-6 bg-black' : 'bg-white'}`} />
            </button>
            <span className={`text-sm ${billingAnnual ? 'text-white' : 'text-white/40'}`}>
              Annual <span className="text-green-400 text-xs">Save 26%</span>
            </span>
          </div>

          {/* Email input for checkout */}
          {!joined && !didPay && (
            <div className="max-w-sm mx-auto flex flex-col gap-3 mb-10">
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
              />
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
              />
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 border ${plan.highlight
                ? 'bg-white text-black border-white'
                : 'bg-white/5 border-white/10'}`}
            >
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-black text-xl ${plan.highlight ? 'text-black' : 'text-white'}`}>{plan.name}</h3>
                  {plan.highlight && <Badge className="bg-black text-white text-xs">Most Popular</Badge>}
                </div>
                <p className={`text-sm mb-4 ${plan.highlight ? 'text-black/60' : 'text-white/50'}`}>{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-black' : 'text-white'}`}>
                    ${billingAnnual ? plan.annual : plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlight ? 'text-black/50' : 'text-white/40'}`}>/mo</span>
                </div>
                {billingAnnual && (
                  <p className={`text-xs mt-1 ${plan.highlight ? 'text-black/50' : 'text-white/30'}`}>
                    billed annually
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-black/80' : 'text-white/60'}`}>
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-black' : 'text-white/40'}`} />
                    {f}
                  </li>
                ))}
              </ul>

              {(joined || didPay) ? (
                <div className={`text-center text-sm font-medium ${plan.highlight ? 'text-black/60' : 'text-white/40'}`}>
                  {didPay ? "You're in!" : "You're on the waitlist"}
                </div>
              ) : (
                <Button
                  onClick={() => handleCheckout(plan.name.toLowerCase())}
                  disabled={checkoutLoading || !email}
                  className={`w-full font-bold h-11 ${plan.highlight
                    ? 'bg-black text-white hover:bg-black/80'
                    : 'bg-white text-black hover:bg-white/90'}`}
                >
                  {checkoutLoading ? 'Redirecting...' : plan.cta}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Free waitlist option */}
        {!joined && !didPay && (
          <div className="text-center mt-8">
            <button
              onClick={handleSubmit as any}
              disabled={loading || !email}
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              {loading ? 'Joining...' : 'Not ready to pay? Join the free waitlist →'}
            </button>
          </div>
        )}

        {(joined || didPay) && (
          <div className="max-w-md mx-auto mt-8 bg-white/5 border border-white/20 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">
              {didPay ? "You're in. Welcome to early access." : "You're on the list."}
            </h3>
            <p className="text-white/50 text-sm">
              {didPay
                ? "Check your email for next steps. We'll get you set up ASAP."
                : "We'll reach out when early access opens. Expect something good."}
            </p>
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="max-w-2xl mx-auto px-6 py-20 border-t border-white/10 text-center">
        <h2 className="text-3xl font-black mb-4">Stop drowning in digital clutter.</h2>
        <p className="text-white/50 mb-8">DAD handles it. You focus on the work that matters.</p>
        <a href="#pricing">
          <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold h-12 px-8">
            Start Free for 14 Days <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </a>
        <p className="text-white/30 text-sm mt-3">No credit card. Cancel anytime. Early members lock in pricing for life.</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
            <span className="text-black font-black text-xs">D</span>
          </div>
          <span className="text-sm font-bold">DAD</span>
          <span className="text-white/30 text-sm">by 10 Research Group</span>
        </div>
        <a href="/" className="text-sm text-white/30 hover:text-white transition-colors">
          Powered by TENx10
        </a>
      </footer>
    </div>
  )
}
