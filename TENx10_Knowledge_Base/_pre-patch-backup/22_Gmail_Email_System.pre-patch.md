# GMAIL & EMAIL SYSTEM
## Module 21: Inbox Intelligence + Label Schema + Filter Routing
### Last Updated: March 6, 2026

---

## GMAIL LABEL SCHEMA

10 labels with emoji prefixes for instant visual triage:

| Label | Purpose |
|---|---|
| TENx10/🔴 Urgent | Requires action TODAY. Offers expiring, deposits overdue, show <7 days with missing info |
| TENx10/🟡 This Week | Action needed this week but not today |
| TENx10/💰 Financial | Deposits, payments, settlements, royalty statements |
| TENx10/📄 Contracts | Offers, contracts, riders, signed docs |
| TENx10/🎤 DirtySnatcha | All DS show/booking/marketing threads |
| TENx10/🎵 WHOiSEE | All WHOiSEE threads |
| TENx10/🏷️ Label Operations | DSR label business, VMG, SoundExchange, LLC filings |
| TENx10/🤝 Collabs & A&R | Demo submissions, collab threads, split sheets |
| TENx10/🛠️ SaaS Build | Platform development, tech threads |
| TENx10/⬜ Archive | Auto-archived noise — promos, newsletters, OTPs |

## AUTO-CLASSIFICATION RULES

| Email Pattern | Label | Alert Level |
|---|---|---|
| from: andrew@abtouring.com + subject contains "offer" | 📄 Contracts + 🔴 Urgent | 🔴 always |
| from: colton@prysmtalentagency.com + subject contains "offer" | 📄 Contracts + 🔴 Urgent | 🔴 always |
| subject contains "deposit" OR "payment" OR "settlement" | 💰 Financial | 🔴 if overdue |
| from: any known promoter + subject contains "contract" OR "rider" | 📄 Contracts | 🟡 unless <14 days |
| from: eventbrite (noreply@event.eventbrite.com) | 🎤 DirtySnatcha | Auto-parse ticket count → tour grid |
| from: VIP contacts (geronimo@siriusxm.com etc.) | 🔴 Urgent | 🔴 always |
| CATEGORY_PROMOTIONS + no TENx10 sender | ⬜ Archive | Auto-archive |
| Calendly reminders for past dates | ⬜ Archive | Auto-archive |
| Login codes / OTPs | ⬜ Archive | Auto-archive |
| Newsletter / webinar / promo from non-industry sender | ⬜ Archive | Auto-archive |

## CRITICAL RULES

**Copro contract rule:** Two signatories required — thread stays 🔴 until BOTH confirmed signed. Agent saying "all set" does not close the alert.

**Watched thread status:** Thread flagged as watched (user has seen it, not acting yet) moves to monitored queue — visible in dashboard, not in urgent tray.

**Agent email matching:** System recognizes andrew@abtouring.com and colton@prysmtalentagency.com as booking agent senders. Any new offer from these addresses auto-triggers the booking evaluator skill.

## DAILY INBOX INTEGRATION

The daily briefing skill (Step 1) should scan Gmail for:
1. New emails from known agents (offer detection)
2. Overdue deposit threads (💰 Financial with no resolution)
3. Unanswered promoter emails >48 hours old
4. Contract threads pending signature
5. Any 🔴 Urgent threads unread

Surface the top 3 inbox actions in the 🔴 URGENT section of the briefing.

## EMAIL DRAFTING WORKFLOW

1. AI drafts email using Module 18 templates + real show data
2. Draft saved to Gmail via `gmail_create_draft`
3. Thomas reviews draft in Gmail
4. Thomas sends manually (AI never auto-sends)
5. Sent email logged to `email_threads` table in Supabase

**The AI never sends emails. It only drafts. Thomas sends.**

---

*Gmail & Email System v1.0 — March 6, 2026*
