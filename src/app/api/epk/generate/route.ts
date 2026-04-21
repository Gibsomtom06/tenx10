import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PITCH_ARTISTS, type PitchArtistSlug } from '@/lib/outreach/artist-profiles'

export interface EPKData {
  artist: {
    name: string
    genre: string
    bio: string
    metrics: string
    topTracks: string
    tourHistory: string
    guarantee: string
  }
  booking: {
    contact: string
    email: string
    manager: string
    managerEmail: string
    managerPhone: string
  }
  social: {
    spotify: string
    instagram: string
    soundcloud: string
    facebook: string
  }
  pressText: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { artistSlug } = await request.json() as { artistSlug: PitchArtistSlug }
  const artist = PITCH_ARTISTS[artistSlug]
  if (!artist) return NextResponse.json({ error: 'Unknown artist' }, { status: 400 })

  const SOCIAL_LINKS: Record<PitchArtistSlug, EPKData['social']> = {
    dirtysnatcha: {
      spotify: 'open.spotify.com/artist/DirtySnatcha',
      instagram: 'instagram.com/dirtysnatcha',
      soundcloud: 'soundcloud.com/dirtysnatcha',
      facebook: 'facebook.com/dirtysnatcha',
    },
    hvrcrft: {
      spotify: 'open.spotify.com/artist/HVRCRFT',
      instagram: 'instagram.com/hvrcrft',
      soundcloud: 'soundcloud.com/hvrcrft',
      facebook: '',
    },
    'dark-matter': {
      spotify: 'open.spotify.com/artist/DarkMatter',
      instagram: 'instagram.com/darkmattermusic',
      soundcloud: 'soundcloud.com/dark-matter-music',
      facebook: '',
    },
    kotrax: {
      spotify: 'open.spotify.com/artist/Kotrax',
      instagram: 'instagram.com/kotraxmusic',
      soundcloud: 'soundcloud.com/kotrax',
      facebook: '',
    },
    whoisee: {
      spotify: 'open.spotify.com/artist/WHOiSEE',
      instagram: 'instagram.com/whoiseemusic',
      soundcloud: 'soundcloud.com/whoisee',
      facebook: '',
    },
    ozztin: {
      spotify: 'open.spotify.com/artist/OZZTIN',
      instagram: 'instagram.com/ozztin',
      soundcloud: 'soundcloud.com/ozztin',
      facebook: '',
    },
    mavic: {
      spotify: 'open.spotify.com/artist/MAVIC',
      instagram: 'instagram.com/mavicmusic',
      soundcloud: 'soundcloud.com/mavic',
      facebook: '',
    },
    priyanx: {
      spotify: 'open.spotify.com/artist/PRIYANX',
      instagram: 'instagram.com/priyanx',
      soundcloud: 'soundcloud.com/priyanx',
      facebook: '',
    },
    'dsr-takeover': {
      spotify: 'open.spotify.com/artist/DirtySnatcha',
      instagram: 'instagram.com/dirtysnatchaRecords',
      soundcloud: 'soundcloud.com/dirtysnatcharecords',
      facebook: 'facebook.com/dirtysnatcharecords',
    },
  }

  const epk: EPKData = {
    artist: {
      name: artist.name,
      genre: artist.genre,
      bio: artist.bio,
      metrics: artist.metrics,
      topTracks: artist.topTracks ?? '',
      tourHistory: artist.tourHistory ?? '',
      guarantee: artist.guarantee,
    },
    booking: {
      contact: artist.bookingContact,
      email: artist.bookingEmail,
      manager: 'Thomas Nalian',
      managerEmail: 'thomas@dirtysnatcha.com',
      managerPhone: '248-765-1997',
    },
    social: SOCIAL_LINKS[artistSlug],
    pressText: `${artist.name} is a ${artist.genre} artist${artist.tourHistory ? ` currently on ${artist.tourHistory.split('—')[0].trim()}` : ''}. ${artist.bio} Booking: ${artist.bookingEmail}`,
  }

  return NextResponse.json(epk)
}
