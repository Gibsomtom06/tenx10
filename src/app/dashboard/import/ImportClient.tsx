'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Upload, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

interface ParsedRow {
  artist: string
  venue: string
  city: string
  state: string
  date: string
  guarantee: number | null
  promoter: string
  promoterEmail: string
  status: string
  platform: string
  raw: string
}

interface ImportResult {
  created: number
  contacts: number
  errors: string[]
}

export default function ImportClient() {
  const [csv, setCsv] = useState('')
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [step, setStep] = useState<'paste' | 'preview' | 'done'>('paste')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [platform, setPlatform] = useState('gigwell')

  function parseCSV(text: string): ParsedRow[] {
    const lines = text.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))

    const col = (row: string[], names: string[]): string => {
      for (const name of names) {
        const idx = headers.findIndex(h => h.includes(name))
        if (idx >= 0) return (row[idx] ?? '').trim().replace(/^["']|["']$/g, '')
      }
      return ''
    }

    return lines.slice(1).map(line => {
      // Handle quoted CSV fields
      const row: string[] = []
      let current = ''
      let inQuote = false
      for (const ch of line) {
        if (ch === '"') { inQuote = !inQuote; continue }
        if (ch === ',' && !inQuote) { row.push(current); current = ''; continue }
        current += ch
      }
      row.push(current)

      const guaranteeStr = col(row, ['guarantee', 'fee', 'amount', 'price'])
      const guarantee = guaranteeStr ? parseFloat(guaranteeStr.replace(/[$,]/g, '')) : null

      const dateStr = col(row, ['date', 'show date', 'event date', 'performance date'])

      return {
        artist: col(row, ['artist', 'performer', 'act']),
        venue: col(row, ['venue', 'location name', 'club', 'space']),
        city: col(row, ['city', 'town']),
        state: col(row, ['state', 'region', 'province']),
        date: dateStr,
        guarantee: isNaN(guarantee as number) ? null : guarantee,
        promoter: col(row, ['promoter', 'buyer', 'contact', 'client', 'organizer']),
        promoterEmail: col(row, ['email', 'contact email', 'promoter email']),
        status: col(row, ['status', 'booking status']) || 'confirmed',
        platform,
        raw: line,
      }
    }).filter(r => r.venue || r.date)
  }

  function handleParse() {
    if (!csv.trim()) { toast.error('Paste your CSV data first'); return }
    const rows = parseCSV(csv)
    if (!rows.length) {
      toast.error('Could not parse CSV — check format and try again')
      return
    }
    setParsed(rows)
    setStep('preview')
  }

  async function handleImport() {
    setImporting(true)
    try {
      const res = await fetch('/api/import/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsed, platform }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      setResult(data)
      setStep('done')
      toast.success(`Imported ${data.created} deals and ${data.contacts} contacts`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setCsv('')
    setParsed([])
    setResult(null)
    setStep('paste')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Import historical shows from Gigwell, spreadsheets, or any CSV — adds deals + promoter contacts automatically
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 text-sm">
        {['paste', 'preview', 'done'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={step === s ? 'font-semibold text-primary' : 'text-muted-foreground'}>
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
            {i < 2 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {step === 'paste' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How to export from Gigwell</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>1. Log into Gigwell → go to <strong>Bookings</strong> or <strong>Shows</strong></p>
              <p>2. Click <strong>Export</strong> or <strong>Download CSV</strong></p>
              <p>3. Paste the CSV content below</p>
              <p className="mt-2">Also works with: Google Sheets export, Excel CSV, any spreadsheet with venue/date columns</p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Source platform</label>
              <div className="flex gap-2">
                {['gigwell', 'spreadsheet', 'other'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${platform === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder={`Paste CSV here. Example format:\nArtist,Venue,City,State,Date,Guarantee,Promoter,Promoter Email,Status\nDirtySnatcha,Club Venue,Chicago,IL,2024-03-15,2000,John Smith,john@venue.com,confirmed`}
              value={csv}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCsv(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
          </div>

          <Button onClick={handleParse} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Parse CSV
          </Button>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{parsed.length} rows detected</p>
            <Button variant="outline" size="sm" onClick={() => setStep('paste')}>Back</Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    {['Artist', 'Venue', 'City', 'State', 'Date', 'Guarantee', 'Promoter', 'Email', 'Status'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((row, i) => (
                    <tr key={i} className="border-t hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium">{row.artist || <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-3 py-2">{row.venue || '—'}</td>
                      <td className="px-3 py-2">{row.city || '—'}</td>
                      <td className="px-3 py-2">{row.state || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{row.date || '—'}</td>
                      <td className="px-3 py-2">{row.guarantee ? `$${row.guarantee.toLocaleString()}` : '—'}</td>
                      <td className="px-3 py-2">{row.promoter || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.promoterEmail || '—'}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-xs">{row.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Card className="bg-muted/30">
            <CardContent className="py-3 text-sm">
              <p className="font-medium">What will be created:</p>
              <ul className="mt-1 space-y-1 text-muted-foreground text-xs list-disc list-inside">
                <li>{parsed.length} deal records (historical bookings)</li>
                <li>Venue records for each unique venue</li>
                <li>{parsed.filter(r => r.promoter).length} promoter contact records (deduped)</li>
                <li>All promoters added to outreach contact list as leads</li>
              </ul>
            </CardContent>
          </Card>

          <Button onClick={handleImport} disabled={importing} className="w-full">
            {importing ? 'Importing...' : `Import ${parsed.length} bookings`}
          </Button>
        </div>
      )}

      {step === 'done' && result && (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <p className="text-xl font-bold">Import complete</p>
              <p className="text-muted-foreground text-sm mt-1">Historical data is now in TENx10</p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto text-sm">
              <div className="border rounded-lg p-3">
                <p className="text-2xl font-bold">{result.created}</p>
                <p className="text-muted-foreground">Deals added</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-2xl font-bold">{result.contacts}</p>
                <p className="text-muted-foreground">Contacts added</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="text-left max-w-sm mx-auto">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{result.errors.length} rows skipped
                </p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                  {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <a href="/dashboard/deals">
                <Button variant="outline" size="sm">View Deals</Button>
              </a>
              <a href="/dashboard/outreach">
                <Button variant="outline" size="sm">View Contacts</Button>
              </a>
              <Button size="sm" onClick={reset}>Import More</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
