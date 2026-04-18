-- Migration 005: Catalog, Tasks, Artist Portal
-- Run this in Supabase SQL Editor

-- ── Link auth users to artist accounts ────────────────────────────────────
ALTER TABLE artists ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS artists_user_id_idx ON artists(user_id);

-- ── Expand role enum to include artist + agent ────────────────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'manager', 'viewer', 'artist', 'agent'));

-- ── Catalog table (5-bucket system) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalog (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id     uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title         text NOT NULL,
  type          text NOT NULL DEFAULT 'single',
  bucket        text NOT NULL DEFAULT 'released_full',
  release_date  date,
  isrc          text,
  upc           text,
  distributor   text,
  streams       integer,
  spotify_track_id text,
  notes         text,
  artwork_url   text,
  streaming_url text,
  collaborators text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ── Tasks table ───────────────────────────────────────────────────────────
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

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "catalog_auth" ON catalog;
CREATE POLICY "catalog_auth" ON catalog
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "tasks_auth" ON tasks;
CREATE POLICY "tasks_auth" ON tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Updated_at triggers ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS catalog_updated_at ON catalog;
CREATE TRIGGER catalog_updated_at
  BEFORE UPDATE ON catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
