# CATALOG EVALUATION ENGINE
## Per-Track Health Scoring + Cross-DSP Marketing Recommendations
### Module 24 | Last Updated: March 6, 2026

---

## WHAT THIS DOES

This engine evaluates every track in the catalog and outputs specific marketing recommendations based on real metrics. It doesn't just describe what the numbers mean — it tells you what to DO about them. Every track gets a health grade, a trajectory classification, and a prioritized action list.

The engine runs across all DSPs — Spotify, Apple Music, Amazon, YouTube, SoundCloud, Pandora, and TikTok. Each platform has its own signals and levers.

---

## TRACK HEALTH SCORING MODEL

Every track is scored on 4 dimensions. Each score is 0-100. The weighted composite determines the health grade.

### Dimension 1: MOMENTUM (Weight: 35%)

Measures current velocity — is this track gaining or losing steam RIGHT NOW?

| Signal | Source | Scoring |
|---|---|---|
| Stream velocity (7-day) | S4A | Streams this week vs. last week. >10% up = strong, flat = neutral, >10% down = declining |
| Save velocity (7-day) | S4A | Saves this week vs. last week. Saves are the #1 intent signal |
| Playlist adds (7-day) | S4A | Net playlist additions. Positive = algorithmic traction |
| Shazam velocity | Apple Music for Artists | Regional spike = organic discovery happening |
| TikTok audio uses | TikTok Analytics | Tracks being used as Sounds = viral potential |
| SoundCloud reposts (7-day) | SoundCloud Stats | Community engagement signal |

**Scoring:**
- 80-100: Track is accelerating (streams + saves both trending up week-over-week)
- 60-79: Track has steady momentum (flat or slight growth)
- 40-59: Track is coasting (no growth, but not declining)
- 20-39: Track is declining (streams dropping, saves near zero)
- 0-19: Track is dead (minimal activity, no engagement signals)

### Dimension 2: ENGAGEMENT QUALITY (Weight: 30%)

Measures HOW listeners interact — not just IF they listen.

| Signal | Source | What It Means |
|---|---|---|
| Save-to-stream ratio | S4A | >10% = strong intent. 5-10% = average. <5% = passive listening |
| Completion rate | S4A | >80% = listeners love the whole track. <50% = they're skipping |
| Skip rate | S4A | <20% = strong retention. >40% = wrong audience or weak arrangement |
| Repeat listen rate | S4A | High repeat = superfan behavior, compounds Popularity Score |
| Share rate | S4A + social | Shares = strongest organic growth signal |
| YouTube Shorts re-use | YouTube Analytics | Others using your audio = algorithmic multiplier |

**The critical ratio: Save-to-Stream**

This is the single most important metric for determining whether a track deserves marketing spend:

| Save-to-Stream Ratio | Grade | Action |
|---|---|---|
| >15% | A+ | This track is resonating deeply. INCREASE spend. Feature in all content. |
| 10-15% | A | Strong. Maintain current campaigns. This is above Spotify's trigger threshold. |
| 7-10% | B | Decent but not exceptional. Optimize targeting — might be reaching the wrong audience. |
| 5-7% | C | Below threshold. Either refine ad targeting or accept this is a casual-listen track. |
| 3-5% | D | Poor engagement. Stop paid promotion. Let it ride organic only. |
| <3% | F | Wrong audience entirely. Any ad spend is wasted. Pull all campaigns. |

### Dimension 3: POPULARITY SCORE (Weight: 25%)

The algorithmic gatekeeper score on each DSP.

**Spotify Track Popularity Score:**

| Score Range | Status | What's Happening | Marketing Action |
|---|---|---|---|
| 0-9 | Cold | Algorithmically invisible. No test group. | Heavy save campaign ($100-150) + Discovery Mode ON + social push. Goal: get to 10+ for initial test group. |
| 10-19 | Warming | Small test group assigned. Algorithm is watching. | Maintain save campaign. Push "Search [artist] on Spotify" CTAs (search activity boosts score). Every save counts. |
| 20-29 | Active | Release Radar for non-followers UNLOCKED. | This is the critical zone. You're getting free algorithmic distribution. Maintain momentum — don't pull budget yet. Push for 30. |
| 30-39 | Hot | Discover Weekly territory UNLOCKED. | Organic is kicking in. Reduce paid spend by 50%. Focus on editorial pitch. Let the algorithm work. |
| 40-49 | Surging | Significant algorithmic surface area. | Minimal paid spend. Focus on sustaining through social + editorial. This is working. |
| 50+ | Breaking | Major algorithmic distribution. | Monitor only. Any paid spend is redundant — organic momentum is driving. Re-invest budget into other tracks. |

**Apple Music Listen Again Value (LAV):**

| LAV Range | Status | Action |
|---|---|---|
| <0.30 | Low | Listeners don't return. Shazam Spike campaign to get new listeners who might stick. |
| 0.30-0.50 | Medium | Some return engagement. Push Apple Music Artist Message for personal connection. |
| 0.50-0.65 | Good | Listeners coming back. Apple's algorithm is noticing. Maintain Shazam geo-targeting. |
| 0.65+ | Strong | High return rate. Apple will start featuring algorithmically. Focus on Siri voice search CTAs. |

