# TENx10 Platform — Claude Code Context
# DSR is the live proof of concept. This file loads automatically on every Claude Code session.
# Last Updated: April 2026

---

## WHAT THIS PROJECT IS

TENx10 is an AI-powered artist management SaaS platform. DirtySnatcha Records (DSR) is the live proof of concept — real artists, real shows, real data. The platform scales to any label, manager, or artist. DSR proves the framework works.

**Agent persona:** X (tied to TENx10 multiplier concept)
**Consumer-facing AI layer:** Gemini API
**Build/premium analysis layer:** Anthropic Claude API (claude-sonnet-4-20250514)
**Live site:** tenx10.co (Vercel + GitHub: Gibsomtom06/tenx10)

---

## TECH STACK

- Frontend: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Supabase (PostgreSQL + RLS + Storage)
- AI: Anthropic Claude API (build layer), Gemini API (consumer layer)
- Auth: Supabase Auth + OAuth (Spotify for Artists)
- Integrations: Gmail MCP, Google Drive MCP, Meta Ads MCP, Google Calendar MCP
- Distribution: VMG (Virgin Music Group) — DSR-specific. Platform is distributor-agnostic.

---

## DEEP CONTEXT: KNOWLEDGE BASE

Full domain knowledge lives in `TENx10_Knowledge_Base/` (26 files, 8,300+ lines). Reference with `@TENx10_Knowledge_Base/` when you need detailed module logic. Key files:

| File | Use When |
|---|---|
| 00_START_HERE.md | System overview, schema, hierarchy, file map |
| 03_KA_Part2_Booking_Money.md | Building booking/financial features |
| 04_KA_Part3_DSP_Content_Voice.md | Building streaming/content features |
| 14_Spotify_Popularity_Score.md | Implementing PS tracking/thresholds |
| 19_Platform_Spec.md | Dual-engine routing, Gmail/Gemini split |
| 24_Agent_Team_Architecture.md | 8-agent system, RJ Jackson persona, orchestrator |
| 25_Catalog_Evaluation_Engine.md | Per-track health scoring, marketing decisions |

Skills in `.claude/skills/` load on demand for heavy workflows. Don't memorize them — reference them.

---

## CURRENT BUILD PRIORITY

1. Gmail integration — offer → parse → 6-step engine → counter draft → Gmail drafts
2. Spotify for Artists OAuth — monthly listeners, popularity score, top cities, save-to-stream
3. Show offer-to-Gmail draft pipeline — full automation
4. Catalog evaluation engine — per-track scoring with marketing recommendations
5. Agent team orchestrator — route user intent to correct specialist agent

Do not build anything that blocks these unless explicitly directed.

---

## DATABASE: 27-TABLE SUPABASE SCHEMA

**Identity:** artists, users, promo_members
**Booking:** shows, promoters, venues, promoter_show_grades, venue_show_grades, agent_commissions, contracts
**DSP:** dsp_metrics, track_metrics
**Releases:** releases, release_marketing
**Content:** content_calendar, post_analytics, campaigns, assets
**A&R:** submissions (2/3 voting HERE ONLY — DSR A&R demo intake, nowhere else)
**Tasks:** tasks, task_completions
**AI:** ai_conversations, alerts
**Gmail:** gmail_outbox, email_threads
**Drive:** drive_folders, drive_files

**Enums (16):** user_tier (artist/manager/label/label_manager/admin), ai_provider (claude/gemini/system), show_status (15 states), email_category (12 types), plus 12 more.

**Functions:** is_label_tier(), is_manager_tier(), current_user_tier(), calc_submission_score, calc_submission_votes, update_promoter_grade

**Critical rules:**
- RLS enforced at DB level — artist tier NEVER sees another artist's data
- 2/3 vote = submissions table ONLY (A&R demo intake). Not shows. Not contracts.
- Multi-tenant: each label is isolated. DSR = label_id 1.

---

## 4-TIER PERMISSION HIERARCHY

