'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckSquare, Plus, Loader2, Check, Clock, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

type TaskStatus = 'todo' | 'in_progress' | 'done'
type TaskType = 'show' | 'release' | 'promo' | 'general'

interface Task {
  id: string
  title: string
  description: string | null
  type: TaskType
  status: TaskStatus
  due_date: string | null
  artist_id: string | null
  created_at: string
}

const TYPE_COLORS: Record<TaskType, string> = {
  show: 'bg-primary/10 text-primary',
  release: 'bg-green-500/10 text-green-600 dark:text-green-400',
  promo: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  general: 'bg-muted text-muted-foreground',
}

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done']

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<TaskType>('general')
  const [newDue, setNewDue] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'all' | TaskStatus>('all')

  const supabase = createClient()

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false })
    setTasks((data ?? []) as Task[])
    setLoading(false)
  }

  async function addTask() {
    if (!newTitle.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('tasks').insert({
      title: newTitle.trim(),
      type: newType,
      status: 'todo' as const,
      due_date: newDue || null,
      description: newDesc || null,
      created_by: user!.id,
    }).select().single()
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
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
  const todoCount = tasks.filter(t => t.status === 'todo').length
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length
  const doneCount = tasks.filter(t => t.status === 'done').length

  const isOverdue = (due: string | null) => {
    if (!due) return false
    return new Date(due) < new Date(new Date().toISOString().split('T')[0])
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {todoCount} to do · {inProgressCount} in progress · {doneCount} done
          </p>
        </div>
        <Button size="sm" onClick={() => setAdding(a => !a)}>
          <Plus className="h-4 w-4 mr-1" /> Add Task
        </Button>
      </div>

      {/* Add task form */}
      {adding && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 space-y-3">
            <Input placeholder="Task title *" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="text-sm" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as TaskType)}
                className="text-sm border rounded-md px-3 py-2 bg-background"
              >
                <option value="show">Show</option>
                <option value="release">Release</option>
                <option value="promo">Promo</option>
                <option value="general">General</option>
              </select>
              <Input placeholder="Due date" type="date" value={newDue} onChange={e => setNewDue(e.target.value)} className="text-sm" />
              <Input placeholder="Notes (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="text-sm col-span-2 md:col-span-2" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addTask} disabled={saving || !newTitle.trim()}>
                {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'todo', 'in_progress', 'done'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No tasks here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <div
              key={task.id}
              className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                task.status === 'done' ? 'opacity-50 bg-muted/20' : 'bg-background hover:border-primary/30'
              }`}
            >
              {/* Status toggle */}
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
                {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge className={`text-[10px] ${TYPE_COLORS[task.type]}`} variant="outline">{task.type}</Badge>
                  {task.due_date && (
                    <span className={`flex items-center gap-0.5 text-[10px] ${isOverdue(task.due_date) && task.status !== 'done' ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                      <Clock className="h-2.5 w-2.5" />
                      {isOverdue(task.due_date) && task.status !== 'done' ? 'OVERDUE · ' : ''}
                      {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
          ))}
        </div>
      )}
    </div>
  )
}
