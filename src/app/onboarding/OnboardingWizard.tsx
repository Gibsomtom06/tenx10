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
  Rocket, Circle, Plus, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface ArtistEntry {
  id: string  // client-side only, for list keys
  stageName: string
  legalName: string
  genre: string
  floorGuarantee: string
  artistEmail: string
  artistPhone: string
  expanded: boolean
}

const STEPS = [
  { id: 'account', label: 'Your Profile', icon: User },
  { id: 'roster',  label: 'Roster',       icon: Music2 },
  { id: 'gmail',   label: 'Gmail',        icon: Mail },
  { id: 'done',    label: 'Go Live',      icon: Rocket },
]

function makeArtist(): ArtistEntry {
  return {
    id: Math.random().toString(36).slice(2),
    stageName: '',
    legalName: '',
    genre: '',
    floorGuarantee: '1500',
    artistEmail: '',
    artistPhone: '',
    expanded: true,
  }
}

// ─────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────

function StepIndicator({ step, completed }: { step: number; completed: Record<string, boolean> }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => {
        const isActive = i === step
        const isDone = i < step || completed[s.id]
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

// ─────────────────────────────────────────────────────────────────
// Artist Card
// ─────────────────────────────────────────────────────────────────

function ArtistCard({
  artist,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  artist: ArtistEntry
  index: number
  onChange: (id: string, field: keyof ArtistEntry, value: string | boolean) => void
  onRemove: (id: string) => void
  canRemove: boolean
}) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Card header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-muted/30 cursor-pointer"
        onClick={() => onChange(artist.id, 'expanded', !artist.expanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
            {artist.stageName ? artist.stageName[0].toUpperCase() : (index + 1)}
          </div>
          <span className="text-sm font-medium">
            {artist.stageName || `Artist ${index + 1}`}
          </span>
          {artist.stageName && (
            <span className="text-xs text-muted-foreground">
              {artist.genre ? `· ${artist.genre}` : ''} {artist.floorGuarantee ? `· $${artist.floorGuarantee} floor` : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button
              onClick={e => { e.stopPropagation(); onRemove(artist.id) }}
              className="text-destructive/60 hover:text-destructive transition-colors p-1"
              title="Remove artist"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {artist.expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Card fields */}
      {artist.expanded && (
        <div className="px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Stage name *</Label>
              <Input
                placeholder="DirtySnatcha"
                value={artist.stageName}
                onChange={e => onChange(artist.id, 'stageName', e.target.value)}
                autoFocus={index === 0}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Legal name</Label>
              <Input
                placeholder="Leigh Bray"
                value={artist.legalName}
                onChange={e => onChange(artist.id, 'legalName', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Genre</Label>
            <Input
              placeholder="Dubstep, Riddim, Bass Music"
              value={artist.genre}
              onChange={e => onChange(artist.id, 'genre', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Floor guarantee ($)</Label>
              <Input
                type="number"
                placeholder="1500"
                value={artist.floorGuarantee}
                onChange={e => onChange(artist.id, 'floorGuarantee', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Artist email</Label>
              <Input
                type="email"
                placeholder="contact@artist.com"
                value={artist.artistEmail}
                onChange={e => onChange(artist.id, 'artistEmail', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Phone</Label>
            <Input
              placeholder="555-000-0000"
              value={artist.artistPhone}
              onChange={e => onChange(artist.id, 'artistPhone', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main Wizard
// ─────────────────────────────────────────────────────────────────

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

  const startStep = !hasProfile ? 0 : !hasArtists ? 1 : !hasGmail ? 2 : 3

  const [step, setStep] = useState(startStep)
  const [loading, setLoading] = useState(false)

  // Step 0 — Profile
  const [fullName, setFullName] = useState('')
  const [labelName, setLabelName] = useState('')
  const [role, setRole] = useState('manager')

  // Step 1 — Roster (multi-artist)
  const [artists, setArtists] = useState<ArtistEntry[]>([makeArtist()])

  const completed = {
    account: hasProfile || step > 0,
    roster: hasArtists || step > 1,
    gmail: hasGmail,
    done: false,
  }

  // ── Artist card handlers ──
  function updateArtist(id: string, field: keyof ArtistEntry, value: string | boolean) {
    setArtists(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }

  function addArtist() {
    if (artists.length >= 10) { toast.error('Maximum 10 artists per onboarding'); return }
    setArtists(prev => [
      ...prev.map(a => ({ ...a, expanded: false })),
      makeArtist(),
    ])
  }

  function removeArtist(id: string) {
    if (artists.length <= 1) return
    setArtists(prev => prev.filter(a => a.id !== id))
  }

  // ── Save handlers ──
  async function saveAccount() {
    if (!fullName.trim()) { toast.error('Enter your name'); return }
    setLoading(true)
    const res = await fetch('/api/onboarding/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, labelName, role }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Failed to save'); return }
    setStep(1)
  }

  async function saveRoster() {
    const valid = artists.filter(a => a.stageName.trim())
    if (valid.length === 0) { toast.error('Add at least one artist with a stage name'); return }
    setLoading(true)
    const res = await fetch('/api/onboarding/artist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artists: valid.map(a => ({
        stageName: a.stageName,
        legalName: a.legalName,
        genre: a.genre,
        floorGuarantee: a.floorGuarantee,
        artistEmail: a.artistEmail,
        artistPhone: a.artistPhone,
      })) }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Failed to save roster'); return }
    setStep(2)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black">TEN<span className="text-primary">x10</span></h1>
          <p className="text-muted-foreground mt-1 text-sm">Set up your management workspace</p>
        </div>

        <StepIndicator step={step} completed={completed} />

        {/* Step 0 — Profile */}
        {step === 0 && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold">Your profile</h2>
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

              <div className="space-y-2">
                <Label>Your role</Label>
                <div className="flex gap-2">
                  {['manager', 'label', 'label_manager'].map(r => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={cn(
                        'flex-1 py-2 text-xs rounded-lg border transition-colors',
                        role === r
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border text-muted-foreground hover:border-border/60'
                      )}
                    >
                      {r === 'manager' ? 'Manager' : r === 'label' ? 'Label' : 'Label + Manager'}
                    </button>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={saveAccount} disabled={loading}>
                {loading ? 'Saving...' : 'Continue'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1 — Roster */}
        {step === 1 && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold">Build your roster</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Add up to 10 artists. You can add more anytime from the dashboard.
                </p>
              </div>

              <div className="space-y-3">
                {artists.map((artist, i) => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    index={i}
                    onChange={updateArtist}
                    onRemove={removeArtist}
                    canRemove={artists.length > 1}
                  />
                ))}
              </div>

              {artists.length < 10 && (
                <button
                  onClick={addArtist}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add another artist
                  <span className="text-xs">({artists.length}/10)</span>
                </button>
              )}

              <div className="flex gap-3">
                <Button className="flex-1" onClick={saveRoster} disabled={loading}>
                  {loading ? 'Saving...' : `Save ${artists.filter(a => a.stageName).length > 0 ? artists.filter(a => a.stageName).length : ''} artist${artists.filter(a => a.stageName).length !== 1 ? 's' : ''}`}
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
                  Lets TENx10 read inbound offers and save counter-offer drafts to your Gmail. Never sends automatically.
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
                    <p>With Gmail connected, TENx10 can:</p>
                    <p>• Detect inbound booking offers automatically</p>
                    <p>• Run the 6-step decision engine on each offer</p>
                    <p>• Save counter-offer drafts — you review before sending</p>
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
                  {hasGmail ? 'Continue' : 'Skip for now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <Card>
            <CardContent className="pt-6 space-y-5 text-center">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold">Workspace ready</h2>
                <p className="text-sm text-muted-foreground mt-1">Your management platform is live</p>
              </div>

              <div className="text-left space-y-2 bg-muted/30 rounded-lg p-4">
                {[
                  { done: completed.account || hasProfile, label: 'Profile set up' },
                  { done: completed.roster || hasArtists, label: `${artists.filter(a => a.stageName).length || 'Artist(s)'} on roster` },
                  { done: hasGmail, label: 'Gmail connected' },
                  { done: false, label: 'First offer analyzed (incoming)' },
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