```
label_manager (Thomas Nalian) — TOP TIER
  ├── Sees ALL: shows, financials, A&R, submissions, promoter grades, commissions
  ├── Manages artists as manager (10% commission via agent, 20% direct)
  └── Runs label A&R, catalog, releases, permissions

manager — TIER 2
  ├── Sees all roster shows, DSP, content, commissions
  └── Cannot see label financials or A&R queue

label — TIER 3
  ├── Full catalog, A&R, releases, permissions
  └── Cannot see individual manager commission details

artist — TIER 1 (OWN DATA ONLY)
  ├── Own shows, DSP metrics, content calendar, releases
  └── CANNOT see: promoter grades, other artists, label financials
```

| Data Type | Artist (T1) | Manager (T2) | Label (T3) | Label_Manager (T4) |
|---|---|---|---|---|
| Own DSP metrics | ✅ | ✅ all roster | ✅ all roster | ✅ all |
| Show guarantee | Label-controlled | ✅ | ✅ | ✅ |
| Commission breakdown | ❌ | ✅ | ❌ | ✅ |
| Promoter grades | ❌ | ✅ | ✅ | ✅ |
| Other artists' data | ❌ | Own roster | Own roster | ✅ all |
| Label financials | ❌ | ❌ | ✅ | ✅ |
| A&R submissions | Own only | ❌ | ✅ full queue | ✅ + vote |

**CRITICAL:** If these permissions are wrong, you get sued. Never expose label financials to artist tier.

---

## 8-AGENT SPECIALIST TEAM

NOT the old 6-agent system. Updated architecture with named personas and expanded domains.

| # | Agent | Codename | Domain |
|---|---|---|---|
| 1 | Booking Agent | The Deal Maker | Domestic + international routing, radius clauses, visa/tax, festival submissions |
| 2 | CMO/COO — Renee "RJ" Jackson | The Industry Veteran | PR, editorial pitching, playlist strategy, social strategy, cold outreach, label ops. FULL NAMED PERSONA — see @TENx10_Knowledge_Base/24_Agent_Team_Architecture.md |
| 3 | Social Media Architect | The Algorithm Whisperer | Platform-native content, per-platform playbooks (IG/TikTok/YouTube/X) |
| 4 | Artist Manager | The Strategist | White space identification, P&L, career trajectory, revenue diversification |
| 5 | Release Agent | The Launch Commander | Distribution, ISRC tracking, Day 0-7 execution, Popularity Score monitoring |
| 6 | Promo & UGC Manager | The Street Team Commander | UGC campaigns, download gates, fan activation, grassroots |
| 7 | UI/UX Designer | The Experience Architect | Mobile-first dashboards, glanceable UX (BUILD-TIME ONLY) |
| 8 | AI & Data Architect | The System Brain | Self-improving feedback loops, prompt optimization, data pipelines (BUILD-TIME ONLY) |

Agents 1-6 = tenant-facing (every user gets them). Agents 7-8 = internal (platform build only).

**Orchestrator** routes every request. Multi-agent coordination for daily briefings, offer evaluations, release planning.

---

## BOOKING DECISION ENGINE (6 STEPS)

1. Floor guarantee check — DS floor: $1,500
2. Market viability — venue capacity, market tier, previous shows
3. CPT analysis — ad spend ÷ projected tickets. Target <$5. Kill threshold: $8+
4. Calendar & routing — conflicts, natural routing pairs
5. Promoter credibility — A-F grade, history, responsiveness
6. Marketing commitment — promoter ad spend confirmed in writing ($150-$300 minimum)

Counter-offer always includes: adjusted guarantee, radius clause, payment timing, hotel buyout.

Commission: Agent-routed = 10/10/80. Direct = 20/80. Every offer tagged with originating agent.

---

## CATALOG EVALUATION ENGINE

Per-track health scoring across 4 dimensions (see @TENx10_Knowledge_Base/25_Catalog_Evaluation_Engine.md):

- Momentum (35%) — stream/save velocity, Shazam, TikTok audio re-use
- Engagement Quality (30%) — save-to-stream ratio (>10% strong, <5% pull spend)
- Popularity Score (25%) — Spotify thresholds: Track 20 = Release Radar, Track 30 = Discover Weekly
- Revenue Potential (10%) — per-stream rate, sync potential, merch tie-in

