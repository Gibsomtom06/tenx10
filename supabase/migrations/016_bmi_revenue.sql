-- ============================================================
-- 016: BMI setlist tracking, PRO artist fields, revenue goals
-- ============================================================

-- ── 1. Add BMI / setlist fields to deals ─────────────────────
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS setlist        jsonb,
  ADD COLUMN IF NOT EXISTS bmi_submitted  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bmi_submitted_at timestamptz;

COMMENT ON COLUMN deals.setlist          IS 'Array of track objects: [{title, isrc, duration_sec}]';
COMMENT ON COLUMN deals.bmi_submitted    IS 'Whether setlist has been submitted to BMI Live';
COMMENT ON COLUMN deals.bmi_submitted_at IS 'Timestamp of BMI Live submission';

-- ── 2. Add PRO fields to artists ─────────────────────────────
ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS pro_affiliation    text,
  ADD COLUMN IF NOT EXISTS pro_ipi            text,
  ADD COLUMN IF NOT EXISTS pro_submits_setlists boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN artists.pro_affiliation      IS 'bmi | ascap | sesac | gmr | none';
COMMENT ON COLUMN artists.pro_ipi              IS 'IPI/CAE number for the artist';
COMMENT ON COLUMN artists.pro_submits_setlists IS 'Whether artist currently submits setlists after shows';

-- ── 3. Revenue goals table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS artist_revenue_goals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id     uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  monthly_target numeric(10,2) NOT NULL,
  currency      text NOT NULL DEFAULT 'USD',
  label         text,
  set_at        timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artist_id)
);
ALTER TABLE artist_revenue_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artists see own revenue goals" ON artist_revenue_goals
  FOR ALL USING (
    artist_id IN (
      SELECT id FROM artists WHERE created_by = auth.uid()
    )
  );

-- ── 4. Revenue streams table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS artist_revenue_streams (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id        uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  stream_type      text NOT NULL,
  is_active        boolean NOT NULL DEFAULT false,
  monthly_estimate numeric(10,2) NOT NULL DEFAULT 0,
  notes            text,
  last_updated     timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artist_id, stream_type)
);
ALTER TABLE artist_revenue_streams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artists see own revenue streams" ON artist_revenue_streams
  FOR ALL USING (
    artist_id IN (
      SELECT id FROM artists WHERE created_by = auth.uid()
    )
  );

COMMENT ON COLUMN artist_revenue_streams.stream_type IS
  'live | streaming | publishing | merch | content | education | brand_deals';

-- ── 5. Auto-create BMI task when deal flips to completed ──────
CREATE OR REPLACE FUNCTION create_bmi_task_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_artist_id   uuid;
  v_pro         text;
  v_venue_name  text;
BEGIN
  -- Only fire when status changes TO completed
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN

    -- Get artist PRO affiliation
    SELECT a.id, a.pro_affiliation
      INTO v_artist_id, v_pro
      FROM artists a
      WHERE a.id = NEW.artist_id;

    -- Only create task if artist has a PRO
    IF v_pro IS NOT NULL AND v_pro <> 'none' THEN

      -- Get venue name for task title
      SELECT COALESCE(v.name, 'venue')
        INTO v_venue_name
        FROM venues v
        WHERE v.id = NEW.venue_id;

      INSERT INTO tasks (
        artist_id,
        assigned_to,
        title,
        description,
        type,
        status,
        due_date,
        deal_id,
        created_by
      ) VALUES (
        NEW.artist_id,
        NEW.created_by,
        'Submit setlist to ' || UPPER(v_pro) || ' — ' || v_venue_name || ' (' || TO_CHAR(NEW.show_date, 'Mon DD, YYYY') || ')',
        'Log into ' || UPPER(v_pro) || ' Live and submit the setlist for this show. Royalties are paid quarterly — submit within 6 months of the performance date.',
        'bmi_setlist',
        'todo',
        NEW.show_date + INTERVAL '7 days',
        NEW.id,
        NEW.created_by
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS bmi_task_on_deal_completion ON deals;
CREATE TRIGGER bmi_task_on_deal_completion
  AFTER UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION create_bmi_task_on_completion();

-- ── 6. Updated_at triggers ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS revenue_goals_updated_at ON artist_revenue_goals;
CREATE TRIGGER revenue_goals_updated_at
  BEFORE UPDATE ON artist_revenue_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 7. Seed DirtySnatcha PRO data ───────────────────────────
UPDATE artists
  SET pro_affiliation     = 'bmi',
      pro_submits_setlists = false
  WHERE name ILIKE '%dirtysnatcha%';
