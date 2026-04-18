'use client'

import { useState, useTransition, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { addThreadMessage, parseAttachment, updateShowOps } from '@/app/artist/actions'
import {
  MessageSquare, FileText, Paperclip, Send,
  Loader2, CheckCircle2, Upload, ChevronDown, ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import type { DealThread, DealMessage, DealAttachment } from '@/types/database'
import type { Json } from '@/types/database'

interface Thread extends DealThread {
  messages: DealMessage[]
}

interface Props {
  dealId: string
  dealPoints: Record<string, unknown>
  threads: Thread[]
  attachments: DealAttachment[]
}

const DIRECTION_STYLES: Record<string, string> = {
  inbound: 'bg-muted/50 mr-8',
  outbound: 'bg-primary/10 ml-8',
  internal: 'bg-yellow-500/10 border border-yellow-500/20',
}

const DIRECTION_LABEL: Record<string, string> = {
  inbound: 'Inbound',
  outbound: 'Outbound',
  internal: 'Note',
}

type TabId = 'advance' | 'threads' | 'documents'

export function AdvanceTabs({ dealId, dealPoints, threads, attachments }: Props) {
  const [tab, setTab] = useState<TabId>('advance')
  const [messageBody, setMessageBody] = useState('')
  const [activeThread, setActiveThread] = useState<string>(threads[0]?.id ?? '')
  const [isPending, startTransition] = useTransition()
  const [parsedResults, setParsedResults] = useState<Record<string, Record<string, unknown>>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  async function sendMessage() {
    if (!messageBody.trim() || !activeThread) return
    startTransition(async () => {
      try {
        await addThreadMessage(activeThread, messageBody)
        setMessageBody('')
        toast.success('Note added')
      } catch {
        toast.error('Failed to add note')
      }
    })
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    if (activeThread) formData.append('threadId', activeThread)

    try {
      const res = await fetch(`/api/deals/${dealId}/attachments`, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('File uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  async function handleParse(attachmentId: string) {
    startTransition(async () => {
      try {
        const result = await parseAttachment(attachmentId)
        setParsedResults(prev => ({ ...prev, [attachmentId]: result }))
        toast.success('Document parsed')
      } catch {
        toast.error('Parse failed')
      }
    })
  }

  async function applyParsed(attachmentId: string) {
    const fields = parsedResults[attachmentId]
    if (!fields) return
    startTransition(async () => {
      try {
        await updateShowOps(dealId, fields)
        toast.success('Fields applied to show')
      } catch {
        toast.error('Failed to apply fields')
      }
    })
  }

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'advance', label: 'Advance Sheet', icon: FileText },
    { id: 'threads', label: `Threads (${threads.reduce((n, t) => n + t.messages.length, 0)})`, icon: MessageSquare },
    { id: 'documents', label: `Documents (${attachments.length})`, icon: Paperclip },
  ]

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Advance Sheet tab */}
      {tab === 'advance' && (
        <AdvanceSheetDisplay dealPoints={dealPoints} />
      )}

      {/* Threads tab */}
      {tab === 'threads' && (
        <div className="space-y-4">
          {threads.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No conversation threads yet.</p>
          ) : (
            <>
              {/* Thread selector */}
              <div className="flex gap-2 flex-wrap">
                {threads.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveThread(t.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium capitalize transition-colors ${
                      activeThread === t.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t.type} thread · {t.messages.length} messages
                  </button>
                ))}
              </div>

              {/* Messages */}
              {threads.filter(t => t.id === activeThread).map(thread => (
                <div key={thread.id} className="space-y-3">
                  {thread.messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No messages yet.</p>
                  ) : (
                    thread.messages.map(msg => (
                      <div key={msg.id} className={`rounded-lg p-3 text-sm ${DIRECTION_STYLES[msg.direction] ?? ''}`}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium text-xs">{msg.sender_name}</span>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">{DIRECTION_LABEL[msg.direction]}</Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.body}</p>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </>
          )}

          {/* Add note */}
          <Separator />
          <div className="space-y-2">
            <textarea
              value={messageBody}
              onChange={e => setMessageBody(e.target.value)}
              placeholder="Add a note or internal update..."
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={sendMessage} disabled={isPending || !messageBody.trim()}>
                {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                Add Note
              </Button>
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3 w-3 mr-1" /> Upload File
              </Button>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={uploadFile} />
            </div>
          </div>
        </div>
      )}

      {/* Documents tab */}
      {tab === 'documents' && (
        <div className="space-y-3">
          {attachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No attachments yet.</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3 w-3 mr-1" /> Upload a document
              </Button>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={uploadFile} />
            </div>
          ) : (
            attachments.map(att => {
              const parsed = parsedResults[att.id] ?? (att.parsed_data as Record<string, unknown> | null)
              return (
                <Card key={att.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{att.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {att.mime_type} · {new Date(att.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleParse(att.id)} disabled={isPending}>
                        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Parse'}
                      </Button>
                    </div>

                    {parsed && Object.keys(parsed).length > 0 && (
                      <div className="bg-muted/40 rounded-lg p-3 space-y-1.5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Extracted Fields</p>
                        {Object.entries(parsed)
                          .filter(([, v]) => v !== null && v !== undefined && v !== '')
                          .map(([k, v]) => (
                            <div key={k} className="flex gap-2 text-xs">
                              <span className="text-muted-foreground min-w-28 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                              <span className="font-medium">{String(v)}</span>
                            </div>
                          ))}
                        <Button size="sm" className="mt-2 w-full" onClick={() => applyParsed(att.id)} disabled={isPending}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Apply to Show
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function AdvanceSheetDisplay({ dealPoints }: { dealPoints: Record<string, unknown> }) {
  const pts = dealPoints
  const fields = [
    { label: 'Doors', value: pts.doors as string },
    { label: 'Load In', value: pts.loadIn as string },
    { label: 'Sound Check', value: pts.soundCheck as string },
    { label: 'Set Time', value: pts.setTime as string },
    { label: 'Promoter', value: pts.promoterName as string },
    { label: 'Promoter Email', value: pts.promoterEmail as string },
    { label: 'Promoter Phone', value: pts.promoterPhone as string },
    { label: 'Hotel', value: pts.hotelName as string },
    { label: 'Hotel Address', value: pts.hotelAddress as string },
    { label: 'Hotel Confirmation', value: pts.hotelConfirmation as string },
    { label: 'Ground Contact', value: pts.groundContact as string },
    { label: 'Support Artists', value: pts.support as string },
    { label: 'Ticket Link', value: pts.ticketLink as string },
  ].filter(f => f.value)

  if (fields.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No advance details filled in yet.</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map(({ label, value }) => (
        <div key={label}>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium">{value}</p>
        </div>
      ))}
    </div>
  )
}
