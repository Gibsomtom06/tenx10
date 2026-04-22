'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Mail, HardDrive, FolderOpen, Zap, Shield,
  CheckCircle2, ArrowRight, Bot, Inbox, Layers,
  Clock, BarChart2, Lock,
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
    title: 'Local First, Privacy Focused',
    desc: 'Runs on your machine using open-weight AI models. Your emails never leave your network. No third-party training on your data.',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Connect', desc: 'Link your email accounts and cloud drives in one click.' },
  { step: '02', title: 'Map', desc: 'DAD learns your businesses and builds a custom organization system for you.' },
  { step: '03', title: 'Run', desc: 'The autonomous agent runs on a schedule — cleaning, labeling, briefing — while you work.' },
  { step: '04', title: 'Brief', desc: 'Wake up to a daily briefing: what needs attention, what\'s waiting, what\'s done.' },
]

export default function DADClient() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(false)

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
        toast.success(data.message === "You're already on the list!" ? data.message : 'You\'re on the list!')
      } else {
        toast.error(data.error || 'Something went wrong')
      }
    } catch {
      toast.error('Something went wrong — try again')
    } finally {
      setLoading(false)
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
        <a href="#waitlist" className="text-sm text-white/60 hover:text-white transition-colors">
          Join Waitlist
        </a>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <Badge className="mb-6 bg-white/10 text-white/80 border-0 hover:bg-white/10">
          Autonomous AI for entrepreneurs
        </Badge>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6">
          Your digital life,<br />
          <span className="text-white/40">finally under control.</span>
        </h1>
        <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
          DAD is an autonomous AI agent that cleans and organizes your email accounts, cloud drives, and files — by business, by priority, by you. Runs while you sleep.
        </p>

        {/* Problems */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {PROBLEMS.map((p) => (
            <div key={p} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white/60">
              <span className="text-red-400">✕</span> {p}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div id="waitlist" className="max-w-md mx-auto">
          {joined ? (
            <div className="bg-white/5 border border-white/20 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">You're on the list.</h3>
              <p className="text-white/50 text-sm">We'll reach out when early access opens. Expect something good.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-3">
              <p className="text-sm text-white/50 font-medium uppercase tracking-widest mb-4">Get Early Access</p>
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
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
              />
              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-white text-black hover:bg-white/90 font-bold h-11"
              >
                {loading ? 'Joining...' : (
                  <span className="flex items-center gap-2">Join Waitlist <ArrowRight className="w-4 h-4" /></span>
                )}
              </Button>
              <p className="text-xs text-white/30 text-center">No spam. Early access only. Unsubscribe anytime.</p>
            </form>
          )}
        </div>
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

      {/* Stats / social proof */}
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

      {/* Bottom CTA */}
      <section className="max-w-2xl mx-auto px-6 py-20 border-t border-white/10 text-center">
        <h2 className="text-3xl font-black mb-4">Stop drowning in digital clutter.</h2>
        <p className="text-white/50 mb-8">DAD handles it. You focus on the work that matters.</p>
        <a href="#waitlist">
          <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold h-12 px-8">
            Get Early Access <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </a>
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
