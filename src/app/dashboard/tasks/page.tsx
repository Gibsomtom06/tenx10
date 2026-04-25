'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckSquare, Plus, Loader2, Check, Clock, LayoutList, Columns3 } from 'lucide-react'
import { toast } from 'sonner'

type TaskStatus = 'todo' | 'in_progress' | 'done'

interface Task {
  id: string
  title: string
  description: string | null
  type: string
  status: TaskStatus
  due_date: string | null
  artist_id: string | null
  created_at: string
  artists?: { stage_name: string } | null
}

const TYPE_META: Record<string, { label: string; color: string; dot: string }> = {
  contract:    { label: 'contract',    color: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',         dot: 'bg-red-500' },
  email:       { label: 'email',       color: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800', dot: 'bg-orange-500' },
  publishing:  { label: 'publishing',  color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',  dot: 'bg-amber-500' },
  bmi_setlist: { label: 'setlist',     color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
  platform:    { label: 'platform',    color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',      dot: 'bg-blue-500' },
  business:    { label: 'business',    color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  show:        { label: 'show',        color: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800', dot: 'bg-indigo-500' },
  release:     { label: 'release',     color: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800',      dot: 'bg-teal-500' },
  promo:       { label: 'promo',       color: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800',      dot: 'bg-pink-500' },
  general:     { label: 'general',     color: 'bg-muted text-muted-foreground border-border',  dot: 'bg-muted-foreground' },
}

const ALL_TYPES = ['contract', 'email', 'publishing', 'bmi_setlist', 'platform', 'business', 'show', 'release', 'promo', 'general']

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? { label: type, color: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' }
}

const COLUMNS: { status: TaskStatus; label: string; headerColor: string }[] = [
  { status: 'todo',        label: 'To Do',       headerColor: 'border-t-red-500' },
  { status: 'in_progress', label: 'In Progress',  headerColor: 'border-t-yellow-500' },
  { status: 'done',        label: 'Done',         headerColor: 'border-t-green-500' },
]

function isOverdue(due: string | null, status: TaskStatus) {
  if (!due || status === 'done') return false
  return new Date(due + 'T00:00:00') < new Date(new Date().toISOString().split('T')[0] + 'T00:00:00')
}

function isDueSoon(due: string | null, status: TaskStatus) {
  if (!due || status === 'done') return false
  const d = new Date(due + 'T00:00:00')
  const now = new Date()
  const diff = (d.getTime() - now.getTime()) / 86400000
  return diff >= 0 && diff <= 3
}

function TaskCard({ task, onStatusChange, onDelete }: { task: Task; onStatusChange: (id: string, s: TaskStatus) => void; onDelete: (id: string) => void }) {
  const meta = getTypeMeta(task.type)
  const overdue = isOverdue(task.due_date, task.status)
  const soon = isDueSoon(task.due_date, task.status)
  const artist = (task.artists as any)?.stage_name

  return (
    <div className={`rounded-lg border p-3 bg-background text-sm space-y-2 transition-all ${
      task.status === 'done' ? 'opacity-40' : overdue ? 'border-red-400 dark:border-red-700' : 'hover:border-primary/40'
    }`}>
      {/* Type badge + artist */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
        {artist && <span className="text-[10px] text-muted-foreground">{artist}</span>}
      </div>

      {/* Title */}
      <p className={`font-medium leading-snug ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
        {task.title}
      </p>

      {/* Description (first line only) */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
      )}

      {/* Due date + actions */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1">
          {task.due_date && (
            <span className={`flex items-center gap-0.5 text-[10px] font-medium ${
              overdue ? 'text-red-500' : soon ? 'text-orange-500' : 'text-muted-foreground'
            }`}>
              <Clock className="h-2.5 w-2.5" />
              {overdue ? 'OVERDUE · ' : soon ? 'DUE SOON · ' : ''}
              {new Date(task.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <select
            value={task.status}
            onChange={e => onStatusChange(task.id, e.target.value as TaskStatus)}
            className="text-[10px] border rounded px-1.5 py-0.5 bg-background cursor-pointer"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <button onClick={() => onDelete(task.id)} className="text-[10px] text-muted-foreground hover:text-destructive px-1 leading-none">✕</button>
        </div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('general')
  const [newDue, setNewDue] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')

  const supabase = createClient()

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*, artists(stage_name)')
      .order('due_date', { ascending: true, nullsFirst: false })
    setTasks((data ?? []) as Task[])
    setLoading(false)
  }

  async function addTask() {
    if (!newTitle.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await (supabase as any).from('tasks').insert({
      title: newTitle.trim(),
      type: newType,
      status: 'todo',
      due_date: newDue || null,
      description: newDesc || null,
      created_by: user!.id,
    }).select('*, artists(stage_name)').single()
    if (error) { toast.error(error.message); setSaving(false); return }
    setTasks(t => [data as Task, ...t])
    setNewTitle(''); setNewType('general'); setNewDue(''); setNewDesc('')
    setAdding(false)
    setSaving(false)
    toast.success('Task added')
  }

  async function updateStatus(id: string, newStatus: TaskStatus) {
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setTasks(t => t.map(task => task.id === id ? { ...task, status: newStatus } : task))
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(t => t.filter(task => task.id !== id))
    toast.success('Task removed')
  }

  const filtered = tasks.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    return true
  })

  const todoCount = tasks.filter(t => t.status === 'todo').length
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length
  const doneCount = tasks.filter(t => t.status === 'done').length
  const overdueCount = tasks.filter(t => isOverdue(t.due_date, t.status)).length

  const taskTypes = Array.from(new Set(tasks.map(t => t.type)))

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Task Funnel</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3">
            <span>{todoCount} to do</span>
            <span>{inProgressCount} in progress</span>
            <span>{doneCount} done</span>
            {overdueCount > 0 && <span className="text-red-500 font-semibold">{overdueCount} overdue</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('kanban')}
            className={`p-2 rounded border transition-colors ${view === 'kanban' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
            title="Kanban view"
          >
            <Columns3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded border transition-colors ${view === 'list' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
            title="List view"
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <Button size="sm" onClick={() => setAdding(a => !a)}>
            <Plus className="h-4 w-4 mr-1" /> Add Task
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 items-center">
        {taskTypes.map(type => {
          const m = getTypeMeta(type)
          const count = tasks.filter(t => t.type === type && t.status !== 'done').length
          if (!count) return null
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
              className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                typeFilter === type ? m.color : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${m.dot}`} />
              {m.label} <span className="font-semibold">{count}</span>
            </button>
          )
        })}
        {typeFilter !== 'all' && (
          <button onClick={() => setTypeFilter('all')} className="text-[11px] text-muted-foreground hover:text-foreground underline">clear</button>
        )}
      </div>

      {/* Add task form */}
      {adding && (
        <div className="border border-primary/20 rounded-lg bg-primary/5 p-4 space-y-3">
          <Input placeholder="Task title *" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="text-sm" autoFocus />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <select
              value={newType}
              onChange={e => setNewType(e.target.value)}
              className="text-sm border rounded-md px-3 py-2 bg-background"
            >
              {ALL_TYPES.map(t => (
                <option key={t} value={t}>{getTypeMeta(t).label}</option>
              ))}
            </select>
            <Input placeholder="Due date" type="date" value={newDue} onChange={e => setNewDue(e.target.value)} className="text-sm" />
            <Input placeholder="Notes (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="text-sm col-span-2 md:col-span-2" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addTask} disabled={saving || !newTitle.trim()}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null} Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : view === 'kanban' ? (
        /* Kanban board */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const colTasks = filtered.filter(t => t.status === col.status)
            return (
              <div key={col.status} className={`rounded-xl border-t-4 border border-border ${col.headerColor} bg-muted/20`}>
                <div className="p-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{col.label}</span>
                    <span className="text-xs bg-background border rounded-full px-2 py-0.5 text-muted-foreground">
                      {colTasks.length}
                    </span>
                  </div>
                </div>
                <div className="p-3 space-y-2 min-h-[120px]">
                  {colTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 text-center py-4">empty</p>
                  ) : (
                    colTasks.map(task => (
                      <TaskCard key={task.id} task={task} onStatusChange={updateStatus} onDelete={deleteTask} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List view */
        <div className="space-y-1">
          {/* Status filter for list view */}
          <div className="flex gap-2 mb-3">
            {(['all', 'todo', 'in_progress', 'done'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  statusFilter === f ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No tasks here.</p>
            </div>
          ) : filtered.map(task => {
            const meta = getTypeMeta(task.type)
            const overdue = isOverdue(task.due_date, task.status)
            const soon = isDueSoon(task.due_date, task.status)
            const artist = (task.artists as any)?.stage_name
            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-3.5 rounded-lg border transition-colors ${
                  task.status === 'done' ? 'opacity-40 bg-muted/10' : overdue ? 'border-red-400/50 bg-red-500/5' : 'bg-background hover:border-primary/30'
                }`}
              >
                <button
                  onClick={() => updateStatus(task.id, task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done')}
                  className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    task.status === 'done' ? 'bg-green-500 border-green-500' :
                    task.status === 'in_progress' ? 'border-yellow-500' : 'border-muted-foreground/40'
                  }`}
                >
                  {task.status === 'done' && <Check className="h-3 w-3 text-white" />}
                  {task.status === 'in_progress' && <div className="h-2 w-2 rounded-full bg-yellow-500" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through' : ''}`}>{task.title}</p>
                  {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
                    {artist && <span className="text-[10px] text-muted-foreground">{artist}</span>}
                    {task.due_date && (
                      <span className={`flex items-center gap-0.5 text-[10px] font-medium ${
                        overdue ? 'text-red-500' : soon ? 'text-orange-500' : 'text-muted-foreground'
                      }`}>
                        <Clock className="h-2.5 w-2.5" />
                        {overdue ? 'OVERDUE · ' : soon ? 'SOON · ' : ''}
                        {new Date(task.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <select
                    value={task.status}
                    onChange={e => updateStatus(task.id, e.target.value as TaskStatus)}
                    className="text-[10px] border rounded px-1.5 py-1 bg-background"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <button onClick={() => deleteTask(task.id)} className="text-[10px] text-muted-foreground hover:text-destructive px-1">✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
