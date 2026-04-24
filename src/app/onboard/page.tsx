'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, FileText, Plus } from 'lucide-react'
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

const AGENT_PATTERNS: Array<{ pattern: RegExp; name: string; emoji: string; color: string; bg: string }> = [
  { pattern: /\bXai\b/i,                 name: 'Xai',               emoji: '🎯', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { pattern: /Artist Manager/i,          name: 'Xai',               emoji: '🎯', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { pattern: /Booking/i,                 name: 'Booking',           emoji: '🎤', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  { pattern: /International/i,           name: 'Intl. Booking',     emoji: '🌍', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)'  },
  { pattern: /Tour Manager/i,            name: 'Tour Manager',      emoji: '🚌', color: '#fb923c', bg: 'rgba(251,146,60,0.1)'  },
  { pattern: /Social/i,                  name: 'Social',            emoji: '📱', color: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
  { pattern: /PR/i,                      name: 'PR',                emoji: '📰', color: '#facc15', bg: 'rgba(250,204,21,0.1)'  },
  { pattern: /Label/i,                   name: 'Label',             emoji: '🏷️', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
]

function getAgentStyle(content: string) {
  const match = AGENT_PATTERNS.find(a => a.pattern.test(content.slice(0, 60)))
  return match ?? { name: 'Xai', emoji: '🎯', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' }
}

// ─────────────────────────────────────────────────────────────────
// Phase Config
// ─────────────────────────────────────────────────────────────────

const PHASES: { id: IngestPhase; label: string }[] = [
  { id: 'intro',     label: 'Intro'      },
  { id: 'collect',   label: 'Collect'    },
  { id: 'research',  label: 'Research'   },
  { id: 'questions', label: 'Questions'  },
  { id: 'brief',     label: 'Brief'      },
]

const PHASE_INDEX: Record<IngestPhase, number> = {
  intro: 0, collect: 1, research: 2, questions: 3, brief: 4,
}

// ─────────────────────────────────────────────────────────────────
// Text Renderer (safe, no dangerouslySetInnerHTML)
// ─────────────────────────────────────────────────────────────────

function renderSpans(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white/90">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      nodes.push(<div key={i} className="h-1" />)
    } else if (line.match(/^#{1,3}\s/)) {
      nodes.push(
        <div key={i} className="font-semibold text-white/80 mt-3 mb-1 text-sm uppercase tracking-wide">
          {renderSpans(line.replace(/^#+\s/, ''))}
        </div>
      )
    } else if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('  - ')) {
      const indent = line.startsWith('  - ')
      const text = line.replace(/^(\s*[-•]\s)/, '')
      nodes.push(
        <div key={i} className={`flex gap-2 ${indent ? 'ml-5' : 'ml-2'}`}>
          <span className="text-white/30 shrink-0 mt-0.5 text-xs">—</span>
          <span className="text-sm leading-relaxed">{renderSpans(text)}</span>
        </div>
      )
    } else if (line.match(/^\|/) ) {
      // Table row
      const cells = line.split('|').filter(Boolean).map(c => c.trim())
      nodes.push(
        <div key={i} className="flex gap-4 text-xs font-mono text-white/60 my-0.5 pl-2">
          {cells.map((cell, ci) => <span key={ci} className="min-w-[80px]">{renderSpans(cell)}</span>)}
        </div>
      )
    } else {
      nodes.push(
        <p key={i} className="text-sm leading-relaxed">
          {renderSpans(line)}
        </p>
      )
    }
    i++
  }

  return <div className="space-y-0.5">{nodes}</div>
}

// ─────────────────────────────────────────────────────────────────
// Agent Bubble
// ─────────────────────────────────────────────────────────────────

function AgentMessage({ content }: { content: string }) {
  const agent = getAgentStyle(content)
  return (
    <div className="flex gap-3 max-w-[88%]">
      <div
        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm mt-0.5 font-semibold"
        style={{ background: agent.bg, border: `1px solid ${agent.color}22` }}
      >
        {agent.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium mb-1.5 tracking-wide" style={{ color: agent.color }}>
          {agent.name.toUpperCase()}
        </div>
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3 text-white/80"
          style={{ background: agent.bg, border: `1px solid ${agent.color}18` }}
        >
          <MessageContent content={content} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Thinking Indicator
// ─────────────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div className="flex gap-3 max-w-[88%]">
      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
        🎯
      </div>
      <div>
        <div className="text-[11px] font-medium mb-1.5 tracking-wide text-violet-400">XAI</div>
        <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
          <div className="flex items-center gap-1.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────

export default function OnboardPage() {
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
  const [savedArtistId, setSavedArtistId] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Kick off with team intro
  const initialize = useCallback(async () => {
    if (initialized) return
    setInitialized(true)
    setLoading(true)

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '__init__',
          history: [],
          state: { phase: 'intro', artistData: {}, researchComplete: false },
        }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json() as { reply: string; state: IngestState; sessionId?: string; history: Message[] }
      setMessages([{ role: 'assistant', content: data.reply }])
      setHistory(data.history ?? [{ role: 'assistant', content: data.reply }])
      setState(data.state)
      setPhase(data.state.phase)
      if (data.sessionId) setSessionId(data.sessionId)
    } catch {
      setMessages([{ role: 'assistant', content: "**🎯 Artist Manager:** We ran into a connection issue. Refresh the page and we'll pick it back up." }])
    } finally {
      setLoading(false)
    }
  }, [initialized])

  useEffect(() => {
    if (!initialized) initialize()
  }, [initialized, initialize])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          state,
          sessionId,
        }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json() as { reply: string; state: IngestState; sessionId?: string; history: Message[]; savedArtistId?: string }
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      setHistory(data.history ?? [...history, userMsg, { role: 'assistant', content: data.reply }])
      setState(data.state)
      setPhase(data.state.phase)
      if (data.sessionId) setSessionId(data.sessionId)
      if (data.savedArtistId) setSavedArtistId(data.savedArtistId)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "**🎯 Artist Manager:** Connection dropped. Try again in a moment." }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  async function generateBrief() {
    if (loading) return
    setLoading(true)
    const userMsg: Message = { role: 'user', content: 'Generate my brief.' }
    setMessages(prev => [...prev, userMsg])
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '__brief__', history, state, sessionId }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json() as { reply: string; state: IngestState; sessionId?: string; history: Message[]; savedArtistId?: string }
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      setHistory(data.history ?? [...history, userMsg, { role: 'assistant', content: data.reply }])
      setState(data.state)
      setPhase(data.state.phase)
      if (data.savedArtistId) setSavedArtistId(data.savedArtistId)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "**🎯 Artist Manager:** Couldn't generate brief. Try again." }])
    } finally {
      setLoading(false)
    }
  }

  function startNewArtist() {
    setMessages([])
    setInput('')
    setPhase('intro')
    setState({ phase: 'intro', artistData: {} as ArtistData, researchComplete: false })
    setSessionId(null)
    setHistory([])
    setInitialized(false)
    setSavedArtistId(null)
  }

  const phaseIdx = PHASE_INDEX[phase] ?? 0

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col" style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>

      {/* Header */}
      <div className="shrink-0 border-b border-white/8 bg-[#0a0a0f]/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-6">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <span className="text-xs font-black text-violet-400">10</span>
            </div>
            <div>
              <div className="text-sm font-semibold leading-none text-white/90">TENx10 Management</div>
              <div className="text-[11px] text-white/40 mt-0.5">7-Agent Specialist Team</div>
            </div>
          </div>

          {/* Phase Progress */}
          <div className="hidden sm:flex items-center gap-1">
            {PHASES.map((p, i) => (
              <div key={p.id} className="flex items-center gap-1">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                  i < phaseIdx ? 'text-white/40' :
                  i === phaseIdx ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' :
                  'text-white/20'
                }`}>
                  {i < phaseIdx && <span className="text-[8px]">✓</span>}
                  {p.label}
                </div>
                {i < PHASES.length - 1 && (
                  <div className={`w-3 h-px ${i < phaseIdx ? 'bg-white/20' : 'bg-white/8'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Mobile phase label */}
          <div className="sm:hidden text-xs text-violet-400 font-medium">{PHASES[phaseIdx]?.label}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {messages.map((msg, i) => (
            msg.role === 'assistant' ? (
              <AgentMessage key={i} content={msg.content} />
            ) : (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] bg-violet-600/20 border border-violet-500/20 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white/80 whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            )
          ))}

          {loading && <ThinkingDots />}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Research notice */}
      {phase === 'research' && loading && (
        <div className="border-t border-white/5 bg-[#0d0d15]">
          <div className="max-w-3xl mx-auto px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Loader2 className="w-3 h-3 animate-spin" />
              Running research across Supabase, Spotify, Instagram, and website...
            </div>
          </div>
        </div>
      )}

      {/* Brief action bar — appears when team is done asking questions */}
      {phase === 'questions' && !loading && (
        <div className="border-t border-white/5 bg-[#0d0d15]">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-xs text-white/40">Ready to wrap up? Generate the full Phase 1 brief for this artist.</p>
            <button
              onClick={generateBrief}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              Generate My Brief
            </button>
          </div>
        </div>
      )}

      {/* Post-brief action bar */}
      {phase === 'brief' && (
        <div className="border-t border-white/5 bg-[#0d0d15]">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-xs text-white/40">
              {savedArtistId ? 'Artist saved to your roster.' : 'Brief complete.'}
            </p>
            <div className="flex items-center gap-2">
              {savedArtistId && (
                <a
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-white/20 text-xs font-semibold transition-colors"
                >
                  View Dashboard
                </a>
              )}
              <button
                onClick={startNewArtist}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Artist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-white/8 bg-[#0a0a0f]/95 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  phase === 'intro' ? "Type your artist name to get started..." :
                  phase === 'collect' ? "Drop your Spotify, Instagram, website..." :
                  phase === 'questions' ? "Answer the team's questions..." :
                  "Talk to the team..."
                }
                rows={1}
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 focus:bg-white/8 resize-none transition-all disabled:opacity-40"
                style={{ minHeight: '48px', maxHeight: '120px', lineHeight: '1.5' }}
                onInput={e => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
                }}
              />
            </div>
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-white/20 mt-2 text-center">
            TENx10 Management Team · Phase 1 Artist Ingest · Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
