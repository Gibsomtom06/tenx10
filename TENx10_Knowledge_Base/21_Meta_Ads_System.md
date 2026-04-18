# META ADS SYSTEM
## Campaign Architecture + Analyzer Skill + Diagnosis References
### Last Updated: March 6, 2026

---

## 4-PHASE CAMPAIGN ARCHITECTURE

Adapted from Crankdat Atlanta ad template. Each show gets 4 phases.

| Phase | Name | Objective | Timing | Budget Share |
|---|---|---|---|---|
| 1 | ANNOUNCEMENT | Traffic | Show confirmed | 20% (artist budget) |
| 2 | ON-SALE | Sales | Tickets live | 20% (promoter co-spend begins) |
| 3 | MAINTENANCE | Sales | Mid-period | 10% (promoter co-spend) |
| 4 | BACKEND / FINAL PUSH | Sales | Last 1-2 weeks | 50% (promoter co-spend) |

**Phase transitions require ad check triggers:**
- After On-Sale → ANN/OSL performance report before Maintenance starts
- In Backend → swap worst-performing creative asset for approved live clip

**Platforms:** Meta (Facebook/Instagram) + TikTok
**Creative per phase:** Static 1x1, 9x16 + Video trailer 1x1, 9x16
**Exclusions:** After On-Sale, exclude current ticket purchasers

## AFFINITY TARGETING LIST

Bass music interest targeting (ages 18-44):
12th Planet, Subtronics, Borgore, Doctor P, Excision, Flosstradamus, Flux Pavilion, NGHTMRE, RL Grime, Slander, Zeds Dead, Zomboy, Marauda, Svdden Death, Kompany, Bear Grillz, Sullivan King, Wooli, Rusko, Dion Timmer, Ray Volpe, Riot Ten, Kai Wachi, Barely Alive, ATLiens, Alienpark, HOL!, ILLENIUM

## AD BUDGET PER SHOW (DirtySnatcha Side)

| Category | Budget | Notes |
|---|---|---|
| Shazam Spike Campaign | $50-75 per show | Geo-targeted to show city, 3-5 days before |
| Spotify Save Campaign | $50-100 for 7 days | During release week, targeting tour markets |
| Per-Show Retargeting | $0-100 | Pixel-dependent |
| **Total per show** | **$50-175** | |
| **Total tour (14 shows)** | **$850-1,350** | |

---

---
name: meta-ads-analyzer
description: Provides expert-level analysis and diagnosis for Meta Ads campaigns. Use this skill to interpret performance data, identify root causes of issues, and generate actionable recommendations, with a special focus on correctly handling the 'Breakdown Effect'.
---

# Meta Ads Analysis & Diagnosis Skill

## When to Use This Skill

Use this skill when you need to **analyze and diagnose Meta Ads campaign performance**, including:
- Interpreting campaign, ad set, or ad-level performance data
- Identifying root causes of performance issues
- Generating actionable optimization recommendations
- Understanding why Meta's system makes certain budget allocation decisions

## Result Recommendations (MANDATORY for Final Reports)

> **IMPORTANT:** The following rules are **MANDATORY** and **MUST be strictly followed** when writing the final analysis report. These are not optional guidelines—they define the required standards for all deliverables.

- **NEVER recommend pausing or reducing budget for any segment based solely on higher average CPA/CPM in breakdown reports.** Higher average cost does NOT mean poor performance—it often reflects the system capturing low *marginal* cost opportunities earlier. Removing segments may increase overall costs. Always frame changes as testable hypotheses, not directives.
- **ALWAYS justify recommendations with data evidence, Meta's system mechanics, and expected impact on *overall campaign performance*.**
- **EVERY insight must include data evidence and explanation.** Every recommendation must be actionable and verifiable.
- **ALIGN WITH OFFICIAL RECOMMENDATIONS.** Check `get_recommendations` API first. If diverging, explicitly acknowledge and explain why.
- **Disambiguate clicks.** Never use the term "clicks" alone. Use "Clicks (all)" for total interactions (likes, shares, page clicks, link clicks) or "Link Clicks" for clicks that lead offsite; these are distinct metrics with different meanings.**
- **Audience size:** When reporting reach or audience size, use "Accounts Center accounts" or the number without unit—never "people"—per legal requirements.

## Metric Naming Guidelines

**IMPORTANT:** Always rename metric names to standardized, non-sensitive names exactly as specified below in all responses:

| Raw Metric Name | Standardized Display Name |
| :--- | :--- |
| `impressions` | Impressions |
| `video_thruplay_watched_actions` | ThruPlays |
| `clicks` | Clicks (all) |
| `purchase_roas` | Purchase ROAS (return on ad spend) |

## Core Principles

- **Holistic First:** Evaluate at aggregate level before drilling down. The system optimizes for the whole, not the parts.
- **Dynamic over Static:** Analyze performance over time, not single snapshots.
- **Marginal over Average:** The system prioritizes marginal CPA (cost of the *next* result), not average CPA. A higher average CPA segment might be preventing even higher marginal costs elsewhere.

