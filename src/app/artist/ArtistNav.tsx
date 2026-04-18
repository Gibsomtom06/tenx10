'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GitBranch, Calendar, Music2, FileText, Bot,
  LogOut, LayoutDashboard, Disc3, Send, ClipboardList,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { MemberRole } from '@/lib/supabase/artist-access'

interface NavItem { href: string; label: string; icon: React.ElementType; exact?: boolean }

const AGENT_NAV: NavItem[] = [
  { href: '/artist/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/artist/booking', label: 'Booking Tools', icon: Send },
  { href: '/artist/ops', label: 'Show Ops', icon: ClipboardList },
  { href: '/artist/advance', label: 'Advances', icon: FileText },
]

const ARTIST_NAV: NavItem[] = [
  { href: '/artist', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/artist/shows', label: 'My Shows', icon: Calendar },
  { href: '/artist/ops', label: 'Show Ops', icon: ClipboardList },
  { href: '/artist/advance', label: 'Advances', icon: FileText },
  { href: '/artist/catalog', label: 'Catalog', icon: Disc3 },
  { href: '/artist/releases', label: 'Releases', icon: Music2 },
]

const ADMIN_NAV: NavItem[] = [
  { href: '/artist', label: 'Artist Home', icon: LayoutDashboard, exact: true },
  { href: '/artist/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/artist/booking', label: 'Booking Tools', icon: Send },
  { href: '/artist/ops', label: 'Show Ops', icon: ClipboardList },
  { href: '/artist/advance', label: 'Advances', icon: FileText },
  { href: '/artist/catalog', label: 'Catalog', icon: Disc3 },
  { href: '/artist/releases', label: 'Releases', icon: Music2 },
]

interface Props {
  role: MemberRole
  artistName: string
  memberName: string
}

export function ArtistNav({ role, artistName, memberName }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navItems = role === 'admin' ? ADMIN_NAV : role === 'agent' ? AGENT_NAV : ARTIST_NAV

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="w-56 border-r flex flex-col shrink-0">
      <div className="h-14 flex items-center px-4 border-b gap-2">
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Music2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight truncate">{artistName}</p>
          <p className="text-[10px] text-muted-foreground capitalize">{role}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md mx-2 transition-colors',
              isActive(href, exact)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-2 space-y-1">
        {(role === 'artist' || role === 'admin') && (
          <Link
            href="/artist/agent"
            className={cn(
              'flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              isActive('/artist/agent')
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Bot className="h-4 w-4" />
            Ask X
          </Link>
        )}
        {role === 'admin' && (
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Manager Dashboard
          </Link>
        )}
        <div className="px-4 py-1">
          <p className="text-[10px] text-muted-foreground truncate">{memberName}</p>
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
