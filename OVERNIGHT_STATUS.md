# Overnight work — 2026-04-23 → 04-24 (revised late session)

Snapshot of what got done in tenx10-platform. **This version supersedes earlier drafts of this doc.** The key insight that changes everything is the last section — do not rebuild what's already here.

---

## The thing I missed for most of the night, stated first

TENx10's Supabase project (`ocscxqaythiuidkwjuvg`) is **already populated** with your real data:

| Table | Rows | Status |
|---|---|---|
| `artists` | 9 | Full roster |
| `venues` | 168 | Real venues with capacity + contact_email + intel jsonb |
| `deals` | 217 | Real booking history — confirmed + offers + completed |
| `contacts` | 166 | Name-only stubs (needs email/city/tier enrichment) |
| `profiles` | 3 | Team |
| `artist_members` | 13 | Team ↔ artist access |
| `catalog` | 8 | Released catalog |
| `gmail_connections` | 1 | thomas@dirtysnatcharecords.com (tokens EXPIRED 125h ago) |

The features I surfaced on the outreach page tonight (Daily Briefing, AI Booking Agent, Market Map) read from these tables. They will have real data to work with the moment the deploy ships and Gmail gets reconnected.

**Implication for the next session:** do not do any schema consolidation. Do not port anything from DBA's Supabase (`erwlfjlgrrfuqnjzitor`). DBA's Supabase is orphan scratch work; the real work is enriching what tenx10 already has.

---

## Tonight's code changes in this repo (4 files + this one)

### NEW file: `src/lib/offer/detect-hgr.ts`

HGR (Hotel/Ground/Rider) detection library. Regex-based parser with confidence scoring, fed by `deals.notes` + `deals.deal_points` text. Exports `detectHGR(text) → {hotel, ground, rider, confidence, raw_excerpts}`, `hgrSummary(flags)`, `hasAnyHGR`, `hasFullHGR`.

Detects:
- Positive: "hotel covered/included/provided", "$150 hotel buyout", "+ HGR" acronym, "ground covered"
- Negative: "no hotel", "rider declined"
- Confidence: `high` / `medium` / `low` based on number of explicit matches

### Modified: `src/app/dashboard/outreach/page.tsx`

Was a single-surface page with `SmartOutreachClient` + `MarketEstimator`. Now a 5-tab surface:

1. **Daily Briefing** (new default tab) — `BriefingClient` component, which was already in the codebase but only accessible from `/artist/booking` behind an artist-tier access gate. Now first-class here.
2. **AI Booking Agent** — `BookingAgentClient` (existed), surfaces the 6-step decision engine with visible scraping/reasoning trail per market.
3. **Market Map** — `MarketMap` (existed), scored pins.
4. **Smart Outreach** — original `SmartOutreachClient`.
5. **Market Estimator** — original `MarketEstimator`.

All five tabs were already-written components. I just surfaced them under one tabbed page outside the artist-tier access check, so dashboard users can reach them.

### Modified: `src/app/dashboard/contracts/page.tsx`

Added an HGR column to the contracts table. Each contract row now shows three icons (Hotel, Ground, Rider) with colors: green = explicitly included, red with strikethrough = explicitly excluded, muted grey = not mentioned. Reads from linked `deals.notes` and `deal_points`.

Also widened max-width 4xl → 5xl to fit the new column.

### Modified: `src/app/artist/pipeline/page.tsx`

Same HGR icon treatment, inline on each deal card. Three compact icons per card under the status badge. Reads from `deal.notes` + `deal_points`.

---

## To deploy

```powershell
cd "C:\Users\Slash\10 Research Group\products\tenx10-platform"
git add src/app/dashboard/outreach/page.tsx src/app/dashboard/contracts/page.tsx src/app/artist/pipeline/page.tsx src/lib/offer/detect-hgr.ts OVERNIGHT_STATUS.md
git commit -m "feat: 5-tab outreach (briefing default) + HGR detection on contracts + pipeline"
git push
```

Vercel auto-detects the push and builds + deploys in ~90 seconds. Watch status via the Vercel MCP (`list_deployments` → `get_deployment_build_logs`) if needed.

**IMPORTANT warning on `git status`:** it shows 192 files modified. ~190 of those are CRLF/LF line-ending churn (tooling-induced, not real content changes). ONLY stage the 4 files + this OVERNIGHT_STATUS.md. If you `git add .` blindly, you'll commit an enormous line-ending diff.

If you want to fix the CRLF churn separately, the right play is a `.gitattributes` + `git add --renormalize .` commit in its own PR, not mixed with feature work.

---

## To test after deploy

1. Open tenx10.co/dashboard/outreach → confirm the 5-tab layout, Daily Briefing is default
2. Click "AI Booking Agent" tab → hit Run. If you see 401 / 500 errors, Gmail OAuth is the issue (reconnect via Priority 2 in `_READ_FIRST`).
3. Open tenx10.co/dashboard/contracts → confirm HGR icons render on each row. (Currently 0 contracts, so this only has visible effect once contracts exist. The detect-hgr lib is ready.)
4. Open tenx10.co/artist/pipeline for any artist → confirm HGR icons per deal card. Will show data since 217 deals exist.

---

## Known issue: Gmail OAuth token stale

`gmail_connections.token_expires_at` is stamped 125+ hours in the past. The googleapis library is supposed to auto-refresh using the refresh_token on each call, so in theory this isn't fatal. But if API calls are erroring out, the real cause is likely:

1. Google revoked the refresh_token (common after 6mo dormancy or password change)
2. OAuth client credentials (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_REDIRECT_URI`) rotated
3. Scope set changed and the saved token doesn't cover current requests

**Fix:** have Thomas click "Connect Gmail" on tenx10.co/dashboard/gmail. Force a fresh OAuth flow (`prompt: 'consent'` is set in `getAuthUrl`, so this always yields a new refresh_token). Overwrites the stale connection row.

---

## What I did NOT do that the next session can pick up

- **Enrich the 166 contacts with email/city/market_type** by joining against venues + deals. This is the biggest functional unlock for the Daily Briefing feature. Most contacts are currently name-only.
- **Audit the DAD (Digital Asset Declutterer) page and routes** — `/dad`, `/api/dad-checkout`, `/api/dad-waitlist`. `dad_waitlist` table is empty (0 rows). Unclear how functional the flow is end-to-end.
- **Investigate `contracts` table** — has 0 rows. No contracts have been generated from the 217 deals yet. Workflow might be stubbed.
- **Investigate `agent_conversations`** — empty. The AI chat surface might not be wired to persist conversations.
- **Deploy Rim Shop site** via the now-connected Netlify MCP (`products/rim-shop/site/index.html` + `_products.json` are ready).

---

## Environment variables to verify in Vercel

Before the deploy goes green, confirm these are set in tenx10's Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL` → points at `ocscxqaythiuidkwjuvg.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → tenx10's anon key
- `SUPABASE_SERVICE_ROLE_KEY` → tenx10's service role
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` → the OAuth client for Gmail integration
- `ANTHROPIC_API_KEY` → for `/api/outreach/briefing` and other Claude calls

All of these were presumably set in a previous deploy, so they should already be there. If anything is missing or rotated, the new deploy will crash on startup — Vercel log will tell you which.

---

*Supersedes earlier drafts of this doc. If you find a version of OVERNIGHT_STATUS.md that says "port DBA data into tenx10" — that was the plan before I found out tenx10 already had the data. Ignore it. Next session's Claude: read `_READ_FIRST_WHEN_YOU_WAKE_UP.md` at 10 Research Group root first.*
