# TENx10 Build Queue
# Last updated: April 24, 2026 — handoff from Cowork session
# Claude Code: read this file first, then check CLAUDE.md, then start on PRIORITY 1

---

## CONTEXT FROM THIS SESSION

### What was discussed
- The platform vision is now clear: **revenue is the single north star, all other metrics are KPIs that feed into it**
- The Phase 1 Intelligence Brief output (see screenshot context below) is the "Artist Revenue Sustainability Engine" — 7 pillars, monthly goal, gap, top 3 unlocks
- **Agent rename: Xai replaces X.** Xai is the AI manager persona powering both the /onboard intake and the ongoing artist-facing chat
- The /onboard page already has a strong Xai system prompt and conversational intake. Keep it, build on it.
- Manager onboarding (/onboarding) needs a full rebuild: currently only supports 1 artist, no invite system

### The Revenue Sustainability Engine (what Xai's brief outputs)
Seven pillars, each tracked separately:
1. **Live Performance** — guarantees × shows/mo. Lumpy, stops when touring stops.
2. **Streaming Royalties** — ~$0.004/stream. 250K streams = ~$1K/mo. Most artists at 40K.
3. **Publishing / Sync** — ASCAP/BMI PRO royalties + MLC + SoundExchange. Most artists uncollected = $0.
4. **Merch** — 15-20% of show guarantee. Decoupled from touring via online store = stable MRR.
5. **Content Monetization** — YouTube (1K subs + 4K watch hours), Patreon/fan subs.
6. **Education / Services** — sample packs, lessons, production services. Passive.
7. **Brand Deals** — gear, apparel, lifestyle. Reachable at 10K+ audience.

KPIs the agents track:
- Streams/month (target: 250K)
- Save-to-stream ratio (target: 10%+ for algo unlock, 15%+ threshold)
- Shows/month (target: 2+ for income stability)
- Income diversification: X of 7 pillars active

### Xai agent name — update everywhere
- CLAUDE.md says "Agent persona: X (tied to TENx10 multiplier concept)" — update to **Xai**
- The /onboard system prompt already uses Xai correctly
- Update any references to "X agent" or "Agent X" across the codebase

---

## PRIORITY 1 — FIX LIVE SITE HARDCODED CONTENT
**Blocking everything else. tenx10.co shows DSR-specific data to everyone.**

### 1a. Homepage (`src/app/HomepageClient.tsx`)
- The `ROSTER` constant hardcodes DirtySnatcha, WHOiSEE, DARK MATTER
- The services section references DirtySnatcha Records specifically
- Contact email is hardcoded: contact@dirtysnatcharecords.com
- Distribution partner "Virgin Music / Ingrooves" is hardcoded

**Fix:** Make the homepage generic TENx10 platform marketing copy (not DSR-specific). The roster section should either be removed from the public homepage entirely, or show a generic "featured artists" placeholder. The homepage is a product landing page — it should sell the platform, not showcase one label's roster.

### 1b. Artists page (`src/app/artists/ArtistsClient.tsx`)
- Full `ARTISTS` array hardcoded with bios, Spotify links, booking agencies, emails
- Links to dirtysnatcharecords.com throughout

**Fix:** This page can stay as a concept but should pull from the `artists` table in Supabase for any public-facing artists (where `is_public = true` or similar flag). For now, replace with a clean placeholder that says "Roster coming soon" or redirect to the manager's public page. Don't show DSR-specific artist data to all visitors.

### 1c. About page (`src/app/about/AboutClient.tsx`)
- Thomas Nalian's personal bio and career timeline are hardcoded
- This is fine for DSR's instance but wrong for a multi-tenant platform

**Fix:** Move this to a DSR-specific route like `/dsr/about` or make it tenant-aware. The public `/about` should describe TENx10 as a platform.

---

## PRIORITY 2 — MULTI-ARTIST MANAGER ONBOARDING
**Current /onboarding only supports 1 artist. Needs to support 5-10.**

### 2a. Rebuild the onboarding wizard (`src/app/onboarding/OnboardingWizard.tsx`)

