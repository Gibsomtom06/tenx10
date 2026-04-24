-- Artist invite system
-- Managers send magic-link invites to their artists so each artist can
-- claim their own portal account and complete their profile.

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

-- RLS
ALTER TABLE artist_invites ENABLE ROW LEVEL SECURITY;

-- Manager can see and create invites for their own artists
CREATE POLICY "manager_own_invites" ON artist_invites
  FOR ALL
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

-- Anyone with the token can read the invite (for the join page)
CREATE POLICY "token_read_invite" ON artist_invites
  FOR SELECT
  USING (true);

-- Index for fast token lookups
CREATE INDEX idx_artist_invites_token ON artist_invites(token);
CREATE INDEX idx_artist_invites_artist_id ON artist_invites(artist_id);