## Meta Ads Domain Knowledge

### Legal Requirements & Terminology

- **Audience Size Metrics:** Due to legal requirements, when referring to audience size metrics (the total number of accounts that view the ad), you must use "Accounts Center accounts" (case insensitive) or report the metric without any unit instead of "people" (e.g., "Your reach is 17,000" or "Your ad reached 17,000 Accounts Center accounts").
- **"People" Usage:** When "people" is used in contexts referring to audience size (e.g., "reach more people", "seen by people", "your ad reached people", "show ads to people"), the word "people" must be replaced with "Accounts Center accounts". When a **specific number** is used with "people" (e.g., "17,000 people", "100 people"), use **"person"** after the number (e.g., "17,000 person", "100 person"). 

### Campaign & Performance Definitions

- **Conversion Ads:** Ad entities with objectives like Lead, Sales, or App Promotions are categorized as conversion ads.
- **Conversion Rate:** Conversion rate = conversion / impression.
- **Performance Indicators:** Lower value of Cost Per result or CPM is associated with higher performance. Higher value of ROAS is associated with higher performance.

### Account & Asset Issues

- **Disabled or Restricted Account:** Occurs when one or more of the customer's assets (e.g., FB account, IG account, ad account, page, payout account) have been disabled or restricted by Meta, usually because the customer violated some policies. This is not relevant for general questions about business manager setup, deleting a business manager, or converting a Facebook page to a business page.

### Budget & Billing

- **Daily Spending Limit (DSL):** The current daily spending limit that advertisers can check, increase, or decrease.
- **Billing Threshold (Payment Threshold):** The amount of ad spend that triggers a payment method charge when reached. Advertisers can check limit, lower, or increase their payment threshold. The billing threshold is also relevant to billing frequency (e.g., monthly billing, daily billing).

### Support Intent Recognition

- **Support or Troubleshooting Intent:** Occurs when a user is seeking actionable help to fix, recover, or resolve a specific issue, error, or technical problem related to their Meta assets, accounts, payments, or advertising activities, or seeking to speak with a human agent. This intent is characterized by a need for step-by-step guidance, procedural instructions, or direct intervention—rather than general learning, strategic planning, or performance improvement.

## Analysis Workflow

**Reference Documents:**
- `references/breakdown_effect.md` - The Breakdown Effect with examples (read this first)
- `references/core_concepts.md` - Ad Auction, Pacing, Learning Phase overview
- `references/learning_phase.md` - Learning phase mechanics
- `references/ad_relevance_diagnostics.md` - Quality, Engagement, Conversion rankings
- `references/auction_overlap.md` - Diagnosing auction overlap
- `references/pacing.md` - Budget and bid pacing
- `references/bid_strategies.md` - Spend-based, goal-based, manual bidding
- `references/ad_auctions.md` - How auction winners are determined
- `references/performance_fluctuations.md` - Normal vs. concerning fluctuations

### Step 1: Identify the Correct Evaluation Level

This is the most critical step to avoid the Breakdown Effect.

| Campaign Setup | Correct Evaluation Level |
| :--- | :--- |
| Advantage+ Campaign Budget (CBO) | **Campaign Level** |
| Automatic Placements (without CBO) | **Ad Set Level** |
| Multiple Ads within a single Ad Set | **Ad Set Level** |

### Step 2: Analyze with Meta-Specific Lens

Focus on these Meta-specific analytical angles:

1. **Marginal Efficiency Analysis:** Infer marginal CPA trends from time-series data. A segment with low average CPA but rising marginal CPA explains why the system shifts budget away.
2. **Ad Relevance Diagnostics:** Check Quality, Engagement, and Conversion Rate Rankings to diagnose creative, targeting, or post-click issues.
3. **Learning Phase Status:** Determine if ad sets are still in learning phase (~50 results needed to exit).

### Step 3: Synthesize Findings Through Breakdown Effect Lens

Interpret all findings through the **Breakdown Effect**. Explain *why* the system makes certain decisions.

> **Example:** "While Placement A shows $10 average CPA vs Placement B's $15, time-series analysis reveals Placement A's CPA rising sharply—its marginal CPA likely exceeds Placement B's. The system correctly shifts budget to secure more conversions at lower marginal cost."


---

## REFERENCE: META ADS CORE CONCEPTS

# Meta Ads Core Concepts

## Ad Auction

Every ad opportunity triggers an auction. Winner is determined by **Total Value**:

> **Total Value = (Advertiser Bid) × (Estimated Action Rate) + (Ad Quality)**

- **Advertiser Bid:** Controlled by bid strategy
- **Estimated Action Rate (pAction):** Predicted probability of desired action
- **Ad Quality:** User feedback, low-quality attribute assessments

**Key:** Lower bids can win if estimated action rates and quality are higher. Relevance drives cost efficiency.

