'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { IngestPhase, IngestState, ArtistData } from '@/app/api/ingest/route'

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// ─────────────────────────────────────────────────────────────────
// Agent Config
// ─────────────────────────────────────────────────────────────────

const AGENT_PATTERNS = [
  { pattern: /Artist Manager|Xai/i,  name: 'Xai — Artist Manager',  emoji: '⬡', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
  { pattern: /Booking Agent|Deal Maker/i,   name: 'Booking Agent',   emoji: '🎤', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)'  },
  { pattern: /International/i,   name: 'Intl. Booking',   emoji: '🌍', color: '#22d3ee', bg: 'rgba(34,211,238,0.08)'  },
  { pattern: /RJ Jackson|CMO|COO/i,  name: 'RJ Jackson — CMO',      emoji: '📣', color: '#f472b6', bg: 'rgba(244,114,182,0.08)' },
  { pattern: /Social Media|Algorithm/i, name: 'Social Media',        emoji: '📱', color: '#fb923c', bg: 'rgba(251,146,60,0.08)'  },
  { pattern: /PR Manager/i,      name: 'PR Manager',      emoji: '📰', color: '#facc15', bg: 'rgba(250,204,21,0.08)'  },
  { pattern: /Release Agent|Launch/i, name: 'Release Agent',         emoji: '🚀', color: '#4ade80', bg: 'rgba(74,222,128,0.08)' },
]

function getAgentStyle(content: string) {
  const match = AGENT_PATTERNS.find(a => a.pattern.test(content.slice(0, 100)))
  return match ?? { name: 'Xai', emoji: '⬡', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' }
}

// ─────────────────────────────────────────────────────────────────
// Text Renderer
// ─────────────────────────────────────────────────────────────────

function renderSpans(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-0.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />
        if (line.match(/^#{1,3}\s/)) return <div key={i} className="font-semibold text-xs uppercase tracking-wider mt-2 mb-1 opacity-60">{renderSpans(line.replace(/^#+\s/, ''))}</div>
        if (line.startsWith('- ') || line.startsWith('• ') || line.match(/^\s+[-•]/)) {
          const text = line.replace(/^(\s*[-•]\s)/, '')
          return <div key={i} className="flex gap-2 ml-1"><span className="opacity-30 shrink-0 mt-0.5 text-xs">—</span><span>{renderSpans(text)}</span></div>
        }
        return <p key={i}>{renderSpans(line)}</p>
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Phase Config
// ─────────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<IngestPhase, string> = {
  intro: 'Introduction',
  collect: 'Collecting Info',
  research: 'Running Research',
  questions: 'Questions',
  brief: 'Phase 1 Brief',
}

// ─────────────────────────────────────────────────────────────────
// Quick Prompts
// ─────────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  'Run a full ingest on DirtySnatcha',
  'What does the team need from me this week?',
  'Evaluate the current tour routing and flag any routing gaps',
  'Where are we leaving money on the table right now?',
  'What streaming markets should we target next?',
  'Build a PR plan for the next release',
]

// ─────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────

export default function DashboardAgentPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<IngestPhase>('intro')
  const [state, setState] = useState<IngestState>({
    phase: 'intro',
    artistData: {} as ArtistData,
    researchComplete: false,
  })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [history, setHistory] = useState<Message[]>([])
  const [initialized, setInitialized] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const initialize = useCallback(async () => {
    if (initialized) return
    setInitialized(true)
    setLoading(true)
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '__init__', history: [], state: { phase: 'intro', artistData: {}, researchComplete: false } }),
      })
      const data = await res.json() as { reply: string; state: IngestState; sessionId?: string; history: Message[] }
      setMessages([{ role: 'assistant', content: data.reply }])
      setHistory(data.history ?? [{ role: 'assistant', content: data.reply }])
      setState(data.state)
      setPhase(data.state.phase)
      if (data.sessionId) setSessionId(data.sessionId)
    } catch {
      setMessages([{ role: 'assistant', content: "**🎯 Artist Manager:** Connection issue. Refresh to try again." }])
    } finally {
      setLoading(false)
    }
  }, [initialized])

  useEffect(() => { initialize() }, [initialize])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history, state, sessionId }),
      })
      const data = await res.json() as { reply: string; state: IngestState; sessionId?: string; history: Message[] }
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      setHistory(data.history ?? [...history, userMsg, { role: 'assistant', content: data.reply }])
      setState(data.state)
      setPhase(data.state.phase)
      if (data.sessionId) setSessionId(data.sessionId)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "**🎯 Artist Manager:** Connection dropped. Try again." }])
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setMessages([])
    setHistory([])
    setState({ phase: 'intro', artistData: {} as ArtistData, researchComplete: false })
    setPhase('intro')
    setSessionId(null)
    setInitialized(false)
  }

  const showQuickPrompts = messages.length <= 1 && !loading

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="shrink-0 p-4 border-b flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <span className="text-[10px] font-black text-violet-400">10</span>
          </div>
          <div>
            <h1 className="font-semibold text-sm leading-none">Xai — AI Management Team</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">{PHASE_LABELS[phase]}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={reset} title="New session">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {messages.map((msg, i) => {
          if (msg.role === 'assistant') {
            const agent = getAgentStyle(msg.content)
            return (
              <div key={i} className="flex gap-2.5 max-w-[90%]">
                <div
                  className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs mt-0.5"
                  style={{ background: agent.bg, border: `1px solid ${agent.color}20` }}
                >
                  {agent.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium mb-1 tracking-wide" style={{ color: agent.color }}>
                    {agent.name.toUpperCase()}
                  </div>
                  <div
                    className="rounded-2xl rounded-tl-sm px-3 py-2.5"
                    style={{ background: agent.bg, border: `1px solid ${agent.color}15` }}
                  >
                    <MessageContent content={msg.content} />
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={i} className="flex justify-end">
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2.5 text-sm max-w-[80%] whitespace-pre-wrap">
                {msg.content}
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
              🎯
            </div>
            <div>
              <div className="text-[10px] font-medium mb-1 tracking-wide text-violet-400">ARTIST MANAGER</div>
              <div className="rounded-2xl rounded-tl-sm px-3 py-2.5" style={{ background: 'rgba(167,139,250,0.08)' }}>
                <div className="flex items-center gap-1 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {showQuickPrompts && (
          <div className="flex flex-wrap gap-2 mt-2">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => send(p)}
                className="text-xs text-primary border border-primary/25 rounded-full px-3 py-1.5 hover:bg-primary/10 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Research notice */}
      {phase === 'research' && loading && (
        <div className="px-4 py-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Pulling data from Supabase, Spotify, Instagram, and website...
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 p-4 border-t flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder={phase === 'intro' ? "Artist name to start..." : phase === 'collect' ? "Spotify, Instagram, website..." : "Talk to the team..."}
          rows={1}
          disabled={loading}
          className="text-sm resize-none min-h-[40px] max-h-[100px]"
        />
        <Button size="icon" onClick={() => send()} disabled={loading || !input.trim()} className="shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
