-- ════════════════════════════════════════════════════════════════
-- Migration 010: Combined 005–009 (safe to re-run on any state)
-- Run this single block in Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════

-- ── 005: user_id on artists ──────────────────────────────────
ALTER TABLE artists ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS artists_user_id_idx ON artists(user_id);

-- ── 005: catalog table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalog (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id        uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title            text NOT NULL,
  type             text NOT NULL DEFAULT 'single',
  bucket           text NOT NULL DEFAULT 'released_full',
  release_date     date,
  isrc             text,
  upc              text,
  distributor      text,
  streams          integer,
  spotify_track_id text,
  notes            text,
  artwork_url      text,
  streaming_url    text,
  collaborators    text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
ALTER TABLE catalog ENABLE ROW LEVEL SECURITY;

-- ── 005: tasks table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id   uuid REFERENCES artists(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id),
  title       text NOT NULL,
  description text,
  type        text NOT NULL DEFAULT 'general',
  status      text NOT NULL DEFAULT 'todo',
  due_date    date,
  deal_id     uuid REFERENCES deals(id) ON DELETE SET NULL,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ── 005: updated_at triggers ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS catalog_updated_at ON catalog;
CREATE TRIGGER catalog_updated_at BEFORE UPDATE ON catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 006: backfill deal_points from venues/promoters ──────────
UPDATE deals d
SET deal_points = jsonb_build_object(
  'city',          COALESCE(v.city, ''),
  'state',         COALESCE(v.state, ''),
  'venue',         COALESCE(v.name, ''),
  'promoterName',  COALESCE(p.name, ''),
  'promoterEmail', COALESCE(p.email, ''),
  'promoterPhone', COALESCE(p.phone, '')
)
FROM venues v
LEFT JOIN promoters p ON p.id = d.promoter_id
WHERE d.venue_id = v.id
  AND (d.deal_points IS NULL OR d.deal_points = '{}');

UPDATE deals d
SET deal_points = d.deal_points || jsonb_build_object(
  'city',  COALESCE(v.city, ''),
  'state', COALESCE(v.state, ''),
  'venue', COALESCE(v.name, '')
)
FROM venues v
WHERE d.venue_id = v.id
  AND d.deal_points IS NOT NULL
  AND d.deal_points != '{}'
  AND (d.deal_points->>'city' IS NULL OR d.deal_points->>'city' = '');

-- ── 007: artist_members table ────────────────────────────────
CREATE TABLE IF NOT EXISTS artist_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id  uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email      text NOT NULL,
  name       text NOT NULL,
  role       text NOT NULL CHECK (role IN ('admin','artist','agent')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artist_id, email)
);
ALTER TABLE artist_members ENABLE ROW LEVEL SECURITY;

-- ── 007: is_artist_member function ───────────────────────────
CREATE OR REPLACE FUNCTION is_artist_member(p_artist_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM artist_members
    WHERE artist_id = p_artist_id
      AND (user_id = auth.uid() OR email = (auth.jwt() ->> 'email'))
  )
$$;

-- ── 007: artist_members RLS ───────────────────────────────────
DROP POLICY IF EXISTS "members_select"  ON artist_members;
DROP POLICY IF EXISTS "admins_mutate"   ON artist_members;

CREATE POLICY "members_select" ON artist_members FOR SELECT
  USING (is_artist_member(artist_id));

CREATE POLICY "admins_mutate" ON artist_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM artist_members m
      WHERE m.artist_id = artist_members.artist_id
        AND m.role = 'admin'
        AND (m.user_id = auth.uid() OR m.email = (auth.jwt() ->> 'email'))
    )
  );

-- ── 007: auto-add manager trigger ────────────────────────────
CREATE OR REPLACE FUNCTION add_manager_as_artist_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_email text;
  v_name  text;
BEGIN
  SELECT email, full_name INTO v_email, v_name FROM profiles WHERE id = NEW.manager_id;
  IF v_email IS NOT NULL THEN
    INSERT INTO artist_members (artist_id, user_id, email, name, role)
    VALUES (NEW.id, NEW.manager_id, v_email, COALESCE(v_name, v_email), 'admin')
    ON CONFLICT (artist_id, email) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_artist_created_add_manager ON artists;
CREATE TRIGGER on_artist_created_add_manager
  AFTER INSERT ON artists FOR EACH ROW EXECUTE PROCEDURE add_manager_as_artist_admin();

-- ── 007: seed DSR team into artist_members ───────────────────
DO $$ DECLARE v_artist_id uuid; BEGIN
  SELECT id INTO v_artist_id FROM artists WHERE stage_name = 'DirtySnatcha' LIMIT 1;
  IF v_artist_id IS NULL THEN
    RAISE NOTICE 'DirtySnatcha not found — skipping seed';
    RETURN;
  END IF;
  INSERT INTO artist_members (artist_id, email, name, role) VALUES
    (v_artist_id, 'thomas@dirtysnatcha.com',      'Thomas Nalian',       'admin'),
    (v_artist_id, 'contact@dirtysnatcha.com',      'Lee Bray',            'artist'),
    (v_artist_id, 'andrew@abtouring.com',          'Andrew (AB Touring)', 'agent'),
    (v_artist_id, 'colton@prysmtalentagency.com',  'Colton Anderson',     'agent'),
    (v_artist_id, 'booking@dirtysnatcha.com',      'Booking Team',        'agent')
  ON CONFLICT (artist_id, email) DO NOTHING;
