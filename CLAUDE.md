# TENx10 Platform — Claude Code Context
# DSR is the live proof of concept. This file loads automatically on every Claude Code session.
# Last Updated: April 2026

---

## WHAT THIS PROJECT IS

TENx10 is an AI-powered artist management SaaS platform. DirtySnatcha Records (DSR) is the live proof of concept — real artists, real shows, real data. The platform is built to be distributor-agnostic and scale to any label, manager, or artist. DSR proves the framework works.

**Agent persona:** X (tied to TENx10 multiplier concept)
**Consumer-facing AI layer:** Gemini API
**Build/premium analysis layer:** Anthropic Claude API (claude-sonnet-4-20250514)

---

## TECH STACK

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL + RLS + Storage)
- **AI:** Anthropic Claude API (build layer), Gemini API (consumer layer)
- **Auth:** Supabase Auth + OAuth (Spotify for Artists)
- **Integrations:** Gmail MCP, Google Drive MCP, Meta Ads MCP, Google Calendar MCP
- **Distribution:** VMG (Virgin Music Group) via Assets platform — DSR-specific only, platform is distributor-agnostic

---

## CURRENT BUILD PRIORITY (HIGHEST REVENUE IMPACT FIRST)

1. **Gmail integration** — Inbound booking offer → parse → 6-step decision engine → counter email draft → save to Gmail drafts
2. **Spotify for Artists OAuth** — Pull monthly listeners, popularity score, top cities, save-to-stream ratio
3. **Show offer-to-Gmail draft pipeline** — Full automation: PDF offer in Gmail → evaluation → counter → draft saved

Do not build anything that blocks these three unless explicitly directed.

---

## DATABASE: 27-TABLE SUPABASE SCHEMA

### Core Tables
- `users` — user_id, name, email (dedup key), join_date, location, profile_types array (artist/consumer/concert_goer/downloader/promo_member), status
- `artist_profiles` — all artist data, linked to users
- `shows` — show_date, gig_type, venue, guarantee, deposit tracking, approval timestamps, travel/hotel/rider/deposit boolean flags, contract_type (flat/vs/bonus), bonus_threshold, bonus_amount, merch_split, support_artists (JSON array), campaign_phase, marketing_budget_digital, marketing_budget_creative, marketing_budget_street, cost_per_ticket
- `promoters` — name, company, email, phone, shows_worked, average_grade (A-F auto-calculated), PRIVATE access (never exposed to artist tier)
- `promoter_show_grades` — per-show promoter grading
- `venues` — venue data
- `venue_show_grades` — per-show venue grading
- `agent_commissions` — tracks originating agent per show for commission calculation
- `submissions` — A&R demo intake queue
- `contracts` — linked to shows, 2/3 vote enforcement at DB level
- `releases` — catalog management (5-bucket system)
- `release_marketing` — release campaign tracking
- `dsp_metrics` — platform metrics with timestamp (Spotify, Apple Music, etc.)
- `campaigns` — Meta Ads campaigns tagged [BUILD], [SONG], or [SHOW]
- `assets` — asset library (photo, video, graphic, audio, logo, template)
- `ai_conversations` — all AI agent responses and triggered actions logged
- `promo_members` — extends users with social connections, total_points, weekly_points, streak_weeks, inactivity_weeks
- `tasks` — task management
- `task_completions` — task completion tracking
- `post_analytics` — social post performance
- `labels` — label accounts (multi-tenant, isolated per label)
- `label_artists` — junction table, label → artist relationships with permission level
- `payments` — payment tracking per show (deposit + final)
- `contacts` — promoter/industry contact directory
- `voice_profiles` — per-artist voice profile JSON
- `content_calendar` — scheduled content per artist

### Critical Schema Rules
- **RLS enforced at DB level:** Artist tier NEVER sees another artist's guarantee, promoter grades, or label financials
- **2/3 vote constraint:** Hard DB constraint — no contract moves to Approved without 2 or 3 partner votes marked Yes
- **Multi-tenant:** Each label is a completely isolated tenant. DSR is label_id = 1. Platform supports unlimited labels.
- **Catalog 5-bucket system:** Released Full Distribution | SoundCloud/YouTube Only | Unreleased Collabs | Work in Progress | Vault

---

## PERMISSION MATRIX (ENFORCE IN ALL CODE)

| Data Type | Artist (Tier 1) | Manager (Tier 2) | Label (Tier 3) |
|---|---|---|---|
| Own DSP metrics | ✅ | ✅ all roster | ✅ all roster |
| Own show details | ✅ | ✅ all roster | ✅ all roster |
| Show guarantee amount | Label-controlled | ✅ | ✅ |
| Commission breakdown | ❌ | ✅ | ✅ |
| Promoter grades | ❌ | ✅ | ✅ |
| Other artists' data | ❌ | Own roster only | Own roster only |
| Label financials | ❌ | ❌ unless label owner | ✅ |
| A&R submissions | Own only | ❌ | ✅ full queue |

