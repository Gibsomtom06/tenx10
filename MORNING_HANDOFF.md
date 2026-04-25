# Morning Handoff — April 24, 2026
## Built overnight by Claude Code | All changes live on tenx10.co

---

## 🔴 FIRST: YOU HAVE A SHOW TODAY

**DirtySnatcha @ DAYGLOW ATL — Atlanta, GA**
Confirmed. No guarantee on record — check the advance.

---

## What shipped overnight (5 commits, all live on Vercel)

| # | What | Where |
|---|------|-------|
| 1 | TypeScript errors fixed — push was blocked, now unblocked | — |
| 2 | **Revenue Sustainability Engine** — 7-pillar income dashboard | `/dashboard/revenue` |
| 3 | **Morning Briefing** — daily action list, color-coded urgency | `/dashboard/briefing` |
| 4 | **Artist Profile Edit** — artists can update bio/socials after joining | `/artist/profile` |
| 5 | **Xai rebranding** — agent page, both navs updated | throughout |
| + | Finance page: removed hardcoded "Lee" from commission breakdown | — |
| + | **Migration 017 applied** — `artist_invites` table is LIVE in production | done |

---

## Your roster right now (live DB data)

All artists managed by thomas@dirtysnatcha.com. **None have portal accounts yet.**

| Artist | Email on file | Portal | Action needed |
|--------|--------------|--------|---------------|
| DirtySnatcha | contact@dirtysnatcha.com | ❌ | Invite at `/dashboard/artists` |
| HVRCRFT | none | ❌ | Add email, then invite |
| Kotrax | none | ❌ | Add email, then invite |
| Dark Matter | none | ❌ | Add email, then invite |
| WHOiSEE | none | ❌ | Add email, then invite |
| MAVIC | none | ❌ | Add email, then invite |
| OZZTIN | none | ❌ | Add email, then invite |
| PRIYANX | none | ❌ | Add email, then invite |

**To invite an artist:** Go to `/dashboard/artists` → click **Invite** → enter their email. They get a magic link to set up their portal in 2 minutes.

---

## DirtySnatcha deal pipeline — real numbers

### Confirmed shows with amounts
| Date | City | Amount |
|------|------|--------|
| Apr 24 (TODAY) | Atlanta, GA — DAYGLOW ATL | no amount on record |
| May 15 | Butte, MT — MAD Series | **$5,000** |
| May 23 | Asbury Park, NJ | **$2,500** |
| May 30 | Hartford, CT | **$2,000** |
| Jun 6 | Dallas, TX | **$2,500** |
| Jun 7 | Houston, TX (Infected Mushroom support) | **$2,000** |
| Aug 8 | Bozeman, MT — Rappin The Rivers Festival | no amount on record |

**Confirmed w/ amounts: $14,000 gross / ~$11,200 net (80%)**

### Still also confirmed (no $ on record — gigwell import)
Jan 18 Pontiac MI, Mar 13 Tampa FL, May 30 Orlando FL

### Active inquiries / pipeline
Hartford CT (Apr 25), Asbury Park NJ (Apr 26), Butte MT (May 2), Irving TX (May 16), Houston TX (May 22), Cheyenne WY (May 23), Portland OR (Jun 18)

Many Jan–Apr inquiries are now past their show date with no status update — worth cleaning those up.

---

## One data issue to fix

You have **two Thomas accounts** in the DB:
- `thomas@dirtysnatcha.com` — this is your main working account (has all artists)
- `thomas@dirtysnatcharecords.com` — secondary, has 2 orphaned DirtySnatcha duplicate records

Also DirtySnatcha has **3 records** total (one per manager account). The one with `manager_id = f3ee39aa` (your main account) and `email = contact@dirtysnatcha.com` is the right one.

Not urgent, but worth cleaning up when you have 10 minutes.

---

## How to send artist invites (step by step)

Migration 017 is now applied — the invite system is fully live.

1. Go to **tenx10.co/dashboard/artists**
2. Find the artist row
3. Click **Invite** — an email input appears
4. Type their email → hit Send
5. They get an email from `noreply@tenx10.co` with a link
6. They click it → set up bio/socials → create their login → land on `/artist`

For artists without emails on file: click **View** → add their email in the artist detail, then come back and invite.

---

## Three new pages to check

**tenx10.co/dashboard/briefing** — your daily action list. Shows in next 7 days, active pipeline, urgent tasks, inbox. This is the page to open every morning.

**tenx10.co/dashboard/revenue** — Revenue Sustainability Engine. 7-pillar breakdown, editable monthly goal, active vs. potential. Live data from your deals. Click the goal number to edit it.

**tenx10.co/artist/profile** — artist-facing profile edit. After artists join, this is where they update their bio, Spotify, Instagram, TikTok, SoundCloud, website.

---

## Gmail reconnect (still broken)

`thomas@dirtysnatcharecords.com` Gmail OAuth tokens are expired. Go to **tenx10.co/dashboard/gmail** and reconnect. This restores offer detection from your inbox.

---

## What's still on the list for next session

- [ ] Spotify OAuth connect (pull real stream counts into Revenue Engine)
- [ ] Artist-facing Xai chat (`/artist/agent` exists but needs the full Xai persona wired)
- [ ] Duplicate artist/manager cleanup in DB
- [ ] DAD agent pipeline (the landing page is live at tenx10.co/dad)
- [ ] Rim Shop deploy via Netlify

---

*All commits on `master` — Gibsomtom06/tenx10. Vercel auto-deploys on push.*
*Last push: `f2a2939` — artist profile edit + nav polish*