**Amazon Music Voice Priority:**

| Signal | Action |
|---|---|
| Low Alexa plays | Push "Hey Alexa, play [track] by [artist]" CTA harder in social content. Confirm Musixmatch lyrics synced. |
| Medium Alexa plays | Alexa is picking it up. Add voice-specific CTAs to show recap posts. |
| High Alexa plays | Amazon's algorithm is prioritizing. This feeds into Amazon Music playlists automatically. Maintain CTAs. |

**Pandora AMP Status:**

| Status | Action |
|---|---|
| Not featured | Set as Featured Track in AMP dashboard (runs 8 weeks, free). Record Artist Audio Message. |
| Featured, low thumbs-up | Audience mismatch. Consider pulling from AMP to prevent thumbs-down damage. Pandora is RUTHLESS — early negative signals are permanent. |
| Featured, high thumbs-up | Working. Let it ride the full 8 weeks. Pandora will add to auto-generated stations. |

**YouTube Music / Shorts:**

| Signal | Action |
|---|---|
| Low Shorts audio re-use | Make audio available as a YouTube Short Sound. Post 3-5 Shorts with SEO titles. Ask support artists to use the audio. |
| Growing re-use | Algorithm is testing. Don't interrupt — keep posting Shorts using the track. |
| Viral re-use (50+ videos) | Algorithm has picked it up. Feature the best fan-made Shorts on your channel. This compounds. |

**SoundCloud:**

| Signal | Action |
|---|---|
| Low plays, low reposts | Post to genre-specific groups (Bass Heads FB group). Ask for comments specifically (heaviest SoundCloud signal). Repost from label account. |
| Moderate engagement | Healthy organic. Pin as Featured Track on profile. |
| High engagement | Consider redistributing through VMG if it's an organic-only release (Bucket 2). You're leaving royalties on the table. |

### Dimension 4: REVENUE POTENTIAL (Weight: 10%)

Measures financial return per stream and identifies monetization gaps.

| Signal | What to Check |
|---|---|
| Per-stream rate | VMG royalty reports. Bass music averages $0.003-0.004/stream. If below, investigate playlist quality (bot playlists tank rates). |
| Sync licensing potential | High-energy, clean drops work for gaming, action sports, trailers. Flag tracks with sync potential. |
| Merch tie-in potential | Tracks with strong identity ("Get Fucked" = easy merch phrase) should be merchandised. |
| Sample clearance status | If track samples anything, verify clearance before pushing it harder. Viral + uncleared sample = legal disaster. |

---

## TRACK HEALTH GRADES

Composite score from all 4 dimensions → letter grade → automatic action category:

| Grade | Score | Status | Category |
|---|---|---|---|
| S | 85-100 | STAR | Active promotion. This track is working — pour gas on it. Feature in all content, maintain ad spend, pitch to editorial. |
| A | 70-84 | STRONG | Maintain. Steady promotion, monitor for upgrade to S or decline to B. |
| B | 55-69 | BUILDING | Nurture. Low-cost save campaigns, social featuring, playlist pitching. Watch for breakout signals. |
| C | 40-54 | COASTING | Passive only. No ad spend. Include in content rotation but don't invest. Monitor for decay. |
| D | 25-39 | DECLINING | Decide: boost or let go. One last save campaign burst ($50, 72 hours). If no response, retire from active promotion. |
| F | 0-24 | DORMANT | Archive from active rotation. Zero spend. Track stays on DSPs but gets no marketing attention. Can be resurrected if used in a set/video that goes viral. |

---

## CATALOG-WIDE ANALYSIS

Beyond individual tracks, the engine evaluates the full catalog:

### Portfolio Health Distribution
```
Target distribution for a healthy catalog:
  S-tier: 1-2 tracks (your hits — feature everywhere)
  A-tier: 3-5 tracks (strong catalog — maintain)
  B-tier: 5-10 tracks (building — nurture selectively)
  C-tier: 10-20 tracks (catalog depth — passive)
  D/F-tier: Everything else — dormant archive

If you have ZERO S or A tracks → the next release MUST be treated
as the breakout attempt. All marketing budget concentrates here.
```

### Budget Allocation by Track Grade
| Grade | % of Marketing Budget | Logic |
|---|---|---|
| S | 40% | Your winners get the most fuel. Compounding returns. |
| A | 25% | Strong tracks get maintained. |
| B | 20% | Nurture bets — one of these might break through. |
| C | 10% | Minimal maintenance. Social mentions, no paid. |
| D/F | 5% | Emergency boost attempts only. Usually $0. |

### Decay Watch List
Tracks that were previously A/S tier but have dropped 15+ Popularity Score points in 30 days. These need a decision:
1. **Boost:** Save campaign burst ($75-100, 5 days) to re-spike before further decay
2. **Bundle:** Include in an upcoming EP waterfall to inherit existing streams under a new UPC
3. **Retire:** Accept the decline, move budget to newer tracks

