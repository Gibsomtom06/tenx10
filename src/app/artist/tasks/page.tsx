import { createClient } from '@/lib/supabase/server'
import { getArtistAccess } from '@/lib/supabase/artist-access'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CheckSquare, Clock, AlertTriangle } from 'lucide-react'

export const metadata = { title: 'Tasks — TENx10' }

const TYPE_COLORS: Record<string, string> = {
  show: 'bg-primary/10 text-primary',
  release: 'bg-green-500/10 text-green-600 dark:text-green-400',
  promo: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  general: 'bg-muted text-muted-foreground',
}

export default async function ArtistTasksPage() {
  const supabase = await createClient()
  const access = await getArtistAccess(supabase)
  if (!access) redirect('/dashboard')
  if (access.role === 'agent') redirect('/artist/pipeline')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('artist_id', access.artistId)
    .order('due_date', { ascending: true, nullsFirst: false })

  const today = new Date().toISOString().split('T')[0]
  const isOverdue = (due: string | null) => due ? due < today : false

  const todo = (tasks ?? []).filter(t => t.status === 'todo')
  const inProgress = (tasks ?? []).filter(t => t.status === 'in_progress')
  const done = (tasks ?? []).filter(t => t.status === 'done')

  function TaskItem({ task }: { task: NonNullable<typeof tasks>[number] }) {
    return (
      <Card>
        <CardContent className="p-4 flex items-start gap-3">
          <div className={`mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 ${task.status === 'done' ? 'bg-green-500 border-green-500' : task.status === 'in_progress' ? 'border-yellow-500' : 'border-muted-foreground/40'}`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>{task.title}</p>
            {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge className={`text-[10px] ${TYPE_COLORS[task.type] ?? ''}`} variant="outline">{task.type}</Badge>
              {task.due_date && (
                <span className={`flex items-center gap-0.5 text-[10px] ${isOverdue(task.due_date) && task.status !== 'done' ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                  {isOverdue(task.due_date) && task.status !== 'done' && <AlertTriangle className="h-2.5 w-2.5" />}
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {todo.length} to do · {inProgress.length} in progress · {done.length} done
        </p>
      </div>

      {inProgress.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-yellow-600 dark:text-yellow-400">In Progress</h2>
          {inProgress.map(t => <TaskItem key={t.id} task={t} />)}
        </section>
      )}

      {todo.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">To Do</h2>
          {todo.map(t => <TaskItem key={t.id} task={t} />)}
        </section>
      )}

      {done.length > 0 && (
        <section className="space-y-2 opacity-60">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Done</h2>
          {done.map(t => <TaskItem key={t.id} task={t} />)}
        </section>
      )}

      {!tasks?.length && (
        <div className="text-center py-12 text-muted-foreground">
          <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No tasks yet — your manager will assign tasks here.</p>
        </div>
      )}
    </div>
  )
}
