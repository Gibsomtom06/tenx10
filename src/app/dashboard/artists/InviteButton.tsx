'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Mail, Copy, CheckCircle2, Send } from 'lucide-react'

interface Props {
  artistId: string
  artistName: string
  managerName: string
  existingEmail?: string
  alreadyLinked?: boolean
}

export default function InviteButton({
  artistId,
  artistName,
  managerName,
  existingEmail,
  alreadyLinked,
}: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(existingEmail ?? '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ joinUrl: string; emailSent: boolean } | null>(null)

  if (alreadyLinked) {
    return (
      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Portal active
      </div>
    )
  }

  async function sendInvite() {
    if (!email || !email.includes('@')) { toast.error('Enter a valid email'); return }
    setLoading(true)
    const res = await fetch('/api/onboarding/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artistId, artistEmail: email, artistName, managerName }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to send invite')
      return
    }

    setResult({ joinUrl: data.joinUrl, emailSent: data.emailSent })
    if (data.emailSent) toast.success(`Invite sent to ${email}`)
    else toast.success('Invite created — copy the link below')
  }

  if (result) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-green-600 dark:text-green-400">
          {result.emailSent ? `Sent to ${email}` : 'Link ready'}
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(result.joinUrl).then(() => toast.success('Copied'))}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Copy className="h-3 w-3" /> Copy link
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1 text-xs"
      >
        <Mail className="h-3.5 w-3.5" />
        Invite
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="email"
        placeholder="artist@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && sendInvite()}
        className="h-7 text-xs w-44"
        autoFocus
      />
      <Button size="sm" className="h-7 text-xs gap-1" onClick={sendInvite} disabled={loading}>
        <Send className="h-3 w-3" />
        {loading ? '...' : 'Send'}
      </Button>
      <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
    </div>
  )
}
