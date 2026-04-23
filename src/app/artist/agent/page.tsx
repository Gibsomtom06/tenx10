'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { IngestPhase, IngestState, ArtistData } from '@/app/api/ingest/route'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const AGENT_PATTERNS = [
  { pattern: /Artist Manager/i,  emoji: '🎯', color: '#a78bfa' },
  { pattern: /Booking Agent/i,   emoji: '🎤', color: '#60a5fa' },
  { pattern: /International/i,   emoji: '🌍', color: '#22d3ee' },
  { pattern: /Tour Manager/i,    emoji: '🚌', color: '#fb923c' },
  { pattern: /Social Media/i,    emoji: '📱', color: '#f472b6' },
  { pattern: /PR Manager/i,      emoji: '📰', color: '#facc15' },
  { pattern: /Label Executive/i, emoji: '🏷️', color: '#4ade80' },
]

function getAgentEmoji(content: string) {
  const match = AGENT_PATTERNS.find(a => a.pattern.test(content.slice(0, 80)))
  return match ?? { emoji: '⬡', color: 'hsl(var(--muted-foreground))' }
}

function renderSpans(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

function MessageContent({ content }: { content: string }) {
  return (
    <div className="space-y-0.5 text-sm leading-relaxed whitespace-pre-wrap">
      {content.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <div key={i} className="flex gap-2 ml-1"><span className="opacity-40 shrink-0 text-xs mt-0.5">—</span><span>{renderSpans(line.slice(2))}</span></div>
        }
        return <p key={i}>{renderSpans(line)}</p>
      })}
    </div>
  )
}

const QUICK_PROMPTS = [
  "What shows do I have coming up?",
  "What tasks do I need this week?",
  "How's my catalog performing?",
  "What's the team working on for me?",
]

export default function ArtistAgentPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [state, setState] = useState<IngestState>({ phase: 'intro', artistData: {} as ArtistData, researchComplete: false })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [history, setHistory] = useState<Message[]>([])
  const [initialized, setInitialized] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

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
      setHistory(data.history ?? [])
      setState(data.state)
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
      if (data.sessionId) setSessionId(data.sessionId)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "**🎯 Artist Manager:** Connection dropped. Try again." }])
    } finally {
      setLoading(false)
    }
  }

  const showQuickPrompts = messages.length <= 1 && !loading

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <span className="text-[10px] font-black text-violet-400">10</span>
          </div>
          <div>
            <h1 className="font-semibold text-sm leading-none">Your Management Team</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">7-agent AI team</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => {
          if (msg.role === 'assistant') {
            const agent = getAgentEmoji(msg.content)
            return (
              <div key={i} className="flex gap-2.5 max-w-[88%]">
                <div
                  className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs mt-0.5"
                  style={{ background: `${agent.color}12`, border: `1px solid ${agent.color}25` }}
                >
                  {agent.emoji}
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2.5 flex-1 min-w-0">
                  <MessageContent content={msg.content} />
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
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)' }}>🎯</div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2.5">
              <div className="flex items-center gap-1 py-0.5">
                {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          </div>
        )}

        {showQuickPrompts && (
          <div className="flex flex-wrap gap-2 mt-2">
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => send(p)} className="text-xs text-primary border border-primary/25 rounded-full px-3 py-1.5 hover:bg-primary/10 transition-colors">
                {p}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Talk to your team..."
          disabled={loading}
          className="text-sm"
        />
        <Button size="icon" onClick={() => send()} disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