New step structure:
```
Step 0: Your profile (full name, label name, your role)
Step 1: Add your roster (add multiple artists, each with: stage name, legal name, genre, floor guarantee, email, phone)
         - "Add artist" button — repeatable card UI
         - Minimum 1 required, up to 10
         - After adding each: show them in a list with edit/remove
Step 2: Connect your tools (Gmail OAuth, Google Calendar — skip Spotify for now, that's artist-side)
Step 3: Invite your team (optional — add agents, assistants by email + role)
Step 4: Go live — workspace ready, trigger invite emails to all artists
```

### 2b. Update API routes

`/api/onboarding/account` — already works, keep it

`/api/onboarding/artist` — currently inserts one artist. Update to:
- Accept an array of artist objects
- Insert all in a single transaction
- Return array of created artist IDs

`/api/onboarding/invite` — NEW route:
- Takes artist ID + artist email
- Generates a signed invite token (store in `artist_invites` table: id, artist_id, manager_id, token, expires_at, accepted_at)
- Sends invite email via Resend: "Your manager has invited you to TENx10..."
- Email contains magic link to `/artist/join/[token]`

### 2c. New database migration needed

```sql
CREATE TABLE artist_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  email text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);
-- RLS: manager can read/create their own invites. Artist can read their own by token.
```

---

## PRIORITY 3 — ARTIST JOIN FLOW
**Artists receive invite email → click link → join their profile**

