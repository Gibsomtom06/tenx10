'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Save, Music2, Link2, ExternalLink } from 'lucide-react'

interface ArtistProfile {
  id: string
  name: string
  stage_name: string | null
  bio: string | null
  email: string | null
  phone: string | null
  genre: string | null
  spotify_artist_id: string | null
  avatar_url: string | null
  social_stats: Record<string, string> | null
}

interface Props {
  artist: ArtistProfile | null
  artistId: string
}

export default function ArtistProfileForm({ artist, artistId }: Props) {
  const social = (artist?.social_stats ?? {}) as Record<string, string>

  const [bio, setBio] = useState(artist?.bio ?? '')
  const [genre, setGenre] = useState(artist?.genre ?? '')
  const [phone, setPhone] = useState(artist?.phone ?? '')
  const [spotifyUrl, setSpotifyUrl] = useState(
    artist?.spotify_artist_id ? `https://open.spotify.com/artist/${artist.spotify_artist_id}` : ''
  )
  const [instagram, setInstagram] = useState(social.instagram ?? '')
  const [tiktok, setTiktok] = useState(social.tiktok ?? '')
  const [soundcloud, setSoundcloud] = useState(social.soundcloud ?? '')
  const [youtube, setYoutube] = useState(social.youtube ?? '')
  const [website, setWebsite] = useState(social.website ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/artist/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId,
          bio,
          genre,
          phone,
          spotifyUrl,
          instagram,
          tiktok,
          soundcloud,
          youtube,
          website,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to save')
        return
      }
      toast.success('Profile updated')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Bio */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Bio</Label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="A few sentences about your sound and where you're headed."
          rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-ring resize-none"
        />
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Genre</Label>
          <Input
            value={genre}
            onChange={e => setGenre(e.target.value)}
            placeholder="Dubstep, Riddim, Bass..."
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Phone</Label>
          <Input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            type="tel"
          />
        </div>
      </div>

      {/* Streaming */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Streaming</p>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <Music2 className="h-3.5 w-3.5 text-green-500" /> Spotify URL
          </Label>
          <Input
            value={spotifyUrl}
            onChange={e => setSpotifyUrl(e.target.value)}
            placeholder="https://open.spotify.com/artist/..."
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">SoundCloud</Label>
          <Input
            value={soundcloud}
            onChange={e => setSoundcloud(e.target.value)}
            placeholder="soundcloud.com/yourname"
          />
        </div>
      </div>

      {/* Social */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Social</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Link2 className="h-3.5 w-3.5 text-pink-500" /> Instagram
            </Label>
            <Input
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              placeholder="@handle"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">TikTok</Label>
            <Input
              value={tiktok}
              onChange={e => setTiktok(e.target.value)}
              placeholder="@handle"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">YouTube</Label>
            <Input
              value={youtube}
              onChange={e => setYoutube(e.target.value)}
              placeholder="youtube.com/@channel"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <ExternalLink className="h-3.5 w-3.5 text-blue-400" /> Website
            </Label>
            <Input
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="yoursite.com"
            />
          </div>
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="gap-2">
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : 'Save profile'}
      </Button>
    </div>
  )
}
