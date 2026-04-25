'use client'

import { useEffect, useState } from 'react'
import { Mail, RefreshCw, Zap, AlertTriangle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface GmailMessage {
  id: string
  subject: string
  from: string
  date: string
  snippet: string
  isLikelyOffer: boolean
}

export function BriefingInbox({ gmailConnected }: { gmailConnected: boolean }) {
  const [messages, setMessages] = useState<GmailMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<'disconnected' | 'error' | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{ created: number; scanned: number } | null>(null)

  useEffect(() => {
    if (!gmailConnected) { setError('disconnected'); return }
    setLoading(true)
    fetch('/api/gmail/messages')
      .then(r => {
        if (r.status === 401 || r.status === 403) { setError('disconnected'); return null }
        if (!r.ok) { setError('error'); return null }
        return r.json()
      })
      .then(d => { if (d) setMessages((d.messages ?? []).slice(0, 6)) })
      .catch(() => setError('error'))
      .finally(() => setLoading(false))
  }, [gmailConnected])

  async function scanForOffers() {
    setScanning(true)
    try {
      const res = await fetch('/api/gmail/ingest', { method: 'POST' })
      const data = await res.json()
      setScanResult({ created: data.created ?? 0, scanned: data.scanned ?? 0 })
    } catch { /* non-fatal */ }
    finally { setScanning(false) }
  }

  if (error === 'disconnected') {
    return (
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Gmail not connected</p>
          <p className="text-xs text-muted-foreground mt-0.5">Connect Gmail to see your inbox here and auto-detect incoming offers.</p>
        </div>
        <a href="/api/gmail/connect" className="shrink-0 text-xs px-3 py-1.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors font-medium">
          Connect →
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        Loading inbox…
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" /> Inbox
        </p>
        <div className="flex items-center gap-2">
          {scanResult && (
            <span className="text-xs text-muted-foreground">
              {scanResult.created > 0 ? `${scanResult.created} new offer${scanResult.created !== 1 ? 's' : ''} found` : `${scanResult.scanned} scanned — no new offers`}
            </span>
          )}
          <button
            onClick={scanForOffers}
            disabled={scanning}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {scanning ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
            {scanning ? 'Scanning…' : 'Scan for offers'}
          </button>
          <Link href="/dashboard/gmail" className="text-xs text-primary hover:underline flex items-center gap-1">
            view all <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No messages — hit &quot;Scan for offers&quot; to check your inbox.</p>
      ) : (
        messages.map(msg => (
          <Link key={msg.id} href="/dashboard/gmail" className="block">
            <div className={cn(
              'flex items-start gap-3 p-3 rounded-xl border transition-colors',
              msg.isLikelyOffer
                ? 'bg-blue-500/5 border-blue-500/15 hover:border-blue-500/30'
                : 'bg-card border-border hover:bg-muted/40'
            )}>
              <Mail className={cn('h-4 w-4 shrink-0 mt-0.5', msg.isLikelyOffer ? 'text-blue-500' : 'text-muted-foreground')} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{msg.subject}</p>
                  {msg.isLikelyOffer && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium border border-blue-500/20">offer</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{msg.from} · {msg.date}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{msg.snippet}</p>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  )
}