END $$;

-- ── 007+009: update all RLS policies ─────────────────────────
-- Artists
DROP POLICY IF EXISTS "Managers see own artists"  ON artists;
DROP POLICY IF EXISTS "artists_member_select"     ON artists;
DROP POLICY IF EXISTS "artists_manager_write"     ON artists;
CREATE POLICY "artists_member_select" ON artists FOR SELECT
  USING (manager_id = auth.uid() OR user_id = auth.uid() OR is_artist_member(id));
CREATE POLICY "artists_manager_write" ON artists FOR ALL
  USING (manager_id = auth.uid());

-- Deals
DROP POLICY IF EXISTS "Managers see own deals"  ON deals;
DROP POLICY IF EXISTS "deals_member_access"     ON deals;
CREATE POLICY "deals_member_access" ON deals FOR ALL
  USING (
    is_artist_member(artist_id)
    OR (SELECT manager_id FROM artists WHERE id = deals.artist_id) = auth.uid()
  );

-- Catalog
DROP POLICY IF EXISTS "catalog_auth"          ON catalog;
DROP POLICY IF EXISTS "catalog_member_access" ON catalog;
CREATE POLICY "catalog_member_access" ON catalog FOR ALL
  USING (
    is_artist_member(artist_id)
    OR (SELECT manager_id FROM artists WHERE id = catalog.artist_id) = auth.uid()
  );

-- Tasks
DROP POLICY IF EXISTS "tasks_auth"          ON tasks;
DROP POLICY IF EXISTS "tasks_member_access" ON tasks;
CREATE POLICY "tasks_member_access" ON tasks FOR ALL
  USING (
    artist_id IS NULL
    OR is_artist_member(artist_id)
    OR (SELECT manager_id FROM artists WHERE id = tasks.artist_id) = auth.uid()
  );

-- Contracts
DROP POLICY IF EXISTS "Authenticated users can manage contracts" ON contracts;
DROP POLICY IF EXISTS "Deal owners can manage contracts"         ON contracts;
DROP POLICY IF EXISTS "contracts_member_access"                  ON contracts;
CREATE POLICY "contracts_member_access" ON contracts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM deals d
      WHERE d.id = contracts.deal_id
        AND (
          is_artist_member(d.artist_id)
          OR (SELECT manager_id FROM artists WHERE id = d.artist_id) = auth.uid()
        )
    )
  );

-- ── 008: deal_threads ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deal_threads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id    uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type IN ('offer','marketing','advance','contract')),
  subject    text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE deal_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "thread_member_access" ON deal_threads;
CREATE POLICY "thread_member_access" ON deal_threads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM deals d WHERE d.id = deal_threads.deal_id
        AND (
          is_artist_member(d.artist_id)
          OR (SELECT manager_id FROM artists WHERE id = d.artist_id) = auth.uid()
        )
    )
  );

-- ── 008: deal_messages ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS deal_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id        uuid NOT NULL REFERENCES deal_threads(id) ON DELETE CASCADE,
  sender_name      text NOT NULL,
  sender_email     text,
  direction        text NOT NULL CHECK (direction IN ('inbound','outbound','internal')),
  body             text NOT NULL,
  gmail_message_id text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE deal_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "message_member_access" ON deal_messages;
CREATE POLICY "message_member_access" ON deal_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM deal_threads t
      JOIN deals d ON d.id = t.deal_id
      WHERE t.id = deal_messages.thread_id
        AND (
          is_artist_member(d.artist_id)
          OR (SELECT manager_id FROM artists WHERE id = d.artist_id) = auth.uid()
        )
    )
  );

-- ── 008: deal_attachments ────────────────────────────────────
CREATE TABLE IF NOT EXISTS deal_attachments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id      uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  thread_id    uuid REFERENCES deal_threads(id) ON DELETE SET NULL,
  filename     text NOT NULL,
  mime_type    text NOT NULL,
  storage_path text NOT NULL,
  parsed_data  jsonb,
  uploaded_by  uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE deal_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attachment_member_access" ON deal_attachments;
CREATE POLICY "attachment_member_access" ON deal_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM deals d WHERE d.id = deal_attachments.deal_id
        AND (
          is_artist_member(d.artist_id)
          OR (SELECT manager_id FROM artists WHERE id = d.artist_id) = auth.uid()
        )
    )
  );

-- ── 008: extend venues ───────────────────────────────────────
ALTER TABLE venues ADD COLUMN IF NOT EXISTS talent_buyer   text;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS booking_email  text;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS typical_genres text;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS sell_radius    text;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS other_shows    jsonb;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS intel          jsonb;

-- ── 009: backfill existing managers into artist_members ──────
INSERT INTO artist_members (artist_id, user_id, email, name, role)
SELECT
  a.id,
  a.manager_id,
  p.email,
  COALESCE(p.full_name, p.email),
  'admin'
FROM artists a
JOIN profiles p ON p.id = a.manager_id
ON CONFLICT (artist_id, email) DO NOTHING;
