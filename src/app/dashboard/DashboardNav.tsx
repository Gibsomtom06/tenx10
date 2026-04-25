'use client'

import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Handshake, Mail, Music2,
  Calendar, DollarSign, FileText, BarChart2,
  FolderOpen, Settings, Bot, Send, Upload, Disc3,
  CalendarDays, Newspaper, CheckSquare, LogOut,
  ChevronDown, ChevronUp, TrendingUp, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Suspense } from 'react'

interface Artist { id: string; name: string; role: string }

interface Props {
  artists: Artist[]
  userEmail: string
}

const NAV_GROUPS = [
  {
    label: 'Booking',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/dashboard/briefing', label: 'Briefing', icon: Zap },
      { href: '/dashboard/deals', label: 'Deals', icon: Handshake },
      { href: '/dashboard/outreach', label: 'Outreach', icon: Send },
      { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    label: 'Artists',
    items: [
      { href: '/dashboard/artists', label: 'Roster', icon: Users },
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
      { href: '/dashboard/catalog', label: 'Catalog', icon: Disc3 },
      { href: '/dashboard/spotify', label: 'Spotify', icon: Music2 },
      { href: '/dashboard/label', label: 'Label', icon: Disc3 },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/dashboard/content', label: 'Content', icon: CalendarDays },
      { href: '/dashboard/epk', label: 'Press Kit', icon: Newspaper },
      { href: '/dashboard/documents', label: 'Documents', icon: FolderOpen },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/dashboard/finance', label: 'Finance', icon: DollarSign },
      { href: '/dashboard/revenue', label: 'Revenue Engine', icon: TrendingUp },
      { href: '/dashboard/publishing', label: 'Publishing', icon: Music2 },
      { href: '/dashboard/contracts', label: 'Contracts', icon: FileText },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/dashboard/gmail', label: 'Gmail', icon: Mail },
      { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
      { href: '/dashboard/import', label: 'Import', icon: Upload },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
]

function DashboardNavInner({ artists, userEmail }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showArtistPicker, setShowArtistPicker] = useState(false)

  const selectedArtistId = searchParams.get('artist') ?? artists[0]?.id ?? ''
  const selectedArtist = artists.find(a => a.id === selectedArtistId) ?? artists[0]

  function switchArtist(artistId: string) {
    setShowArtistPicker(false)
    const params = new URLSearchParams(searchParams.toString())
    params.set('artist', artistId)
    // Navigate to dashboard overview with the new artist
    router.push(`/dashboard?${params.toString()}`)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="w-60 border-r flex flex-col shrink-0 bg-background">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b">
        <span className="font-bold text-lg tracking-tight">
          TEN<span className="text-primary">x10</span>
        </span>
      </div>

      {/* Artist Switcher */}
      {artists.length > 0 && (
        <div className="px-3 py-2 border-b">
          <button
            onClick={() => setShowArtistPicker(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Music2 className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="truncate">{selectedArtist?.name ?? 'Select Artist'}</span>
            </div>
            {showArtistPicker
              ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            }
          </button>
          {showArtistPicker && (
            <div className="mt-1 rounded-md border bg-background shadow-md overflow-hidden">
              {artists.map(a => (
                <button
                  key={a.id}
                  onClick={() => switchArtist(a.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm transition-colors',
                    a.id === selectedArtistId
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  {a.name}
                  <span className="text-[10px] opacity-60 ml-1 capitalize">({a.role})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="px-4 mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {group.label}
            </p>
            {group.items.map(({ href, label, icon: Icon, exact }) => (
              <Link
                key={href}
                href={selectedArtistId ? `${href}?artist=${selectedArtistId}` : href}
                className={cn(
                  'flex items-center gap-3 px-4 py-1.5 text-sm font-medium rounded-md mx-2 transition-colors',
                  isActive(href, exact)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom: AI + User */}
      <div className="border-t p-2 space-y-1">
        <Link
          href="/dashboard/agent"
          className={cn(
            'flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            isActive('/dashboard/agent')
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <Bot className="h-4 w-4" />
          Ask Xai
        </Link>
        <div className="px-4 py-1">
          <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

export function DashboardNav(props: Props) {
  return (
    <Suspense fallback={
      <aside className="w-60 border-r flex flex-col shrink-0 bg-background">
        <div className="h-14 flex items-center px-4 border-b">
          <span className="font-bold text-lg tracking-tight">TEN<span className="text-primary">x10</span></span>
        </div>
      </aside>
    }>
      <DashboardNavInner {...props} />
    </Suspense>
  )
}
