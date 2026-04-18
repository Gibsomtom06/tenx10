# CATALOG MANAGEMENT SYSTEM
## 5-Bucket Inventory + VMG Distribution + Catalog Intelligence
### Last Updated: March 6, 2026

---

## THE 5 CATALOG BUCKETS

Every track in the DirtySnatcha ecosystem falls into exactly one of these buckets. Each has different statuses, owners, monetization paths, and urgency levels.

### BUCKET 1: RELEASED & LIVE
Distributed through VMG, live on all DSPs + SoundCloud + YouTube.
These have ISRCs, UPCs, streaming data. They're working assets.

**Action needed:** Track decay, monitor popularity scores per ISRC, feed back into the release cadence clock (6-week rule). Monitor save-to-stream ratios. Protect ISRCs in waterfall EP bundles.

**Current status:** 137 tracks in Spotify catalog. Top performers by streams:
- I Need Your High — 3.89M streams
- Crashing — 1.31M streams
- Get Fucked — 1.13M streams
- Supersonic — 1.02M streams

### BUCKET 2: RELEASED — ORGANIC ONLY
SoundCloud exclusives, YouTube uploads, free downloads (Hypeddit).
No ISRC, no distribution deal, no royalty collection.
These are unmonetized assets sitting on the table.

**Action needed:** Evaluate each for redistribution through VMG, or strategic waterfall into upcoming EPs. Every unmonetized track with proven engagement is lost revenue.

### BUCKET 3: WIPs (Work In Progress)
Tracked, named, partially finished. No release date.
These need a production status tag and a decision.

**Production stages:**
- Skeleton (idea/loop only)
- Arranged (full structure, not mixed)
- Mixed (ready for mastering)
- Mastered (ready for distribution)
- Archived (decided not to release)

**Action needed:** Production stage tagging + release pipeline slot assignment. Every WIP needs a decision: finish it, archive it, or hand it to a collab.

### BUCKET 4: COLLABS (Outbound / Inbound)
Tracks involving other artists. Two sub-categories:

**a) Outbound:** You sent stems/ideas to someone — waiting on them.
**b) Inbound:** Someone sent you something — waiting on your response.

**Legal requirements:** Split sheets, credit agreements, ISRC ownership decisions.

**Action needed:** Status tracking + split sheet status + deadline pressure. Every collab older than 30 days without movement needs a follow-up.

### BUCKET 5: LABEL SUBMISSIONS
Tracks sent to external labels. Three sub-states:

**a) Pending** — sent, awaiting response. Track response deadline (21 days standard, some labels take 30-60).
**b) Accepted** — label will release. Track release date, contract terms, ISRC ownership.
**c) Rejected / Expired** — reroute to self-release via VMG or try another label.

**Action needed:** Submission tracker with deadlines. Auto-alert when a submission is >21 days old with no response.

---

## VMG DISTRIBUTION CATALOG

Distribution through Virgin Music Group (VMG) via Assets platform. VMG does NOT provide an API — use ISRC polling via Spotify API as the workaround for release confirmation.

**Label:** DirtySnatcha Records
**Catalog Numbers:** DSR series (e.g., DSR156, DSR159, DSR178)
**Parent Label:** EDM Spotlight (for some releases)
**Default Pricing:** T2 ($0.70 / $0.99 SRLP)
**Rights:** © and ℗ DirtySnatcha Records
**Publisher:** DirtySnatcha Records Publishing (ASCAP)
**Mechanical withhold:** Yes (standard for bass music distribution)

**Label Roster Releases:**
- DirtySnatcha (primary)
- selekta (label artist)
- OZZTIN (label artist)
- MAVIC (label artist)
- PRIYANX (label artist)
- WHOiSEE (label artist)

---

## ISRC POLLING WORKAROUND

Since VMG has no API for release status:

1. On release day, poll Spotify Web API: `GET /search?q=isrc:{ISRC_CODE}&type=track`
2. Once the ISRC returns a valid track URI → release is confirmed live
3. Auto-populate `spotify_uri` and `apple_id` into the release schema
4. Trigger the Day 0 release week checklist (Module 8 DSP Hack Checklist)

---

## CATALOG INTELLIGENCE INTEGRATION

**With Booking Engine (Module 6):** When evaluating show offers, check if the market has active listeners for the catalog. Shows in cities with existing listener base compound the Popularity Score. Shows in random markets with no listener base = wasted effort algorithmically.

**With Release Cadence (Module 12):** Every 6-8 weeks without a new ISRC, the Artist Popularity Score decays. The catalog tracker monitors time-since-last-release and triggers alerts.

**With Content Engine (Module 10):** Catalog tracks with momentum should be featured in social content. Declining tracks need save campaign boosts or retirement from active rotation.

**With Financial Engine (Module 7):** Royalty tracking per ISRC across VMG distributions. Identify which tracks generate the most revenue per stream.

---

## MONITORING STACK

| Tool | What It Shows | Frequency |
|---|---|---|
| Musicstax Metrics | Artist + Track Popularity Scores | Daily (morning check) |
| Spotify for Artists | Streams, saves, listeners, playlist adds | Daily (afternoon) |
| VMG Assets Dashboard | Distribution status, royalty reports | Weekly |
| Meta Ads Manager | Save campaign performance vs. Popularity Score movement | Daily during active campaigns |

---

*Catalog Management System v1.0 — March 6, 2026*
