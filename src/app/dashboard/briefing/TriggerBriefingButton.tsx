'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function TriggerBriefingButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
  const [msg, setMsg] = useState('')

  async function trigger() {
    setState('loading')
    try {
      const res = await fetch('/api/cron/morning-briefing')
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setState('ok')
        setMsg('Briefing sent to Discord + email')
      } else {
        setState('err')
        setMsg(json.error ?? `Error ${res.status}`)
      }
    } catch (e: any) {
      setState('err')
      setMsg(e.message ?? 'Network error')
    }
    setTimeout(() => setState('idle'), 5000)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={trigger}
        disabled={state === 'loading'}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'loading' ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Send className="h-3 w-3" />
        )}
        Send Briefing Now
      </button>
      {state === 'ok' && (
        <span className="flex items-center gap-1 text-xs text-green-500">
          <CheckCircle2 className="h-3 w-3" /> {msg}
        </span>
      )}
      {state === 'err' && (
        <span className="flex items-center gap-1 text-xs text-red-400">
          <AlertCircle className="h-3 w-3" /> {msg}
        </span>
      )}
    </div>
  )
}