### 3a. New page: `/artist/join/[token]`
- Read token from URL params
- Validate against `artist_invites` table (not expired, not already accepted)
- Show artist their pre-filled info (stage name, genre from manager's setup)
- Artist completes: bio, photo upload, social handles (IG, TikTok, SoundCloud)
- Connect Spotify for Artists (OAuth → pulls monthly listeners, PS, top cities)
- On submit: create Supabase auth user for artist, link to `artists.user_id`, mark invite accepted
- Redirect to `/artist` dashboard

### 3b. Artist dashboard entry point (`/artist/page.tsx`)
- Should check if artist has completed their profile (bio, at least one social, Spotify connected)
- If not: show completion nudge at top of dashboard
- Morning briefing card: show today's brief if available, or "Your first briefing will arrive tomorrow morning"

---

## PRIORITY 4 — ARTIST REVENUE SUSTAINABILITY ENGINE UI
**The dashboard widget Xai generates. This is the core value display.**

### 4a. Component: `RevenueEngine` (`src/components/dashboard/RevenueEngine.tsx`)

This is the centerpiece dashboard widget. Build it as a React component that accepts:
```typescript
interface RevenueEngineProps {
  monthlyGoal: number
  currentMonthlyIncome: number
  pillars: RevenuePillar[]
  kpis: AgentKPI[]
}

interface RevenuePillar {
  id: 1 | 2 | 3 | 4 | 5 | 6 | 7
  name: string // "Live Performance", "Streaming Royalties", etc.
  currentMonthly: number
  status: 'active' | 'uncollected' | 'untapped' | 'partial'
  note: string // "17 shows · $2,270 avg guarantee"
  warning?: string // "Lumpy. Stops when touring stops."
  nextUnlock?: string // "→ Add online store to decouple from touring"
}

interface AgentKPI {
  label: string
  value: string
  target: string
  status: 'on_track' | 'below_target' | 'critical'
}
```

Visual design based on the screenshot:
- Dark card (#1a1a1a background) with colored pillar cards
- Color coding: green border = active/healthy, orange = warning, red = $0/critical
- Monthly goal progress bar at top (purple gradient)
- 7 pillar cards in 3-column grid (last row: 1 wide pillar + 1 wide summary card)
- Summary card: "Current Estimated Monthly Income" — large $ figure, vs. goal, risk statement
- Bottom row: 4 KPI chips (Streams/mo, Save-to-stream, Shows/mo, Income diversification)

### 4b. Wire to Supabase data

The component should pull real data:
- Shows: query `shows` table for last 90 days, calculate avg guarantee × monthly show rate
- Streaming: query `dsp_metrics` for latest monthly_listeners, calculate estimated royalties
- Merch: if no merch table yet, use placeholder with note "Connect merch store to track"
- Everything else: show $0 with "uncollected" or "untapped" status and the next unlock action

### 4c. Place on manager dashboard AND artist dashboard
- Manager dashboard: shows aggregate across roster, can drill into per-artist
- Artist dashboard: shows their individual engine
- Both should have the 4 KPI chips at bottom

---

## PRIORITY 5 — ARTIST-FACING XAI CHAT
**Artists interact with Xai to get answers. Escalates to manager when needed.**

### 5a. Artist chat interface (`/artist/chat` or embedded in artist dashboard)
- Same conversational UI as /onboard but with a different system prompt context
- Xai already knows this artist (has their data from Supabase)
- Can answer: show status, advance checklist, streaming numbers, release schedule, what manager is working on
- If question requires manager action: Xai creates a task in the `tasks` table tagged to the manager, and tells the artist "I've flagged that for Thomas"

### 5b. Xai system prompt for ongoing artist chat (separate from intake prompt)

```
You are Xai — the AI manager at TENx10. You know this artist. Their data is loaded.

Your job: answer their questions, surface what matters, and route anything that needs a human.

When an artist asks something you can answer from their data: answer it directly.
When an artist asks something that requires manager action: say "I'll flag that for [manager name]" and create a task.
When an artist asks something you don't have data for: tell them exactly what's missing and how to fix it.

Never speculate about business decisions. Never make commitments on behalf of the manager. Never share other artists' data.

Voice: same as intake — direct, no hype, no exclamation marks. You're a team member, not a customer service bot.

ARTIST DATA:
[inject: artist name, genre, current PS, monthly listeners, upcoming shows, floor guarantee, manager name]
```

### 5c. Manager notification when artist escalates
- When Xai creates a task via artist chat: send notification to manager (email or in-platform)
- Task tagged with `source: 'artist_chat'`, `artist_id`, `created_by: 'xai'`
- Manager sees these in their inbox/task list

---

## PRIORITY 6 — MORNING BRIEFINGS
**Daily automated briefs. Artist version + Manager overview version.**

### 6a. Artist morning brief
Generates at 8am local time (or on first login of the day):
- Today's date + day of week
- Shows this week (with advance status)
- Release tasks due
- Streaming snapshot (listeners vs. last week)
- One action item from Xai based on current revenue engine gaps

### 6b. Manager morning brief (already exists via dsr-daily-briefing skill)
- Upgrade to pull from live Supabase data
- Show per-artist revenue engine status
- Flagged escalations from artist chats
- Upcoming shows across full roster
- Any offers in Gmail inbox that haven't been evaluated

### 6c. Scheduled task
- Use Supabase Edge Function or cron job to generate briefs nightly
- Store in `ai_conversations` table with `type: 'morning_brief'`, `artist_id`
- Both dashboards query for today's brief on load

---

## QUICK FIXES (do these alongside or between priorities)

- Update CLAUDE.md: change "Agent persona: X" to "Agent persona: Xai"
- Update any UI text that says "X" referring to the agent
- The `/onboard` page title/header — confirm it says "Xai" not "X"
- Add `is_public` boolean to `artists` table migration (for future public roster page)
- Fix: manager dashboard at `/dashboard` should show the RevenueEngine widget (roster-wide) not just a blank overview

---

## DO NOT BUILD (blocked or out of scope for now)

- Anything that requires Gigwell/agency integration — not in scope yet
- Discord/WhatsApp/SMS multi-platform connectors — architecture is there, don't build yet
- 2/3 vote system changes — submissions table only, leave it alone
- Stripe/payment processing — not yet
- Public artist profile pages — after invite flow is done

---

## TECHNICAL NOTES

- Run migrations via Supabase MCP (`mcp__5d12a360...`)
- Deploy via Vercel MCP (`mcp__4efc267c...`) — site is tenx10.co
- Test locally first: `npm run dev` in project root
- Don't break existing /onboard page — it's working and valuable
- All new DB tables need RLS policies — check CLAUDE.md for permission matrix
- Artist tier NEVER sees another artist's data. Manager tier sees their roster. Label_manager sees all.
- Email via Resend (already in package.json)
- Every component in TypeScript — no `any` types

---

*Generated from Cowork session with Thomas, April 24 2026*
*Resume here: everything above this line is confirmed direction*