**CRITICAL:** If these permissions are wrong, you get sued. Never expose label financials to artist tier. Never expose promoter grades to artist tier.

---

## USER TIERS & CONTEXT OBJECTS

### Tier 1 — Artist
Independent artist or label-signed artist with their own login. Sees only their own data.

### Tier 2 — Manager
Manages a roster. Sees all artists on their roster. Commission rate stored per manager. Thomas Nalian is the DSR manager (10% commission).

### Tier 3 — Label
Full label account. Manages roster, A&R, financials, release pipeline. DSR is the test case label. Label financials hidden from all artist-tier users via RLS.

### Artist Tier Auto-Classification
| Tier | Monthly Listeners | Spotify Popularity | Shows (12mo) | Typical Guarantee |
|---|---|---|---|---|
| Emerging | < 10K | < 20 | 0-5 | $0 - $500 |
| Development | 10K - 50K | 20-35 | 5-15 | $500 - $1,500 |
| Mid-Level | 50K - 250K | 35-50 | 15-40 | $1,500 - $5,000 |
| Established | 250K - 1M | 50-70 | 40+ | $5,000 - $15,000 |
| Headliner | 1M+ | 70+ | 50+ | $15,000+ |

---

## AI AGENT SYSTEM: 6 SPECIALIST AGENTS

Every AI response runs through this pipeline:
```
USER INPUT → Intent Classifier → Context Assembly (Supabase) → Knowledge Module Injection → Gemini API → Response → Action Log
```

### Agent Roster
| Agent | Domain |
|---|---|
| Agent 1: A&R | Demo intake, scoring (Quality 40% / Reach 30% / Fit 30%), partner vote queue |
| Agent 2: Bookings | Show offer intake, routing, negotiation, contracts, financials, advance tracking |
| Agent 3: Tour Marketing | 4-phase campaign system, Meta Ads, CPT tracking, geo-targeting |
| Agent 4: Creative & Content | Asset management, content calendars, release marketing |
| Agent 5: Promo & UGC | Promo team management, points/leaderboard, UGC verification |
| Agent 6: Tech | API health, DB integrity, 2/3 vote enforcement, audit logging |

### Intent → Module Routing
| User Intent | Modules Loaded | Tables Queried |
|---|---|---|
| Booking / show offer | 5, 6, 7 | shows, artist_profiles, promoters, venues |
| DSP / streaming | 8 | dsp_metrics, releases |
| Content / marketing | 9, 10, 11 | shows, releases, campaigns, assets |
| Release planning | 12 | releases, dsp_metrics |
| Demo submission (label only) | 13 | submissions, label settings |
| Email / outreach | 18 | shows, artist_profiles, promoters |
| Multi-artist overview | 14, 16 | All artist_profiles under manager/label |
| Daily briefing | 14, 15, 16 | Full profile scan |
| Financial question | 7 | shows, payments, commissions |

---

## BOOKING DECISION ENGINE (6 STEPS)

Every show offer must pass through all 6 steps before Accept / Counter / Decline:

1. **Floor guarantee check** — Is the offer above the artist's minimum guarantee? (DS floor: $1,500)
2. **Market viability** — What's the venue capacity and market tier? Is the market saturated?
3. **Cost Per Ticket (CPT)** — Project ad spend ÷ projected tickets. Target CPT < $5. Kill threshold: $8+.
4. **Calendar & routing** — Does this show create a logical route? Does it conflict with existing dates?
5. **Promoter credibility** — Grade the promoter (A-F) based on history, responsiveness, marketing commitment.
6. **Marketing commitment** — Has the promoter committed ad spend in writing? Minimum $150-$300 depending on market.

### Counter-Offer Defaults (always include all three)
- Adjusted guarantee (never just the money)
- Radius clause
- Payment timing (deposit required, balance due night of show before set)
- Hotel buyout if travel required

### Commission Structure (DSR-specific, NOT a platform default)
- Agent routed: 10% agent / 10% manager (Thomas) / 80% artist (Lee Bray)
- Direct deal (no agent): 20% manager / 80% artist
- Every offer tagged with originating agent for commission tracking

---

## DSR REFERENCE DATA (PRE-LOADED TEST CASE)

### Label Identity
- **Label:** DirtySnatcha Records
- **Artist (Owner):** DirtySnatcha — legal name Lee Bray or Leigh Bray. **NEVER "Lee Silva"** — this is a known error in Master Operating Bible v3. Disregard it everywhere.
- **Genre:** Dubstep, Riddim, Bass Music, Trap
- **Distributor:** Virgin Music Group (VMG) via Assets platform
- **Tagline:** "PLAY SOME F*CKING DUBSTEP ‼️"