### Catalog Gaps
- **No tracks above 30 Popularity Score?** → Release cadence problem. You need more ISRCs more frequently.
- **High streams but low saves across catalog?** → Audience quality problem. You're on playlists with passive listeners. Shift to targeted save campaigns.
- **Strong SoundCloud but weak Spotify?** → Distribution gap. Evaluate Bucket 2 tracks for VMG redistribution.
- **One track has 80% of total streams?** → Catalog dependency risk. Diversify promotion across 3-4 tracks.

---

## AUTOMATED TRIGGERS

The engine should fire alerts when:

| Condition | Alert | Recommended Action |
|---|---|---|
| Any track crosses Popularity Score 20 | 🟢 "Track X hit Release Radar threshold" | Monitor for 48hrs. If holding, reduce paid spend. |
| Any track crosses Popularity Score 30 | 🟢 "Track X hit Discover Weekly threshold" | Celebrate. Shift budget to next priority track. |
| Any track drops below Popularity Score 20 | 🔴 "Track X lost Release Radar" | Evaluate: save campaign burst or accept decline? |
| Save-to-stream ratio drops below 5% on active campaign | 🟡 "Track X save ratio critical" | Retarget ads. Current audience isn't saving. |
| Track not on any playlist for 14+ days | 🟡 "Track X fell off all playlists" | Pitch to independent curators. Discovery Mode ON. |
| New track Day 3 and Track PS still <10 | 🔴 "Release underperforming" | Double save campaign budget. Push social hard. |
| 6 weeks since last ISRC | 🔴 "Artist PS decay imminent" | Trigger release pipeline. Next track must be uploaded to VMG within 7 days. |
| SoundCloud track hits 10K plays with no ISRC | 🟡 "Monetization opportunity" | Evaluate for VMG distribution. |

---

## CROSS-DSP MARKETING DECISION TREE

When the engine evaluates a track and determines it needs marketing action, the platform allocates across DSPs based on where the opportunity is:

```
TRACK EVALUATED → Health Grade assigned
         ↓
WHICH DSP HAS THE BEST OPPORTUNITY?
         ↓
┌──────────────────────────────────────────────────────────┐
│ Spotify PS approaching threshold (20 or 30)?             │
│   → YES: Concentrate save campaign budget on Spotify     │
│   → NO: Check other platforms                            │
│                                                          │
│ Apple Shazam trending in a tour city?                     │
│   → YES: Shazam Spike campaign ($50-75 geo-targeted)     │
│   → NO: Check other platforms                            │
│                                                          │
│ TikTok audio starting to get re-used?                    │
│   → YES: Post 3 more TikToks with the track. Don't       │
│     interrupt organic momentum with paid.                 │
│                                                          │
│ SoundCloud track gaining without ISRC?                    │
│   → YES: Redistribute through VMG immediately.           │
│                                                          │
│ Amazon voice plays increasing?                            │
│   → YES: Push Alexa CTAs harder in content.              │
│                                                          │
│ YouTube Shorts getting re-used?                           │
│   → YES: Feature best fan Shorts. Post more.             │
│                                                          │
│ Nothing moving anywhere?                                  │
│   → Grade D/F. Stop spending. Focus on next release.     │
└──────────────────────────────────────────────────────────┘
```

---

## HOW THIS INTEGRATES WITH THE AGENT TEAM

| Agent | How They Use Catalog Evaluation |
|---|---|
| **Release Agent** | Runs the engine on every track weekly. Flags grade changes. Triggers decay alerts. Manages the portfolio distribution. |
| **CMO** | Uses S/A-tier tracks for editorial pitches. Doesn't waste curator relationships on C/D tracks. |
| **Social Architect** | Features S/A tracks in content. Uses B-tier tracks as variety. Ignores D/F. |
| **Artist Manager** | Reviews portfolio health distribution. Identifies revenue gaps. Sets quarterly targets for tier upgrades. |
| **Booking Agent** | Matches show markets to cities where S/A tracks have the most listeners. Routing informed by catalog geography. |
| **Promo Manager** | Designs UGC campaigns around S-tier tracks. Download gates use the hottest track, not the newest. |

---

## CURRENT CATALOG SNAPSHOT (DirtySnatcha — March 2026)

Based on the Spotify catalog export (137 tracks):

**Likely S/A Tier (verify current Popularity Scores on Musicstax):**
- I Need Your High — 3.89M streams (catalog anchor)
- Crashing — 1.31M streams
- Get Fucked — 1.13M streams
- Supersonic — 1.02M streams

**Current Release (critical monitoring window):**
- Drugs In Da Club (feat. BBX & Don Chido) — Released Feb 27, 2026. Day 7+ post-release. Track PS needs immediate Musicstax check.

**Action needed:** Run the full engine on all 137 tracks. Requires current Spotify for Artists data export (streams, saves, listeners per track for last 28 days) + Musicstax Popularity Score lookup for top 20 tracks.

---

*Catalog Evaluation Engine v1.0 — March 6, 2026*
