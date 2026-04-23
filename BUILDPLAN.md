# TENx10 — Build Plan
> Written by Claude while Thomas was out. If I run out of credits, pick up here.

---

## What was just shipped (commits 51cf7bb → 4f5659e)

1. **Artist switcher** in dashboard sidebar — dropdown to flip between all 5 managed artists (DirtySnatcha, WHOiSEE, HVRCRFT, Dark Matter, Kotrax). Artist context flows via `?artist=<id>` URL param to every page.

2. **Dashboard fixed** — shows real confirmed revenue, pipeline value, upcoming shows, and active negotiations for the selected artist. No more hardcoded "DirtySnatcha Records — TMTYL 2026".

3. **Deals page fixed** — filters by selected artist's deals. Status filter via `?status=` param.

4. **Analytics rebuilt** — full demographics dashboard:
   - Spotify: monthly listeners, followers, popularity score, top tracks, top cities
   - Audience demographics: age + gender breakdown (Spotify + Instagram + TikTok)
   - DSP platform health table (Spotify, Apple, Amazon, Tidal, Deezer, SoundCloud)
   - Algorithm playbook (Release Radar, Discover Weekly eligibility checklist)

5. **Finance, Calendar, Artists pages** — all filter by selected artist now.

6. **Data fixes** (Supabase):
   - Duplicate DirtySnatcha artist fixed — thomas@dirtysnatcharecords.com now linked to the artist record with all 209 deals
   - MAVIC, OZZTIN, PRIYANX removed from management roster (label-only artists)
   - Gmail connection moved to correct user_id

---

## What a UTA-level manager needs that's still missing

### Priority 1 — Builds within a day

**A. Gmail offer auto-parsing pipeline**
- When an offer email hits Gmail, auto-extract: artist, date, city, venue, guarantee, promoter name/email/phone
- Create a deal card in `pending_review` status
- Show in a "New Offers" inbox on the dashboard
- Files to touch: `src/app/api/gmail/ingest/route.ts` (create), `InboxClient.tsx` (add offer cards)

**B. Deal pipeline kanban view**
- Column view: Inquiry | Offer | Negotiating | Confirmed | Completed
- Drag and drop to update status
- Show guarantee amount, show date, days out on each card
- File: `src/app/dashboard/deals/page.tsx` — add toggle between table and kanban

**C. Promoter contact cards with history**
- When you click a deal, show full promoter profile: past shows together, response rate, notes
- File: `src/app/dashboard/outreach/` — build `PromoterProfile.tsx`

### Priority 2 — Builds within a week

**D. Settlement tracking**
- Add `deposit_paid`, `deposit_amount`, `balance_paid`, `balance_amount`, `settlement_date` fields to deals
- Finance page shows which confirmed shows have unpaid deposits/balances
- Alert on dashboard if deposit is due within 14 days of show date
- Needs Supabase migration: `ALTER TABLE deals ADD COLUMN deposit_paid boolean DEFAULT false, ADD COLUMN deposit_amount numeric, ADD COLUMN balance_paid boolean DEFAULT false;`

**E. Routing intelligence**
- Given confirmed shows, find calendar gaps of 2+ days between cities
- Suggest fill markets based on Spotify listener density and routing efficiency
- Show on the dashboard market intelligence card with actual routing gaps highlighted

**F. Automated outreach drafts**
- For each city with high listener density and no confirmed show, auto-draft a pitch email
- Use the promoter database + AI to personalize
- File: `src/app/dashboard/outreach/SmartOutreachClient.tsx` already exists — needs real data wired in

**G. Morning briefing (automated daily email/notification)**
- 7am: email to Thomas with: shows this week, deals needing response, pipeline value, any deposits due
- Vercel Cron job calling a `/api/cron/morning-briefing` route
- This is the "autonomous agent" behavior — it should work while he sleeps

### Priority 3 — Architecture upgrades

**H. Spotify for Artists API connection**
- Real monthly listeners, top cities, save-to-stream ratio
- Replaces all the hardcoded numbers in analytics/page.tsx
- The `artists` table already has `spotify_artist_id`, `spotify_access_token`, `spotify_refresh_token`

**I. Artist analytics per-artist data store**
- Add `social_stats` JSONB column to `artists` table
- Migration: `ALTER TABLE artists ADD COLUMN social_stats jsonb DEFAULT '{}'::jsonb;`
- UI: Editable analytics page — Thomas can update Instagram/TikTok/SoundCloud numbers manually

**J. Multi-artist pipeline view**
- Dashboard overview shows deals across ALL managed artists, not just one
- Useful as the label manager view

---

## The honest UTA comparison

A top UTA manager has:
- Booking database (we have this — 209 deals in Supabase)
- Routing software (we need to build this)
- Promoter relationships (we have contacts table, needs better UI)
- Analytics subscriptions (Spotify for Artists, Chartmetric, Soundcharts)
- Gmail/email workflow (we have the shell, needs offer parsing wired)
- Contract templates (dashboard/contracts exists but is hollow)
- Settlement tracking (finance page exists but no deposit/balance fields)

**What we have that UTA doesn't:** AI-powered offer evaluation, automated routing suggestions, daily briefing automation. That's the competitive edge if we build it out.

**The gap:** UTA has 30 agents doing human relationship work. We need to automate the relationship layer — when to follow up, who to pitch, what to say. That's what makes this autonomous.

---

## Immediate next commands if credits run out

1. `git log --oneline -10` — see what was shipped
2. Check Vercel build: https://vercel.com/gibsomtom06s-projects/tenx10
3. Next code to write: the Gmail offer auto-parsing route at `src/app/api/gmail/ingest/route.ts`
4. Settlement tracking migration: run the SQL above in Supabase MCP
5. Morning briefing cron: `src/app/api/cron/morning-briefing/route.ts`

---

_Last updated: 2026-04-23 while Thomas was out getting food_
