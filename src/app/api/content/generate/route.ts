import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'

export interface ContentPost {
  day: number
  date: string
  platform: 'instagram' | 'tiktok' | 'twitter' | 'facebook' | 'soundcloud' | 'all'
  type: 'hype' | 'show-announce' | 'behind-scenes' | 'track-push' | 'merch' | 'fan-engagement' | 'tour-update'
  caption: string
  callToAction: string
  hashtags: string[]
  mediaNote: string
  goal: 'awareness' | 'engagement' | 'conversion'
}

export interface ContentCalendar {
  artistName: string
  weekStarting: string
  theme: string
  posts: ContentPost[]
  weeklyGoal: string
  generatedAt: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { artistSlug, focus, weekStarting, upcomingShow } = await request.json() as {
    artistSlug: string
    focus: 'show' | 'release' | 'growth' | 'engagement'
    weekStarting: string
    upcomingShow?: { city: string; date: string; venue?: string }
  }

  // Pull confirmed shows
  const { data: deals } = await supabase
    .from('deals')
    .select('title, show_date, deal_points')
    .in('status', ['confirmed'])
    .gte('show_date', new Date().toISOString().split('T')[0])
    .order('show_date', { ascending: true })
    .limit(5)

  const upcomingShows = (deals ?? []).map(d => {
    const pts = d.deal_points as Record<string, string> | null
    return `${pts?.city ?? d.title} on ${d.show_date}`
  }).join(', ')

  const ARTIST_CONTEXT: Record<string, string> = {
    dirtysnatcha: `Artist: DirtySnatcha
Genre: Dubstep / Riddim / Bass Music
Tagline: "PLAY SOME F*CKING DUBSTEP ‼️"
Voice: raw, hype, unapologetic, uses profanity naturally, casual, all-caps for emphasis
Emojis: 🔥 🙏 ‼️ heavy use. Short punchy captions. Never corporate.
Top tracks: "I Need Your High" (3.89M), "Crashing" (1.31M), "Get Fucked" (1.13M), "Supersonic" (1.02M)
Tour: TMTYL 2026 — 17 shows nationwide
Instagram: @dirtysnatcha (11K followers)
SoundCloud: 9K combined followers`,
  }

  const context = ARTIST_CONTEXT[artistSlug] ?? `Artist: ${artistSlug}. Genre: Electronic / Bass Music.`

  const focusContext = {
    show: `FOCUS: Show promotion. ${upcomingShow ? `Upcoming show: ${upcomingShow.city} on ${upcomingShow.date}${upcomingShow.venue ? ` at ${upcomingShow.venue}` : ''}. ` : ''}${upcomingShows ? `All upcoming shows: ${upcomingShows}.` : ''}`,
    release: 'FOCUS: New release promotion — drive streams and saves. Push track saves hard. Spotify save rate is currently 12% and needs to reach 15%.',
    growth: 'FOCUS: Audience growth — attract new fans. Scratch/curiosity hooks perform best. Avoid generic "new music" posts.',
    engagement: 'FOCUS: Fan engagement — build community, reply to comments, create shareable content. Think: "what would fans screenshot or share?"',
  }[focus]

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: `You are X, an AI content strategist for DirtySnatcha Records.
Generate authentic social media content in the artist's voice — never generic or corporate.
Respond with valid JSON only. No markdown.`,
    messages: [{
      role: 'user',
      content: `Generate a 7-day social media content calendar for the week starting ${weekStarting}.

${context}

${focusContext}

Generate 7-10 posts across the week. Mix platforms and types.

Respond with this exact JSON:
{
  "theme": "<one-line theme for this week>",
  "weeklyGoal": "<what success looks like this week>",
  "posts": [
    {
      "day": <1-7>,
      "date": "<YYYY-MM-DD>",
      "platform": "<instagram|tiktok|twitter|facebook|soundcloud|all>",
      "type": "<hype|show-announce|behind-scenes|track-push|merch|fan-engagement|tour-update>",
      "caption": "<full caption in the artist's authentic voice>",
      "callToAction": "<specific CTA — e.g. 'link in bio' or 'grab your ticket'>",
      "hashtags": ["<hashtag>"],
      "mediaNote": "<what photo/video/graphic to use>",
      "goal": "<awareness|engagement|conversion>"
    }
  ]
}`,
    }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'

  let parsed: { theme: string; weeklyGoal: string; posts: ContentPost[] }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Parse failed', raw }, { status: 500 })
  }

  const calendar: ContentCalendar = {
    artistName: artistSlug === 'dirtysnatcha' ? 'DirtySnatcha' : artistSlug,
    weekStarting,
    theme: parsed.theme,
    posts: parsed.posts,
    weeklyGoal: parsed.weeklyGoal,
    generatedAt: new Date().toISOString(),
  }

  return NextResponse.json(calendar)
}
