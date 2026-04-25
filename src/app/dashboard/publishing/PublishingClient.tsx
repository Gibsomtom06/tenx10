'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, AlertCircle, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PublishingTrack {
  id: string
  title: string
  isrc: string | null
  iswc: string | null
  release_date: string | null
  composer_name: string | null
  composer_pro: string | null
  publisher_name: string | null
  composer_share: number | null
  bmi_registered: boolean
  ascap_registered: boolean
  mlc_registered: boolean
  mlc_song_code: string | null
  soundexchange_registered: boolean
  label: string | null
  notes: string | null
}

function StatusDot({ ok, warn }: { ok: boolean; warn?: boolean }) {
  if (ok) return <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
  if (warn) return <AlertCircle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
  return <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
}

function ProBadge({ label, registered, code }: { label: string; registered: boolean; code?: string | null }) {
  return (
    <div className={cn(
      'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border',
      registered ? 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400' : 'border-red-400/20 bg-red-400/5 text-red-400'
    )}>
      <StatusDot ok={registered} />
      {label}
      {code && <span className="opacity-60 ml-1">{code}</span>}
    </div>
  )
}

interface Props {
  tracks: PublishingTrack[]
  artistName: string
}

export default function PublishingClient({ tracks, artistName }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'missing_mlc' | 'missing_isrc' | 'needs_action'>('all')

  const total = tracks.length
  const bmiCount = tracks.filter(t => t.bmi_registered).length
  const mlcCount = tracks.filter(t => t.mlc_registered).length
  const isrcCount = tracks.filter(t => t.isrc).length
  const sxCount = tracks.filter(t => t.soundexchange_registered).length
  const needsAction = tracks.filter(t => !t.mlc_registered || !t.isrc).length

  // Estimated uncollected: MLC pays ~$0.091/stream for mechanicals
  // DSR has ~14M lifetime streams, ~8K/month. Rough estimate: 54 tracks × 8K avg = lots
  // Conservative: tracks not at MLC × estimated streams × $0.091
  const unregisteredMLC = tracks.filter(t => !t.mlc_registered).length
  const estimatedUncollected = Math.round(unregisteredMLC * 50000 * 0.091) // 50K avg lifetime streams

  const filtered = tracks.filter(t => {
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (filter === 'missing_mlc') return !t.mlc_registered
    if (filter === 'missing_isrc') return !t.isrc
    if (filter === 'needs_action') return !t.mlc_registered || !t.isrc
    return true
  })

  const FILTER_OPTS = [
    { id: 'all', label: `all (${total})` },
    { id: 'needs_action', label: `needs action (${needsAction})` },
    { id: 'missing_mlc', label: `not at MLC (${total - mlcCount})` },
    { id: 'missing_isrc', label: `missing ISRC (${total - isrcCount})` },
  ] as const

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'tracks', value: total, color: 'text-foreground' },
          { label: 'BMI', value: `${bmiCount}/${total}`, color: bmiCount === total ? 'text-green-500' : 'text-yellow-500' },
          { label: 'MLC', value: `${mlcCount}/${total}`, color: mlcCount === total ? 'text-green-500' : 'text-red-400' },
          { label: 'SoundExchange', value: `${sxCount}/${total}`, color: sxCount === total ? 'text-green-500' : 'text-red-400' },
          { label: 'est. uncollected', value: `~$${(estimatedUncollected / 1000).toFixed(0)}K`, color: 'text-yellow-500' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border-border/50">
            <CardContent className="pt-4 pb-3">
              <div className={cn('text-2xl font-bold tabular-nums', color)}>{value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="search tracks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 text-sm h-8"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTER_OPTS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={cn(
                'text-[11px] px-3 py-1.5 rounded border transition-colors',
                filter === opt.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Needs action alert */}
      {needsAction > 0 && filter === 'all' && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 text-sm">
          <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-yellow-600 dark:text-yellow-400">{needsAction} tracks need action. </span>
            <span className="text-muted-foreground">
              {total - mlcCount} not registered at MLC (mechanical royalties uncollected) · {total - isrcCount} missing ISRC.
              {estimatedUncollected > 0 && ` Est. uncollected: ~$${estimatedUncollected.toLocaleString()}.`}
            </span>
          </div>
        </div>
      )}

      {/* Track table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{artistName} — {filtered.length} tracks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-[10px] text-muted-foreground uppercase tracking-wide">
                  <th className="text-left py-2 px-4 font-medium">title</th>
                  <th className="text-left py-2 px-3 font-medium">isrc</th>
                  <th className="text-left py-2 px-3 font-medium">BMI</th>
                  <th className="text-left py-2 px-3 font-medium">ASCAP</th>
                  <th className="text-left py-2 px-3 font-medium">MLC</th>
                  <th className="text-left py-2 px-3 font-medium">SX</th>
                  <th className="text-left py-2 px-3 font-medium">share</th>
                  <th className="text-left py-2 px-3 font-medium">label</th>
                  <th className="py-2 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map(track => {
                  const hasIssue = !track.mlc_registered || !track.isrc
                  return (
                    <tr
                      key={track.id}
                      className={cn(
                        'hover:bg-muted/30 transition-colors',
                        hasIssue && 'bg-red-500/3'
                      )}
                    >
                      <td className="py-2 px-4">
                        <div className="font-medium text-sm">{track.title}</div>
                        {track.composer_name && (
                          <div className="text-[10px] text-muted-foreground">{track.composer_name}</div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {track.isrc
                          ? <span className="font-mono text-[10px] text-muted-foreground">{track.isrc}</span>
                          : <span className="text-[10px] text-red-400 font-medium">missing</span>
                        }
                      </td>
                      <td className="py-2 px-3">
                        <StatusDot ok={track.bmi_registered} />
                      </td>
                      <td className="py-2 px-3">
                        <StatusDot ok={track.ascap_registered} />
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <StatusDot ok={track.mlc_registered} />
                          {track.mlc_song_code && (
                            <span className="font-mono text-[10px] text-muted-foreground">{track.mlc_song_code}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <StatusDot ok={track.soundexchange_registered} />
                      </td>
                      <td className="py-2 px-3 text-[11px] text-muted-foreground">
                        {track.composer_share != null ? `${track.composer_share}%` : '—'}
                      </td>
                      <td className="py-2 px-3 text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {track.label ?? '—'}
                      </td>
                      <td className="py-2 px-4">
                        {hasIssue && (
                          <Badge variant="outline" className="text-[9px] border-yellow-500/40 text-yellow-600 dark:text-yellow-400">
                            action needed
                          </Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">no tracks match this filter</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PRO Key */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="font-medium">key:</span>
        <span>BMI = performance royalties (live/broadcast)</span>
        <span>·</span>
        <span>ASCAP = same (alternate PRO)</span>
        <span>·</span>
        <span>MLC = mechanical royalties (streaming)</span>
        <span>·</span>
        <span>SX = SoundExchange (digital performance — Pandora/SiriusXM)</span>
      </div>
    </div>
  )
}
