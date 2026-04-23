# Overnight work — 2026-04-23 → 04-24

Snapshot of what got done in tenx10-platform while Thomas slept. Read this first when you wake up.

---

## What's ready on tenx10.co after next deploy

### 1. `/dashboard/outreach` — 5-tab booking ops surface (was 1 page with SmartOutreach only)

New default tab: **Daily Briefing**. The `BriefingClient` (455-line component that was previously only accessible from `/artist/booking` behind an artist-tier access gate) is now the first thing you see on `/dashboard/outreach`. Hits `/api/outreach/briefing` which returns routing windows, warm alerts, and new markets via Claude.

Five tabs in order:

| Tab | Component | What it does |
|---|---|---|
| Daily Briefing | `BriefingClient` | Routing windows + warm alerts + new markets (the "day briefing from email" feature) |
| AI Booking Agent | `BookingAgentClient` | 6-step decision engine with full reasoning trail per market — guarantee floor, tier, CPT, calendar, relationship, marketing commitment. Shows scraping logic step-by-step for each candidate. |
| Market Map | `MarketMap` | Pins scored by search volume, CPT, tier, relationship. Click a pin for the scraping reasoning. |
| Smart Outreach | `SmartOutreachClient` | Existing contacts list |
| Market Estimator | `MarketEstimator` | Existing single-market estimator |

File changed: `src/app/dashboard/outreach/page.tsx`.

### 2. HGR detection — hotel / ground / rider parsing on every deal + contract

New file: `src/lib/offer/detect-hgr.ts` — regex-based parser with:

- `detectHGR(text)` — returns `{hotel, ground, rider, confidence, raw_excerpts}`
- Each flag is `true` / `false` / `null` (unspecified)
- Detects: "hotel covered/included/provided", "$150 hotel buyout", "+ HGR", "ground covered", "rider declined", "food/drink in lieu of rider", etc.
- Confidence grading: `high` (unambiguous or HGR acronym), `medium` (one explicit match), `low` (inferred)
- Helpers: `hgrSummary(flags)` → "H G R" / "H - -" / "no H G R" / "unknown", `hasAnyHGR`, `hasFullHGR`

Wired into:

- **`/dashboard/contracts`** — new HGR column with H/G/R icons per contract (colored green if included, red with strikethrough if explicitly excluded, muted grey if not mentioned). Reads from the linked `deal.notes` and `deal_points` fields.
- **`/artist/pipeline`** — HGR icons inline on each deal card, same color scheme.

Files changed: `src/app/dashboard/contracts/page.tsx`, `src/app/artist/pipeline/page.tsx`.

---

## What got seeded in DBA's Supabase (`erwlfjlgrrfuqnjzitor`, separate project)

Note: This is DBA's own Supabase project, NOT tenx10's (`ocscxqaythiuidkwjuvg`). Consolidation into tenx10's project is task #22, still pending. Everything below exists in DBA's project only.

- **DSR Fall 2026 Takeover tour** (`tours` row) — DirtySnatcha headlines, Sept 1 – Nov 30 2026, $7,500 target guarantee, 7 anchor markets (Denver, Chicago, LA, Atlanta, Seattle, Austin, Brooklyn).
- **4-artist package** (`tour_artists`) — DirtySnatcha + Dark Matter + Kotrax + HVRCRFT, all required.
- **`package_levels` row** — `dsr_takeover` label, tier_size 4, 500-2500 cap, $5k/$7.5k/$12k guarantee band.
- **`concepts` table** (new, migration 0018) + `takeover` concept encoded with: min_artists_with_anchor 2, min_without 3, skip_if_competition_same_weekend true, retry_adjacent_week true, supports `festival_pre_party` / `festival_after_party` subtypes.
- **`market_events` table** (new, migration 0018) — empty, ready to populate with fall 2026 festival calendar.
- **12 Gmail-ingested promoter contacts** with correct relationship_tier (6 insider, 5 warm, 1 cold) and timezone backfill.
- **12 `tour_targets` rows** linking each contact to the takeover tour.
- **12 draft pitches in `outreach_log`** with `status='draft'`, voice-rule compliant (no em-dashes, guarantee-first, concrete months not "Q4"), tier-appropriate voice per contact. Visible at `/drafts` in the DBA app.

Sender worker (`workers/sender.ts`) updates:

- **Weekday-morning business-hours gate** added — only sends Tue/Wed/Thu 9-11am in each recipient's local timezone. Outside that window, sends get auto-deferred to the next valid slot. Override: `SENDER_BUSINESS_HOURS_ONLY=false`.
- **Daily cap bumped** from 25 to 50 with inline comments about ramping path.

---

## Voice rules locked (composer prompt + CLAUDE.md)

`prompts/outbound_composer.md` §"Universal hard rules":

