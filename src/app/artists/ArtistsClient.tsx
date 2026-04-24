'use client'

import { ArrowLeft, Music2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

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
        <h1 className="text-5xl font-black tracking-tight mb-4">Roster</h1>
        <p className="text-white/50 text-lg max-w-xl">
          Managed artists across bass music, electronic, and beyond.
        </p>
      </section>

      {/* Placeholder */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-7 h-7 text-white/40" />
          </div>
          <h2 className="text-2xl font-black mb-3">Roster managed through the platform</h2>
          <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed mb-8">
            Artist profiles, tour status, and booking information are managed privately through the TENx10 platform. For press, booking, or management inquiries, reach out directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:thomas@dirtysnatcha.com">
              <Button className="bg-white text-black hover:bg-white/90 font-bold">
                Artist inquiries
              </Button>
            </a>
            <Link href="/auth/login">
              <Button variant="outline" className="border-white/20 text-white/60 hover:text-white hover:border-white/40">
                Platform login
              </Button>
            </Link>
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
          <span className="text-white/30 text-sm">Platform</span>
        </Link>
        <span className="text-xs text-white/20">TENx10 © 2026</span>
      </footer>
    </div>
  )
}
