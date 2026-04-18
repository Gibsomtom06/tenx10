'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Handshake, Mail, Music2,
  Calendar, DollarSign, MapPin, FileText, BarChart2,
  FolderOpen, Settings, Bot, Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/artists', label: 'Artists', icon: Users },
  { href: '/dashboard/deals', label: 'Deals', icon: Handshake },
  { href: '/dashboard/outreach', label: 'Outreach', icon: Send },
  { href: '/dashboard/gmail', label: 'Gmail', icon: Mail },
  { href: '/dashboard/spotify', label: 'Spotify', icon: Music2 },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/finance', label: 'Finance', icon: DollarSign },
  { href: '/dashboard/venues', label: 'Venues', icon: MapPin },
  { href: '/dashboard/contracts', label: 'Contracts', icon: FileText },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/documents', label: 'Documents', icon: FolderOpen },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-60 border-r flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b">
          <span className="font-bold text-lg tracking-tight">TEN<span className="text-primary">x10</span></span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md mx-2 transition-colors',
                pathname === href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-2">
          <Link
            href="/dashboard/agent"
            className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Bot className="h-4 w-4" />
            Ask X
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
