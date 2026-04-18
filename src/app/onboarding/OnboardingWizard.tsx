'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  CheckCircle2, ChevronRight, User, Music2, Mail,
  Upload, Rocket, Circle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 'account', label: 'Your Account', icon: User },
  { id: 'artist', label: 'First Artist', icon: Music2 },
  { id: 'gmail', label: 'Connect Gmail', icon: Mail },
  { id: 'import', label: 'Import History', icon: Upload },
  { id: 'done', label: 'Go Live', icon: Rocket },
]

export default function OnboardingWizard({
  email,
  hasProfile,
  hasArtists,
  hasGmail,
  gmailEmail,
}: {
  email: string
  hasProfile: boolean
  hasArtists: boolean
  hasGmail: boolean
  gmailEmail: string | null
}) {
  const router = useRouter()

  // Determine starting step
  const startStep = !hasProfile ? 0 : !hasArtists ? 1 : !hasGmail ? 2 : 3

  const [step, setStep] = useState(startStep)
  const [loading, setLoading] = useState(false)

  // Step 0 — Account
  const [fullName, setFullName] = useState('')
  const [labelName, setLabelName] = useState('')

  // Step 1 — Artist
  const [stageName, setStageName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [genre, setGenre] = useState('')
  const [floorGuarantee, setFloorGuarantee] = useState('1500')
  const [artistEmail, setArtistEmail] = useState('')
  const [artistPhone, setArtistPhone] = useState('')

  const completed = {
    account: hasProfile || step > 0,
    artist: hasArtists || step > 1,
    gmail: hasGmail,
    import: false,
  }

  async function saveAccount() {
    if (!fullName.trim()) { toast.error('Enter your name'); return }
    setLoading(true)
    const res = await fetch('/api/onboarding/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, labelName }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Failed to save'); return }
    setStep(1)
  }

  async function saveArtist() {
    if (!stageName.trim()) { toast.error('Enter a stage name'); return }
    setLoading(true)
    const res = await fetch('/api/onboarding/artist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageName, legalName, genre, floorGuarantee, artistEmail, artistPhone }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Failed to save'); return }
    setStep(2)
  }

  function StepIndicator() {
    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const isActive = i === step
          const isDone = i < step || (s.id === 'gmail' && hasGmail) || (s.id === 'account' && completed.account)
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all',
                isActive ? 'bg-primary text-primary-foreground' :
                isDone ? 'bg-green-500 text-white' :
                'bg-muted text-muted-foreground'
              )}>
                {isDone && !isActive ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('h-0.5 w-8', i < step ? 'bg-green-500' : 'bg-muted')} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black">TEN<span className="text-primary">x10</span></h1>
          <p className="text-muted-foreground mt-1 text-sm">Let's get you set up</p>
        </div>

        <StepIndicator />

        {/* Step 0 — Account */}
        {step === 0 && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold">Your account</h2>
                <p className="text-sm text-muted-foreground mt-1">Logged in as {email}</p>
              </div>

              <div className="space-y-2">
                <Label>Your name *</Label>
                <Input
                  placeholder="Thomas Nalian"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveAccount()}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Label / company name</Label>
                <Input
                  placeholder="DirtySnatcha Records"
                  value={labelName}
                  onChange={e => setLabelName(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={saveAccount} disabled={loading}>
                {loading ? 'Saving...' : 'Continue'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1 — First Artist */}
        {step === 1 && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold">Add your first artist</h2>
                <p className="text-sm text-muted-foreground mt-1">You can add more later</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stage name *</Label>
                  <Input placeholder="DirtySnatcha" value={stageName} onChange={e => setStageName(e.target.value)} autoFocus />
                </div>
                <div className="space-y-2">
                  <Label>Legal name</Label>
                  <Input placeholder="Lee Bray" value={legalName} onChange={e => setLegalName(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Genre</Label>
                <Input placeholder="Dubstep, Riddim, Bass Music" value={genre} onChange={e => setGenre(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Floor guarantee ($)</Label>
                  <Input type="number" placeholder="1500" value={floorGuarantee} onChange={e => setFloorGuarantee(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Artist email</Label>
                  <Input type="email" placeholder="contact@artist.com" value={artistEmail} onChange={e => setArtistEmail(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="555-000-0000" value={artistPhone} onChange={e => setArtistPhone(e.target.value)} />
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" onClick={saveArtist} disabled={loading}>
                  {loading ? 'Saving...' : 'Continue'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button variant="ghost" onClick={() => setStep(2)}>Skip</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — Gmail */}
        {step === 2 && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold">Connect Gmail</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Lets TENx10 read inbound offers and save counter-offer drafts directly to your Gmail.
                </p>
              </div>

              {hasGmail ? (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-500/10 px-4 py-3 rounded-lg">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected as {gmailEmail}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-muted/40 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
                    <p><strong>What TENx10 can do with Gmail access:</strong></p>
                    <p>• Read inbound booking offers from promoters</p>
                    <p>• Run the 6-step decision engine automatically</p>
                    <p>• Save counter-offer drafts — you review before sending</p>
                    <p>• Never sends emails automatically</p>
                  </div>
                  <a href="/api/gmail/connect">
                    <Button className="w-full">
                      <Mail className="h-4 w-4 mr-2" />
                      Connect Gmail
                    </Button>
                  </a>
                </div>
              )}

              <div className="flex gap-3">
                {hasGmail && (
                  <Button className="flex-1" onClick={() => setStep(3)}>
                    Continue <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
                <Button variant="ghost" className={hasGmail ? '' : 'w-full'} onClick={() => setStep(3)}>
                  {hasGmail ? 'Skip' : 'Skip for now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Import */}
        {step === 3 && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold">Import booking history</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Pull your past shows from Gigwell or any CSV. Turns every promoter into a contact lead automatically.
                </p>
              </div>

              <div className="bg-muted/40 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                <p><strong>From Gigwell:</strong> Bookings → Export CSV → paste below</p>
                <p><strong>From spreadsheet:</strong> Any CSV with venue, date, guarantee columns works</p>
                <p className="text-xs">Every promoter in your history becomes an outreach lead in TENx10</p>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => { router.push('/dashboard/import') }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Now
                </Button>
                <Button variant="ghost" onClick={() => setStep(4)}>Skip for now</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <Card>
            <CardContent className="pt-6 space-y-5 text-center">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold">You're live</h2>
                <p className="text-sm text-muted-foreground mt-1">TENx10 is ready to start making you money</p>
              </div>

              <div className="text-left space-y-2 bg-muted/30 rounded-lg p-4">
                {[
                  { done: completed.account || hasProfile, label: 'Account set up' },
                  { done: completed.artist || hasArtists, label: 'Artist on roster' },
                  { done: hasGmail, label: 'Gmail connected' },
                  { done: false, label: 'First offer processed (incoming)' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    {item.done
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    }
                    <span className={item.done ? '' : 'text-muted-foreground'}>{item.label}</span>
                  </div>
                ))}
              </div>

              <Button className="w-full text-base h-11" onClick={() => router.push('/dashboard')}>
                Go to Dashboard
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step label */}
        <p className="text-center text-xs text-muted-foreground">
          Step {step + 1} of {STEPS.length} — {STEPS[step]?.label}
        </p>
      </div>
    </div>
  )
}
