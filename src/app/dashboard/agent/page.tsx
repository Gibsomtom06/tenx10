'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const AGENT_PATTERNS = [
  { pattern: /Xai|Artist Manager|Strategist/i,   name: 'Xai',              emoji: '⬡', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
  { pattern: /Booking Agent|Deal Maker/i,         name: 'Booking Agent',    emoji: '🎤', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)'  },
  { pattern: /RJ Jackson|CMO|COO/i,               name: 'RJ Jackson — CMO', emoji: '📣', color: '#f472b6', bg: 'rgba(244,114,182,0.08)' },
  { pattern: /Social Media|Algorithm/i,           name: 'Social Media',     emoji: '📱', color: '#fb923c', bg: 'rgba(251,146,60,0.08)'  },
  { pattern: /Release Agent|Launch/i,             name: 'Release Agent',    emoji: '🚀', color: '#4ade80', bg: 'rgba(74,222,128,0.08)' },
]

function getAgentStyle(content: string) {
  return AGENT_PATTERNS.find(a => a.pattern.test(content.slice(0, 120)))
    ?? { name: 'Xai', emoji: '⬡', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' }
}

function renderSpans(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

function MessageContent({ content }: { content: string }) {
  return (
    <div className="space-y-0.5 text-sm leading-relaxed">
      {content.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />
        if (line.match(/^#{1,3}\s/)) return <div key={i} className="font-semibold text-xs uppercase tracking-wider mt-2 mb-1 opacity-60">{renderSpans(line.replace(/^#+\s/, ''))}</div>
        if (line.startsWith('- ') || line.startsWith('• ') || line.match(/^\s+[-•]/)) {
          return <div key={i} className="flex gap-2 ml-1"><span className="opacity-30 shrink-0 mt-0.5 text-xs">—</span><span>{renderSpans(line.replace(/^(\s*[-•]\s)/, ''))}</span></div>
        }
        return <p key={i}>{renderSpans(line)}</p>
      })}
    </div>
  )
}

const QUICK_PROMPTS = [
  'What needs my attention today?',
  'Where are we leaving money on the table?',
  'Evaluate the current tour routing',
  'What streaming markets should we target next?',
  'Build a PR plan for the next release',
  'Run a full check on DirtySnatcha',
]

export default function DashboardAgentPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, conversationId }),
      })
      const data = await res.json() as { reply: string; conversationId: string }
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      if (data.conversationId) setConversationId(data.conversationId)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection dropped. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setMessages([])
    setConversationId(null)
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="shrink-0 p-4 border-b flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <span className="text-[10px] font-black text-violet-400">⬡</span>
          </div>
          <div>
            <h1 className="font-semibold text-sm leading-none">Xai — AI Management Team</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Gemini · context-aware</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={reset} title="New session">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {messages.length === 0 && !loading && (
          <div className="space-y-4">
            <div className="flex gap-2.5 max-w-[90%]">
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs mt-0.5" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
                ⬡
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium mb-1 tracking-wide text-violet-400">XAI</div>
                <div className="rounded-2xl rounded-tl-sm px-3 py-2.5" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.1)' }}>
                  <p className="text-sm leading-relaxed">What do you need?</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 ml-9">
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => send(p)} className="text-xs text-primary border border-primary/25 rounded-full px-3 py-1.5 hover:bg-primary/10 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.role === 'assistant') {
            const agent = getAgentStyle(msg.content)
            return (
              <div key={i} className="flex gap-2.5 max-w-[90%]">
                <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs mt-0.5" style={{ background: agent.bg, border: `1px solid ${agent.color}20` }}>
                  {agent.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium mb-1 tracking-wide" style={{ color: agent.color }}>
                    {agent.name.toUpperCase()}
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-3 py-2.5" style={{ background: agent.bg, border: `1px solid ${agent.color}15` }}>
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
              ⬡
            </div>
            <div>
              <div className="text-[10px] font-medium mb-1 tracking-wide text-violet-400">XAI</div>
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

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-4 border-t flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Talk to Xai..."
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
