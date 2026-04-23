'use client'

import { useState } from 'react'
import { Mail, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function InboxScanner({ gmailConnected }: { gmailConnected: boolean }) {
  const [state, setState] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ created: number; scanned: number } | null>(null)
  const router = useRouter()

  async function scan() {
    if (!gmailConnected) {
      window.location.href = '/api/gmail/connect'
      return
    }
    setState('scanning')
    try {
      const res = await fetch('/api/gmail/ingest', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unknown error')
      setResult({ created: data.created, scanned: data.scanned })
      setState('done')
      if (data.created > 0) {
        setTimeout(() => router.refresh(), 1000)
      }
    } catch (err) {
      console.error(err)
      setState('error')
    }
  }

  return (
    <button
      onClick={scan}
      disabled={state === 'scanning'}
      className={cn(
        'flex items-center gap-2 text-xs px-3 py-1.5 rounded-md transition-all border font-medium',
        state === 'scanning' && 'opacity-60 cursor-wait',
        state === 'done' && result?.created === 0 && 'border-muted-foreground/30 text-muted-foreground',
        state === 'done' && result && result.created > 0 && 'border-green-500/40 text-green-600 dark:text-green-400 bg-green-500/5',
        state === 'error' && 'border-red-400/40 text-red-500',
        (state === 'idle' || !state) && 'border-border hover:border-primary/40 text-muted-foreground hover:text-foreground',
      )}
    >
      {state === 'scanning' && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
      {state === 'done' && result?.created && result.created > 0 && <CheckCircle2 className="h-3.5 w-3.5" />}
      {state === 'done' && result?.created === 0 && <Mail className="h-3.5 w-3.5" />}
      {state === 'error' && <AlertTriangle className="h-3.5 w-3.5" />}
      {state === 'idle' && <Mail className="h-3.5 w-3.5" />}

      {state === 'idle' && 'Scan Gmail for Offers'}
      {state === 'scanning' && 'Scanning…'}
      {state === 'done' && result?.created === 0 && `Scanned ${result.scanned} — no new offers`}
      {state === 'done' && result && result.created > 0 && `${result.created} new offer${result.created !== 1 ? 's' : ''} added!`}
      {state === 'error' && 'Scan failed — retry'}
    </button>
  )
}