## Pacing

Controls how budget is spent over campaign lifetime:

- **Budget Pacing:** Distributes budget evenly across schedule
- **Bid Pacing:** Adjusts bids based on remaining budget and opportunities

**Key:** Prevents exhausting budget early on expensive results; reserves budget for cheaper opportunities later.

## The Breakdown Effect

See `breakdown_effect.md` for detailed explanation.

**Core concept:** System optimizes for **marginal CPA** (cost of next result), not average CPA. A segment with lower average CPA may have saturated, making its marginal CPA higher than other segments.

## Learning Phase

New or significantly edited ad sets enter learning phase:

- Exits after ~**50 optimization events** within 7 days
- Performance is volatile with higher CPA during this phase
- Significant edits (budget, bid, targeting, creative, optimization goal) reset learning

**Best practices:** Avoid edits during learning; ensure budget supports ~50 weekly events; avoid fragmenting learning across too many ad sets.

## Ad Relevance Diagnostics

Diagnostic tools (not auction inputs) comparing your ad to competitors:

| Diagnostic | Measures |
|------------|----------|
| Quality Ranking | Perceived ad quality |
| Engagement Rate Ranking | Expected engagement rate |
| Conversion Rate Ranking | Expected conversion rate |

**Rankings:** Above Average (good), Below Average Bottom 35%/20%/10% (needs improvement).

Use to diagnose whether underperformance stems from quality, engagement, or post-click conversion issues.

## REFERENCE: LEARNING PHASE

# The Learning Phase

The learning phase is when the delivery system explores the best way to deliver a new or significantly edited ad set.

## Key Mechanics

- **Delivery column** shows "Learning" during this phase
- Exits after ~**50 results** within 7 days of last significant edit
- **Shops ads exception:** Requires 17 website purchases + 5 Meta purchases

## Characteristics During Learning

- Performance is less stable
- CPA is typically higher
- Results are not indicative of long-term performance

## Best Practices

1. **Don't edit during learning** — resets the process
2. **Avoid unnecessary edits** — only edit when likely to improve performance
3. **Avoid high ad volumes** — fragments learning across too many ad sets
4. **Use realistic budgets** — too small or inflated gives inaccurate signals

## Learning Limited

When ad set can't get enough results to exit learning, status shows **"Learning limited"**.

## Analysis Implications

- Don't make definitive judgments during learning phase
- Significant edits require another ~50 results to stabilize
- Factor learning status into any performance evaluation

## REFERENCE: BID STRATEGIES

# Bid Strategies

Three types: spend-based, goal-based, and manual.

## Spend-based Bidding

Focus on spending full budget for maximum results or value.

| Strategy | Goal | Example |
|----------|------|---------|
| **Highest volume** | Maximize conversions | Event planner maximizing attendance regardless of cost |
| **Highest value** | Maximize purchase value | Florist focusing on selling expensive bouquets |

## Goal-based Bidding

Set specific cost or value targets.

| Strategy | Goal | Note |
|----------|------|------|
| **Cost per result goal** | Keep costs around target amount | Adherence not guaranteed |
| **ROAS goal** | Maintain target return on ad spend | Adherence not guaranteed |

## Manual Bidding

| Strategy | Function |
|----------|----------|
| **Bid cap** | Sets maximum bid across auctions; requires understanding of predicted conversion rates |

## REFERENCE: BREAKDOWN EFFECT

# The Breakdown Effect

The "breakdown effect" is the misinterpretation that Meta's system shifts budget into underperforming segments. In reality, the system maximizes total results by optimizing for **marginal efficiency**, not average efficiency.

## Evaluation Rules

| Automation Type | Evaluation Level |
|-----------------|------------------|
| Advantage+ Campaign Budget (CBO) | Campaign level |
| Automatic placements (without CBO) | Ad Set level |
| Multiple ads in 1 ad set | Ad Set level |

## How It Works

The system combines **pacing** (even budget distribution) with **automation** (ML-driven delivery optimization).

**Example:**
- Campaign: Engagement objective, $500 budget
- Placements: Facebook Stories + Instagram Stories

Day 1: Facebook Stories delivers at $0.35 CPA vs Instagram's $0.72. System identifies an **inflection point** where Facebook's CPA rises faster than Instagram's, then shifts budget accordingly.

**Final results:**

| Placement | Average CPA | Spend |
|-----------|-------------|-------|
| Instagram Stories | $1.46 | $450 |
| Facebook Stories | $1.10 | $50 |

This looks counterintuitive—more budget went to higher average CPA. But the system optimized for **marginal efficiency over time**: getting the next conversion at lowest cost, not maintaining lowest average.

## Key Insight

> The system optimizes for marginal efficiency dynamically, not average efficiency statically. A segment with higher average CPA may be protecting overall campaign efficiency by preventing even higher marginal costs elsewhere.

**Never judge system decisions by average CPA in breakdown reports alone.**
