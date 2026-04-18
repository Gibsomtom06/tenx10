import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderOpen, ExternalLink } from 'lucide-react'

export const metadata = { title: 'Documents — TENx10' }

const DRIVE_ROOT = 'https://drive.google.com/drive/folders/1TQnx4iTH7VgmdSeW9mxloIuLzjMlAgz-'

const QUICK_LINKS = [
  { label: 'TMTYL 2026 Tour Folder', url: DRIVE_ROOT, desc: 'All show folders, contracts, advances' },
  { label: 'Rider Templates', url: DRIVE_ROOT, desc: 'Tech rider, hospitality rider' },
  { label: 'Press Kit', url: DRIVE_ROOT, desc: 'Bio, photos, one-sheet' },
  { label: 'Artist Bible', url: DRIVE_ROOT, desc: 'Full DSR brand + metrics reference' },
]

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Show folders and assets live in Google Drive — linked below
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Google Drive — DirtySnatcha Records</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {QUICK_LINKS.map(link => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-4 group hover:bg-muted/40 -mx-2 px-2 py-2 rounded-md transition-colors"
            >
              <div className="flex items-start gap-3">
                <FolderOpen className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium group-hover:underline">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
            </a>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Show Folder Structure</CardTitle></CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground space-y-1 font-mono">
            <p className="font-sans text-sm font-medium text-foreground mb-2">[MM.DD.YYYY] [City, State] - [Venue]</p>
            <p>00_CONTROL — offer, negotiation, approval, deal summary</p>
            <p>01_CONTRACT_&_PAYMENT — contract, deposit, settlement</p>
            <p>02_ADVANCE_&_LOGISTICS — advance sheet, confirmations</p>
            <p>03_TRAVEL — flights, hotel confirmations</p>
            <p>04_MARKETING — ad copy, spend tracker, FB event</p>
            <p>05_TICKETS — ticket tracker, giveaway log</p>
            <p>06_SHOW_ASSETS — rider, setlist, press photo + bio</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