Grades S through F. S-tier gets 40% of marketing budget. F-tier gets zero.

Automated triggers: PS threshold crossings, save ratio drops, 6-week decay deadline, SoundCloud monetization opportunities.

---

## DSP ALGORITHMIC RULES

- Spotify dual-score: Artist PS (profile) + Track PS (per-ISRC)
- Track 20+ = Release Radar. Track 30+ = Discover Weekly.
- Save-to-stream 15%+ = algorithmic threshold. 10%+ = minimum.
- New ISRC every 6-8 weeks to prevent Artist PS decay
- Waterfall: bundle singles into EP under new UPC using same ISRCs
- Discovery Mode toggled in S4A directly — VMG has no role
- Never pre-release on SoundCloud — splits momentum, dilutes save-to-stream

---

## DSR REFERENCE DATA

**Label:** DirtySnatcha Records
**Artist:** DirtySnatcha — Lee Bray / Leigh Bray. NEVER "Lee Silva."
**Genre:** Dubstep, Riddim, Bass Music, Trap
**Distributor:** VMG via Assets platform

**Key people:**
- Thomas Nalian — Manager — thomas@dirtysnatcha.com / 248-765-1997 — SINGLE APPROVAL POINT
- Lee Bray — Artist — contact@dirtysnatcha.com / 586-208-6886
- Andrew Lehr — Primary Agent, AB Touring — andrew@abtouring.com
- Colton Anderson — Legacy Agent, PRYSM — colton@prysmtalentagency.com

**Current metrics (verify before using):** ~8-9K monthly listeners, PS 28, ~4,500 followers, 11K IG
**Tour:** TMTYL 2026, 17 shows, ~$38,600 guaranteed
**Label roster:** DirtySnatcha, OZZTIN, MAVIC, PRIYANX, WHOiSEE
**Managed only (not on label):** KOTRAX, HVVRCRFT, DARK MATTER

**Technical IDs:** Meta Pixel 701854965266742, GA4 G-PPES7BDNF3, Bandsintown bnds.us/snzptw

---

## VOICE PROFILE: DIRTYSNATCHA

Casual, direct, lowercase, no forced hype, no exclamation marks, no marketing buzzwords, no hyphens. Raw, authentic bass culture energy. "PLAY SOME F*CKING DUBSTEP ‼️" not "We're excited to announce our upcoming performance."

---

## DRIVE FOLDER STRUCTURE (PER SHOW)

```
[MM.DD.YYYY] [City, State] - [Venue Name]/
  ├── 00_CONTROL
  ├── 01_CONTRACT_&_PAYMENT
  ├── 02_ADVANCE_&_LOGISTICS
  ├── 03_TRAVEL
  ├── 04_MARKETING
  ├── 05_TICKETS
  └── 06_SHOW_ASSETS
```

---

## META ADS CAMPAIGN TAGS

- [BUILD] — Audience growth. Metric: CPF.
- [SONG] — Streaming push. Metric: save rate.
- [SHOW] — Ticket promo. Metric: CPT. Kill at $8+.

4-phase show system: Announcement → On-Sale → Maintenance → Final Push/Backend

---

## GUARDRAILS (ABSOLUTE)

- Never give legal advice
- Never guarantee outcomes
- Never fabricate metrics
- Never auto-execute financial transactions
- Never share label financials with artist-tier users
- Always cite data source
- Always check permission level before revealing data

---

## PLATFORM ARCHITECTURE RULES

- Distributor-agnostic: VMG is DSR's. Platform supports any.
- Multi-tenant: each label is isolated. DSR = label_id 1.
- RLS everywhere: DB level, not just app level.
- 2/3 vote = DB constraint on submissions only. Not optional. Not app logic.
- Build with scripts for .docx/.pptx generation.

---

*TENx10 Platform — CLAUDE.md v2.0 | April 2026*
*Do not delete this file. Claude Code reads it automatically on every session.*
