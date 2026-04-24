'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Music2, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  token: string
  inviteId: string
  artistId: string
  artistName: string
  genre: string
  email: string
  expired: boolean
  alreadyAccepted: boolean
}

export default function ArtistJoinClient({
  token,
  inviteId,
  artistId,
  artistName,
  genre,
  email,
  expired,
  alreadyAccepted,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'intro' | 'profile' | 'account' | 'done'>('intro')
  const [loading, setLoading] = useState(false)

  // Profile fields
  const [bio, setBio] = useState('')
  const [instagram, setInstagram] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [soundcloud, setSoundcloud] = useState('')
  const [spotify, setSpotify] = useState('')

  // Account
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function saveProfileAndCreateAccount() {
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)

    const res = await fetch('/api/artist/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        inviteId,
        artistId,
        email,
        password,
        bio,
        instagram,
        tiktok,
        soundcloud,
        spotifyUrl: spotify,
      }),
    })

    setLoading(false)
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to set up account')
      return
    }

    setStep('done')
  }

  // ── Expired / Already accepted states ──
  if (expired && !alreadyAccepted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
          <h1 className="text-2xl font-black">Invite expired</h1>
          <p className="text-white/50">This invite link is more than 7 days old. Ask your manager to send a fresh one.</p>
        </div>
      </div>
    )
  }

  if (alreadyAccepted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <h1 className="text-2xl font-black">Already joined</h1>
          <p className="text-white/50">This invite was already used. Log in to access your artist portal.</p>
          <Button className="bg-white text-black hover:bg-white/90 font-bold" onClick={() => router.push('/auth/login')}>
            Log in to TENx10
          </Button>
        </div>
      </div>
    )
  }

  // ── Done ──
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-2">You&apos;re in.</h1>
            <p className="text-white/50">Your artist profile is live on TENx10. Your management team can see your data now.</p>
          </div>
          <Button
            className="bg-white text-black hover:bg-white/90 font-bold h-12 px-8"
            onClick={() => router.push('/artist')}
          >
            Go to my dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-white/10 h-14 flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
            <Music2 className="h-4 w-4 text-black" />
          </div>
          <span className="font-black text-lg tracking-tight">TENx10</span>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">

          {/* Intro */}
          {step === 'intro' && (
            <div className="space-y-6">
              <div>
                <p className="text-white/40 text-sm mb-2">you&apos;ve been invited to</p>
                <h1 className="text-4xl font-black mb-1">TENx10</h1>
                <p className="text-white/60">Your management team is running on TENx10 — a platform that tracks your bookings, streaming data, and touring ops in one place.</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <div>
                  <p className="text-xs text-white/40">artist</p>
                  <p className="font-black text-xl">{artistName}</p>
                </div>
                {genre && (
                  <div>
                    <p className="text-xs text-white/40">genre</p>
                    <p className="text-white/80">{genre}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-white/40">invite sent to</p>
                  <p className="text-white/80">{email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-white/60">Takes about 2 minutes. You&apos;ll set up:</p>
                {['Your artist bio and social handles', 'Your TENx10 login', 'Access to your artist dashboard'].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm text-white/50">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <Button
                className="w-full bg-white text-black hover:bg-white/90 font-bold h-12"
                onClick={() => setStep('profile')}
              >
                Get started
              </Button>
            </div>
          )}

          {/* Profile */}
          {step === 'profile' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black mb-1">Your profile</h2>
                <p className="text-white/50 text-sm">This is what your management team sees. Add what you have — nothing is required yet.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs">Bio</Label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="A few sentences about your sound, where you're from, what you've been building."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-white/60 text-xs">Spotify URL</Label>
                    <Input
                      placeholder="open.spotify.com/artist/..."
                      value={spotify}
                      onChange={e => setSpotify(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-white/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/60 text-xs">Instagram</Label>
                    <Input
                      placeholder="@handle"
                      value={instagram}
                      onChange={e => setInstagram(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-white/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/60 text-xs">TikTok</Label>
                    <Input
                      placeholder="@handle"
                      value={tiktok}
                      onChange={e => setTiktok(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-white/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/60 text-xs">SoundCloud</Label>
                    <Input
                      placeholder="soundcloud.com/..."
                      value={soundcloud}
                      onChange={e => setSoundcloud(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-white/30"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-white text-black hover:bg-white/90 font-bold"
                  onClick={() => setStep('account')}
                >
                  Next: Create account
                </Button>
                <Button variant="ghost" className="text-white/40 hover:text-white" onClick={() => setStep('account')}>
                  Skip
                </Button>
              </div>
            </div>
          )}

          {/* Account */}
          {step === 'account' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black mb-1">Create your login</h2>
                <p className="text-white/50 text-sm">You&apos;ll use {email} to sign in.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs">Email</Label>
                  <Input
                    value={email}
                    disabled
                    className="bg-white/5 border-white/10 text-white/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs">Password</Label>
                  <Input
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-white/30"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs">Confirm password</Label>
                  <Input
                    type="password"
                    placeholder="Same password again"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-white/30"
                    onKeyDown={e => e.key === 'Enter' && saveProfileAndCreateAccount()}
                  />
                </div>
              </div>

              <Button
                className="w-full bg-white text-black hover:bg-white/90 font-bold h-12"
                onClick={saveProfileAndCreateAccount}
                disabled={loading}
              >
                {loading ? 'Setting up your account...' : 'Finish setup'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
