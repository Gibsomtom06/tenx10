# Morning Handoff — April 24, 2026

## What got done overnight

### Deployed to tenx10.co (4 pushes, all passing)

1. **TypeScript fix + push unblock** — The pre-push hook was blocking everything. Fixed `as const` type issue and cast all `artist_invites` queries to `(client as any)` since migration 017 isn't in generated types yet. Everything pushed.

2. **Revenue Sustainability Engine** (`/dashboard/revenue`)
   - Full 7-pillar income dashboard
   - Monthly goal with editable target + progress bar (purple gradient)
   - Each pillar: estimate / potential / tip / CTA
   - 4 KPI chips: streams/mo, save-to-stream, shows/mo, income diversity
   - Wired to real deals data (30d shows, avg guarantee, upcoming revenue)
   - Nav: Finance group now has "Revenue Engine" link

3. **Morning Briefing** (`/dashboard/briefing`)
   - Daily prioritized action list: shows in 7d, active negotiations, urgent tasks, emails needing response
   - Color-coded urgency (red/yellow/blue)
   - 30d revenue snapshot, quick links at bottom
   - Added to nav as first item in Booking group

4. **Xai agent page** — Updated branding from "Management Team" → "Xai — AI Management Team". Agent detection now matches RJ Jackson, Release Agent patterns. 6 quick prompt buttons.

5. **Nav cleanup** — "Ask X" → "Ask Xai" throughout

---

## ONE THING YOU MUST DO FIRST

### Apply migration 017 in Supabase — THIS IS BLOCKING INVITES

Without this, the `artist_invites` table doesn't exist in production. Artists can't be invited.

1. Go to: https://supabase.com/dashboard/project/ocscxqaythiuidkwjuvg/sql/new
2. Paste this SQL and run it:

```sql
CREATE TABLE IF NOT EXISTS artist_invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id   uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  manager_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token       text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  email       text NOT NULL,
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '7 days',
  accepted_at timestamptz,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE artist_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manager_own_invites" ON artist_invites
  FOR ALL
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "token_read_invite" ON artist_invites
  FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_artist_invites_token ON artist_invites(token);
CREATE INDEX IF NOT EXISTS idx_artist_invites_artist_id ON artist_invites(artist_id);
```

3. Once that's done, go to `/dashboard/artists` and you can click **Invite** on any artist to send them their join link.

---

## Artist onboarding — send invites today

After running the migration above:

| Artist | What to do |
|--------|-----------|
| **Kotrax** | Go to /dashboard/artists → click Invite → enter their email |
| **HVVRCRFT** | Same |
| **DirtySnatcha** | Same (your own artist account — use contact@dirtysnatcha.com or lee's email) |
| **Dark Matter** | Same |
| **WHOiSEE** | Same |

Each invite sends an email from `noreply@tenx10.co` with a magic link to `/artist/join/[token]`. They set up their profile and create their login. Takes 2 minutes.

---

## What's still on the list

- [ ] Artist portal profile edit page (artists can update their own bio/socials after joining)
- [ ] Xai system prompt full update (conversational tone, scraper permission-gating)
- [ ] Spotify API connect for artists (OAuth flow to pull real stream data into Revenue Engine)
- [ ] DAD landing page agent pipeline
- [ ] Rim Shop deployment (Netlify)
- [ ] Gmail reconnect for thomas@dirtysnatcharecords.com (tokens expired)

---

*Generated overnight by Claude Code — all 4 commits live on master, Vercel deploying.*