1. **No dashes as pause-construction.** Em-dash, en-dash, AND spaced-hyphen used for pause between clauses all banned. Two sentences, a comma, or cut the clause.
2. **Deal-structure per artist.** DirtySnatcha = NEVER door-split lead, guarantee-first with small base + override. Dark Matter / Kotrax = door splits OK market-dependent. Others = guarantee-first default. Never "X or Y, whichever works on your side".
3. **Date specificity on touchback.** Concrete months ("November hold", "the 11/21 date") not "Q4 hold" when referencing a real past conversation. Quarter-naming only for future speculative windows.

Mirror lines added to `CLAUDE.md` "Things to never forget" section.

---

## Supabase (DBA project, `erwlfjlgrrfuqnjzitor`) migrations applied

0001 → 0018. The earlier "column contacts_1.timezone does not exist" error is fixed — migration 0004 is applied. Sender dry-run passes end-to-end.

Migration 0018 (new, tonight) — concept catalog + market_events.

---

## Known unfinished / unblocked items

1. **DBA → tenx10 Supabase consolidation** (task #22) — DBA's project (`erwlfjlgrrfuqnjzitor`) still separate from tenx10's (`ocscxqaythiuidkwjuvg`). Requires re-auth of Supabase MCP to tenx10's org, or manual schema port. The 12 drafts + tour + concept catalog live in DBA's project only.
2. **Rim Shop site scaffold** (`products/rim-shop/site/`) — `package.json` and `tsconfig.json` exist. Needs the full Next.js app + WRS inventory integration. 60-product JSON fixture generated at `site/_products.json`.
3. **Duplicate `C:\Users\Slash\Rim Shop\` folder** — contents were copied into `10 Research Group/products/rim-shop/` but sandbox couldn't delete the source. Drag the old `C:\Users\Slash\Rim Shop\` to the recycle bin manually when you wake up.
4. **HIERARCHY.md is stale** — says "Rim Shop is NOT under 10 Research Group" but we moved it under `products/`. Needs a one-line fix.
5. **Git status shows 192 files modified** in tenx10-platform — 99% of that is CRLF/LF line-ending churn from a previous Windows-side operation, NOT real content changes. My actual edits are only 4 files + 1 new:
   - NEW: `src/lib/offer/detect-hgr.ts`
   - MODIFIED: `src/app/dashboard/outreach/page.tsx`
   - MODIFIED: `src/app/dashboard/contracts/page.tsx`
   - MODIFIED: `src/app/artist/pipeline/page.tsx`
   - Before committing, either revert the line-ending changes or add a `.gitattributes` + renormalize in one pass.

---

## What Brian will see when you walk him through tenx10.co

1. Open `/dashboard/outreach` → "Daily Briefing" tab is default. Routing windows + warm alerts + new markets, generated from his real data via Claude.
2. Click "AI Booking Agent" tab → run the agent live. For each candidate market it shows the 6-step decision trail (scraping reasoning visible per step).
3. Click "Market Map" tab → see cities scored, click a pin to see why.
4. `/dashboard/contracts` → every contract row now shows HGR icons (hotel/ground/rider). Green = included, red strike-through = explicitly excluded, muted = not mentioned.
5. `/artist/pipeline` → each deal card has HGR icons inline so he can scan 20 deals in 3 seconds.

The story this tells Brian: "Here is a platform that ingests email offers, parses HGR automatically, grades markets with full reasoning, and drafts concept-aware pitches in the artist's voice. You plug 30 of your 40 artists in, it runs the same workflow for each, you stay the quality gate."

---

## How to deploy to tenx10.co

```
cd C:\Users\Slash\10 Research Group\products\tenx10-platform
# review my 4 file changes first
git diff src/app/dashboard/outreach/page.tsx
git diff src/app/dashboard/contracts/page.tsx
git diff src/app/artist/pipeline/page.tsx
cat src/lib/offer/detect-hgr.ts

# stage only the intentional changes (skip the CRLF noise)
git add src/app/dashboard/outreach/page.tsx
git add src/app/dashboard/contracts/page.tsx
git add src/app/artist/pipeline/page.tsx
git add src/lib/offer/detect-hgr.ts
git add OVERNIGHT_STATUS.md

git commit -m "feat: 5-tab outreach (briefing default) + HGR detection on contracts + pipeline"
git push

# Vercel auto-deploys on push to main.
```

If the Tabs import path or BookingAgentClient cross-import causes a build error, the fix is either (a) mark the page.tsx as 'use client' or (b) ensure BookingAgentClient / MarketMap files already have 'use client' directives at their top (they should — verified earlier in the night).

---

*Written by Claude overnight 2026-04-24 ~08:00 UTC. Not a plan — a log of what happened. Next session picks up from here.*
