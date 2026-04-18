'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Music2, Video, Radio, type LucideIcon } from 'lucide-react'

interface DspPlatform {
  name: string
  description: string
  url: string
  icon: LucideIcon
  iconColor: string
  category: 'streaming' | 'video' | 'radio'
  features: string[]
  tip: string
}

const DSP_PLATFORMS: DspPlatform[] = [
  {
    name: 'Spotify for Artists',
    description: 'Listener data, editorial pitch, Discovery Mode, Marquee',
    url: 'https://artists.spotify.com',
    icon: Music2,
    iconColor: 'text-[#1DB954]',
    category: 'streaming',
    features: ['Monthly listeners', 'City breakdown', 'Discovery Mode', 'Release Radar pitch', 'Marquee ads'],
    tip: 'Toggle Discovery Mode per track — requires 10%+ save-to-stream ratio to work.',
  },
  {
    name: 'Apple Music for Artists',
    description: 'Deep analytics, Shazam data, playlist placement',
    url: 'https://artists.apple.com',
    icon: Music2,
    iconColor: 'text-[#FA243C]',
    category: 'streaming',
    features: ['Plays, listeners, Shazams', 'City + country data', 'Playlist source tracking', 'iTunes store metrics'],
    tip: 'Apple Music shows Shazam data — a high Shazam rate means organic discovery is working.',
  },
  {
    name: 'Amazon Music for Artists',
    description: 'Streaming analytics + Alexa voice play tracking',
    url: 'https://artists.amazonmusic.com',
    icon: Music2,
    iconColor: 'text-[#FF9900]',
    category: 'streaming',
    features: ['Streams + listeners', 'Alexa voice plays', 'Prime audience data', 'Artist notifs'],
    tip: 'Amazon Prime Music has 100M+ subscribers — worth optimizing for even at lower volumes.',
  },
  {
    name: 'Pandora AMP',
    description: 'Radio-style analytics + Artist Marketing Platform',
    url: 'https://amp.pandora.com',
    icon: Radio,
    iconColor: 'text-[#3668FF]',
    category: 'radio',
    features: ['Listener thumbs up/down data', 'Station adds', 'AMPcast (direct-to-listener audio msg)', 'Sponsored listening'],
    tip: 'AMPcast lets you record a voice message that plays for fans on Pandora — free, high engagement.',
  },
  {
    name: 'Deezer for Creators',
    description: 'Analytics for Deezer streaming activity',
    url: 'https://creators.deezer.com',
    icon: Music2,
    iconColor: 'text-[#A238FF]',
    category: 'streaming',
    features: ['Streams by country', 'Listener demographics', 'Playlist placement', 'DZRL submission'],
    tip: 'Deezer is strongest in France, Brazil, and Germany — useful for international touring data.',
  },
  {
    name: 'YouTube Studio / Analytics',
    description: 'Video performance, audience data, Content ID revenue',
    url: 'https://studio.youtube.com',
    icon: Video,
    iconColor: 'text-[#FF0000]',
    category: 'video',
    features: ['Views, watch time, impressions', 'Audience retention', 'Revenue (if monetized)', 'Search discovery', 'Content ID claims'],
    tip: 'YouTube search is the #2 music discovery engine — optimize video titles and descriptions for SEO.',
  },
]

const CATEGORY_LABELS = {
  streaming: 'Streaming DSP',
  video: 'Video Platform',
  radio: 'Radio Platform',
}

const CATEGORY_COLORS: Record<string, string> = {
  streaming: 'bg-green-500/10 text-green-700 dark:text-green-400',
  video: 'bg-red-500/10 text-red-700 dark:text-red-400',
  radio: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
}

export default function DspToolbox() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">DSP Artist Toolboxes</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Direct links to every platform analytics dashboard — all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {DSP_PLATFORMS.map(platform => {
          const Icon = platform.icon
          return (
            <Card key={platform.name} className="group hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${platform.iconColor}`} />
                    <CardTitle className="text-sm">{platform.name}</CardTitle>
                  </div>
                  <Badge className={`text-[10px] ${CATEGORY_COLORS[platform.category]}`} variant="outline">
                    {CATEGORY_LABELS[platform.category]}
                  </Badge>
                </div>
                <CardDescription className="text-xs">{platform.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  {platform.features.map(f => (
                    <div key={f} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">·</span> {f}
                    </div>
                  ))}
                </div>
                <div className="bg-muted/30 rounded px-2.5 py-2 text-[11px] text-muted-foreground italic">
                  {platform.tip}
                </div>
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full text-xs font-medium py-1.5 rounded-md border hover:bg-muted/50 transition-colors"
                >
                  Open Dashboard <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
