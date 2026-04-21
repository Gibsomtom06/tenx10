// ─────────────────────────────────────────────────────────────────────────────
// ROSTER CLASSIFICATION
//
// Managed artists — Thomas books & manages these.
//   Label: DirtySnatcha, WHOiSEE
//   Management only (not on DSR): HVRCRFT, Dark Matter, Kotrax
//
// Label-only artists — Released on DSR but Thomas does NOT manage their booking.
//   OZZTIN, MAVIC, PRIYANX
//   Use LABEL_ONLY_ARTISTS for catalog / A&R work. Never pitch their booking.
// ─────────────────────────────────────────────────────────────────────────────

/** Artists Thomas actively manages — eligible for booking pitch generation */
export type PitchArtistSlug =
  | 'dirtysnatcha'
  | 'whoisee'
  | 'hvrcrft'
  | 'dark-matter'
  | 'kotrax'
  | 'dsr-takeover'

/** Artists on the DSR label but NOT managed by Thomas */
export type LabelOnlySlug = 'ozztin' | 'mavic' | 'priyanx'

/** All DSR-affiliated slugs (managed + label-only) */
export type AnyArtistSlug = PitchArtistSlug | LabelOnlySlug

export interface PitchArtist {
  slug: PitchArtistSlug
  name: string
  genre: string
  bio: string
  metrics: string
  topTracks?: string
  tourHistory?: string
  guarantee: string
  bookingContact: string
  bookingEmail: string
}

export const PITCH_ARTISTS: Record<PitchArtistSlug, PitchArtist> = {
  dirtysnatcha: {
    slug: 'dirtysnatcha',
    name: 'DirtySnatcha',
    genre: 'Dubstep / Riddim / Bass Music',
    bio: 'DirtySnatcha is a UK-born, US-based dubstep and riddim producer known for high-energy, unapologetic sets. Main stage performer at Lost Lands. Currently on the Take Me To Your Leader 2026 national tour.',
    metrics: '~8-9K monthly Spotify listeners | 4,500+ followers | 11K Instagram | Spotify Popularity Score: 28',
    topTracks: '"I Need Your High" (3.89M streams) | "Crashing" (1.31M) | "Get Fucked" (1.13M) | "Supersonic" (1.02M)',
    tourHistory: 'TMTYL 2026 — 17 confirmed US dates including Butte MT ($5K MAD Series), Asbury Park NJ, Hartford CT, Dallas TX and Houston TX (Infected Mushroom support)',
    guarantee: '$1,500 – $5,000 depending on market',
    bookingContact: 'Andrew @ AB Touring',
    bookingEmail: 'andrew@abtouring.com',
  },
  hvrcrft: {
    slug: 'hvrcrft',
    name: 'HVRCRFT',
    genre: 'Bass Music / Dubstep',
    bio: 'HVRCRFT is a Las Vegas and San Francisco-based bass music producer delivering hard-hitting, high-energy sets with a loyal following in West Coast and Southwest markets.',
    metrics: 'Growing fanbase — West Coast & Southwest specialist',
    guarantee: '$500 – $1,500 depending on market',
    bookingContact: 'Thomas Nalian — DirtySnatcha Records Management',
    bookingEmail: 'thomas@dirtysnatcha.com',
  },
  'dark-matter': {
    slug: 'dark-matter',
    name: 'Dark Matter',
    genre: 'Bass Music / Dubstep',
    bio: 'Dark Matter is a Chicago and Knoxville-based bass music producer with a Wakaan release and a growing national profile in the underground bass scene.',
    metrics: 'Wakaan-affiliated | Midwest & Southeast markets',
    guarantee: '$500 – $1,500 depending on market',
    bookingContact: 'Thomas Nalian — DirtySnatcha Records Management',
    bookingEmail: 'thomas@dirtysnatcha.com',
  },
  kotrax: {
    slug: 'kotrax',
    name: 'Kotrax',
    genre: 'Bass Music / Dubstep',
    bio: 'Kotrax is a Denver-based bass music producer with a tight following in Mountain and Midwest markets and a history of high-energy festival and club performances.',
    metrics: 'Mountain West specialist | Strong Denver fanbase',
    guarantee: '$500 – $1,000 depending on market',
    bookingContact: 'Thomas Nalian — DirtySnatcha Records Management',
    bookingEmail: 'thomas@dirtysnatcha.com',
  },
  whoisee: {
    slug: 'whoisee',
    name: 'WHOiSEE',
    genre: 'Dubstep / Bass Music',
    bio: 'WHOiSEE is a fast-rising dubstep and bass music producer on DirtySnatcha Records with a growing national profile and a loyal fanbase in the underground bass scene.',
    metrics: 'Growing national presence | DSR artist | Strong online engagement',
    guarantee: '$500 – $2,000 depending on market',
    bookingContact: 'Thomas Nalian — DirtySnatcha Records Management',
    bookingEmail: 'thomas@dirtysnatcha.com',
  },
  'dsr-takeover': {
    slug: 'dsr-takeover',
    name: 'DSR Takeover',
    genre: 'Dubstep / Riddim / Bass Music',
    bio: 'A full DirtySnatcha Records label showcase — multiple DSR artists on one bill for a complete takeover of your venue. Past lineups have featured DirtySnatcha, OZZTIN, HVRCRFT, and more. High-energy, cohesive brand experience for bass music audiences.',
    metrics: 'Multi-artist package | Full label branding | Combined fanbase across all DSR artists',
    guarantee: '$2,500 – $7,500 for the full package depending on market and headcount',
    bookingContact: 'Thomas Nalian — DirtySnatcha Records Management',
    bookingEmail: 'thomas@dirtysnatcha.com',
  },
}

export const PITCH_ARTIST_LIST = Object.values(PITCH_ARTISTS)

/** Label-only artists — catalog info only, do not use for booking pitch generation */
export const LABEL_ONLY_ARTISTS: Record<LabelOnlySlug, { name: string; genre: string }> = {
  ozztin:  { name: 'OZZTIN',  genre: 'Bass Music / Dubstep' },
  mavic:   { name: 'MAVIC',   genre: 'Bass Music / Electronic' },
  priyanx: { name: 'PRIYANX', genre: 'Bass Music / Electronic' },
}

/** @deprecated - kept for backwards compat */
export const INBOUND_ONLY_ARTISTS = [] as const
