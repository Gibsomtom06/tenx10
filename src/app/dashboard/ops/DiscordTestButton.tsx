'use client'
import { useState } from 'react'
import { Bell, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function DiscordTestButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
  const [msg, setMsg] = useState('')

  async function test() {
    setState('loading')
    try {
      const res = await fetch('/api/discord/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'approval',
          title: 'Publishing Checklist Ready for Review',
          message: 'The LAB10 Publishing MLC submission list (82 Leigh Bray tracks) is ready. Review and approve before submission.',
          link: 'https://tenx10.co/dashboard/publishing',
          items: [
            '82 Leigh Bray/DirtySnatcha tracks need MLC registration under LAB10 Publishing',
            '54 DSR Records Publishing tracks already registered at MLC (confirmed in DB)',
            'WHOiSEE PRO affiliation unknown — needs clarification',
            'Dark Matter ASCAP IPI not yet in DB',
          ],
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setState('ok')
        setMsg('Pinged Discord')
      } else {
        setState('err')
        setMsg(json.error ?? `Error ${res.status}`)
      }
    } catch (e: any) {
      setState('err')
      setMsg(e.message ?? 'Network error')
    }
    setTimeout(() => setState('idle'), 6000)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={test}
        disabled={state === 'loading'}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'loading' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bell className="h-3 w-3" />}
        Test Discord Ping
      </button>
      {state === 'ok' && <span className="flex items-center gap-1 text-xs text-green-500"><CheckCircle2 className="h-3 w-3" /> {msg}</span>}
      {state === 'err' && <span className="flex items-center gap-1 text-xs text-red-400"><AlertCircle className="h-3 w-3" /> {msg}</span>}
    </div>
  )
}
