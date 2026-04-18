'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  'What shows do I have coming up?',
  'What tasks do I need to do this week?',
  'How many streams does my catalog have?',
  'When is my next confirmed show?',
]

export default function ArtistAgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "I'm X — your artist management AI. Ask me about your shows, tasks, catalog, or anything else going on with your career.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const userMsg = (text ?? input).trim()
    if (!userMsg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, conversationId }),
      })
      const { reply, conversationId: newId } = await res.json()
      setConversationId(newId)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't connect. Try again in a moment." }])
    } finally {
      setLoading(false)
    }
  }

  const showQuickPrompts = messages.length <= 1

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-xs font-black text-primary-foreground">X</span>
          </div>
          <div>
            <h1 className="font-bold leading-none">Ask X</h1>
            <p className="text-xs text-muted-foreground">Your AI artist manager</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-3', msg.role === 'user' && 'justify-end')}>
            {msg.role === 'assistant' && (
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground font-black">X</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                'rounded-2xl px-4 py-2.5 text-sm max-w-[80%] whitespace-pre-wrap',
                msg.role === 'assistant'
                  ? 'bg-muted rounded-tl-sm'
                  : 'bg-primary text-primary-foreground rounded-tr-sm'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground font-black">X</AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-1.5">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse [animation-delay:200ms]">●</span>
              <span className="animate-pulse [animation-delay:400ms]">●</span>
            </div>
          </div>
        )}

        {showQuickPrompts && !loading && (
          <div className="space-y-2 mt-2">
            {QUICK_PROMPTS.map(prompt => (
              <button
                key={prompt}
                onClick={() => send(prompt)}
                className="block w-fit text-left text-xs text-primary border border-primary/30 rounded-full px-3 py-1.5 hover:bg-primary/10 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t shrink-0 flex gap-2">
        <Input
          placeholder="Ask about your shows, tasks, catalog..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          className="text-sm"
        />
        <Button size="icon" onClick={() => send()} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