### Key People
- **Thomas Nalian** — Manager — thomas@dirtysnatcha.com / 248-765-1997 — Single point of approval for ALL show offers
- **Lee Bray (DirtySnatcha)** — Artist — contact@dirtysnatcha.com / 586-277-2537
- **Andrew** — Primary Booking Agent, AB Touring — andrew@abtouring.com
- **Colton Anderson** — Legacy Booking Agent, PRYSM — colton@prysmtalentagency.com / 734-904-0224
- **Shannon at VMG** — Handles Apple Music, Amazon Music, Tidal, Deezer submissions
- **Jamie Kingett** — Circus Records contact
- **Ben Lepper** — Monstercat A&R
- **Dylan Phillips** — RaveHouse Entertainment — ravehousetalent@gmail.com

### Current Metrics (verify before using — may be stale)
- Monthly listeners: ~8-9K
- Spotify followers: ~4,500
- Spotify Popularity Score: 28
- Instagram: ~11K followers
- SoundCloud: 6.5K (artist) + 2.5K (label) = ~9K combined

### Technical IDs
- Meta Pixel (DirtySnatcha): 701854965266742
- GA4 (DirtySnatcha): G-PPES7BDNF3
- Meta Pixel (DSR Label): 1254581742312645
- GA4 (DSR Label): G-560KBJQRZZ
- Bandsintown API Key: 3c7e62970f53fe395752f55139bbd81a
- Bandsintown Smartlink: bnds.us/snzptw

### Label Roster
- **Label artists:** DirtySnatcha, OZZTIN, MAVIC, PRIYANX, WHOISEE
- **Managed only (not on label):** KOTRAX, HVVRCRFT, DARK MATTER

### Publishing Entities
- DirtySnatcha Records Publishing — ASCAP — IPI 1238282844
- LAB10 — BMI — IPI 01262829440

### Meta Ads Accounts
- Ad Account 1: 810543424275407
- Ad Account 2: 461019786273565

### Current Tour: Take Me To Your Leader 2026 (TMTYL)
- 17 confirmed shows
- ~$38,600 total guaranteed income
- Source of truth: DSR_Tour_Status_Recalibrated (most current status doc)

---

## DSP ALGORITHMIC RULES (BAKE INTO ALL RELEASE/STREAMING LOGIC)

- **Spotify dual-score system:** Artist Popularity Score (profile-level) + Track Popularity Score (per-ISRC)
- **Track 20+** unlocks Release Radar eligibility
- **Track 30+** unlocks Discover Weekly eligibility
- **Save-to-stream ratio 15%+** = algorithmic threshold for Discovery Mode / Release Radar
- **10%+** = floor for meaningful algorithmic support
- **52% programmed audience** = structural growth problem (DSR current state)
- **New ISRC every 6-8 weeks** to reset decay clock
- **Waterfall ISRC strategy:** Bundle singles into EPs under new UPC using same ISRCs to inherit algorithmic authority
- **SoundCloud pre-release** splits momentum and dilutes Spotify save-to-stream ratio — avoid
- **Discovery Mode** is toggled in Spotify for Artists directly — VMG has no role in enabling it
- **VMG submission must cover all DSPs** — Apple Music, Amazon Music, Tidal, Deezer are commonly missed

---

## META ADS CAMPAIGN ARCHITECTURE

### Campaign Tagging System
- **[BUILD]** — Audience/following growth. Success metric: CPF (cost per follow).
- **[SONG]** — Streaming pushes. Success metric: Spotify save rate, streams.
- **[SHOW]** — Ticket promos. Success metric: CPT (cost per ticket sold). Kill threshold: $8+.

### 4-Phase Show Campaign System
1. Announcement — Day 1 of on-sale
2. On-Sale — First 2 weeks
3. Maintenance — Mid-campaign
4. Final Push/Backend — 10 days to show

### Targeting Rules
- Affinity targeting > genre interest targeting (genre interest wastes spend)
- Scratch/curiosity-hook creative significantly outperforms show/event promo formats on CTR
- VMG Smart Audience Ads: Fan Engagement type (pre-release) → Stream Growth type (on release day)

---

## INTEGRATIONS & OAUTH FLOW

```
User connects Spotify → OAuth consent → access + refresh tokens → stored in Supabase (encrypted)
→ Daily cron pulls latest metrics → stored in dsp_metrics table with timestamp
→ AI agent reads latest metrics when assembling user context
```

### Connected MCP Servers (Thomas's account)
- Gmail: https://gmailmcp.googleapis.com/mcp/v1
- Google Calendar: https://calendarmcp.googleapis.com/mcp/v1
- Google Drive: https://drivemcp.googleapis.com/mcp/v1
- Meta Ads: https://mcp.pipeboard.co/meta-ads-mcp

### Known Integration Quirks
- Gmail MCP reads email body reliably; cannot read PDF attachments (requires drag-and-drop or Chrome browser)
- Google Drive MCP: `mimeType = 'application/vnd.google-apps.document'` surfaces native Docs but misses PDFs/Sheets/Word — separate queries needed
- Hypeddit supports Facebook, Google Ads, TikTok Ads pixel integrations only — GA4 not supported

### VMG Delivery Timelines
- Standard DSPs: Day 0
- Africa/MENA: Day 3-5
- Asia-Pacific: Day 3-7
- China (via UMG/Tencent/NetEase): Day 5-10

---

## GOOGLE DRIVE FOLDER STRUCTURE (DSR)

**Root folder:** DirtySnatcha_TMTYLT_2026 (ID: 1TQnx4iTH7VgmdSeW9mxloIuLzjMlAgz-)

**Show folder naming:** `[MM.DD.YYYY] [City, State] - [Venue Name]`

**Auto-generated per show:**
- 00_CONTROL: Offer email, negotiation thread, approval record, deal summary
- 01_CONTRACT_&_PAYMENT: Contract, deposit/final payment confirmation, settlement sheet
- 02_ADVANCE_&_LOGISTICS: Advance sheet, all confirmations
- 03_TRAVEL: Flight monitoring, hotel confirmations
- 04_MARKETING: Ad copy, content, spend tracker, FB event link, post-show report
- 05_TICKETS: Ticket tracker, giveaway log
- 06_SHOW_ASSETS: Rider PDF, setlist, press photo + bio

---

## VOICE PROFILE: DIRTYSNATCHA

- **Tone:** Hype, raw, authentic, unapologetic, bass culture
- **Language:** Casual, uses profanity naturally, slang
- **Emoji:** 🔥 🙏 ‼️ heavy use
- **Capitalization:** Mixes caps for emphasis. Brand always "DirtySnatcha."
- **Caption length:** Short and punchy. Never corporate.
- **Tagline:** "PLAY SOME F*CKING DUBSTEP ‼️"
- **Example:** "I played supersonic at the main stage at lost lands 🙏🔥🔥🔥"
- **NOT:** "We're excited to announce our upcoming performance."

---

## PLATFORM ARCHITECTURE RULES (NON-NEGOTIABLE)

- **Distributor-agnostic:** VMG is DSR's distributor. The platform supports any distributor. Never hardcode VMG logic into platform core.
- **Multi-tenant:** Every label is a completely isolated tenant. DSR is label_id = 1.
- **RLS everywhere:** Row Level Security enforced at DB level, not just application level.
- **No label financials to artist tier:** Ever. Not even accidentally.
- **2/3 vote constraint is a hard DB constraint:** Not application logic. Not optional.
- **Build with scripts, not file unpacking:** Recreate documents from scripts for all .docx/.pptx generation. More reliable in this environment.

---

## GO-TO-MARKET: TENX10 SAAS

- **Sales strategy:** Manager-first. Target 10 manager accounts within 60 days of launch.
- **Pricing tiers:** Solo artist | Manager (up to 5 artists) | Label/Agency (unlimited, white-label)
- **Add-on revenue:** Done-for-you onboarding as a paid service
- **Post calendar system:** Auto-generates daily content based on platform-specific algorithms tied to user's primary goal (RIAA certification, playlist placement, sellout show, new release traction). Executes posts automatically.

---

## GUARDRAILS (ABSOLUTE — NEVER VIOLATE)

- Never give legal advice. Flag key terms, recommend a music attorney.
- Never guarantee outcomes. Use "based on comparable shows, expected attendance is X."
- Never fabricate metrics. If data isn't available, say what's missing.
- Never auto-execute financial transactions. Payments and signatures require human action.
- Never share label financials with artist-tier users.
- Always cite data source: "Based on your Spotify for Artists data..." or "Based on Tour Status doc..."
- Always check permission level before revealing data.

---

## OPEN ITEMS (KNOWN DATA GAPS)

1. Meta Ads API credentials not yet configured
2. Rollout tracker: No shows have ticket links, pixels, UTM tracking, or ads live yet
3. Contract signed = FALSE for all shows currently
4. Per-show marketing budget not specified in all show records
5. Local promotion company database needs per-market contact info
6. Deposit status unclear for most upcoming shows

---

*TENx10 Platform — CLAUDE.md v1.0 | Generated April 2026*
*Do not delete this file. Claude Code reads it automatically on every session launch.*
