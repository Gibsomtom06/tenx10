-- ============================================================
-- 018: Enhanced setlist trigger — flags unregistered tracks
-- ============================================================
-- When a deal flips to 'completed':
--   1. Create a "submit setlist to BMI/ASCAP" task
--   2. For each track in the setlist, check publishing_registrations
--      → if unregistered at artist's PRO, create a registration task

CREATE OR REPLACE FUNCTION create_bmi_task_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_pro         text;
  v_venue_name  text;
  v_track       jsonb;
  v_track_title text;
  v_track_isrc  text;
  v_registered  boolean;
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN

    SELECT a.pro_affiliation
      INTO v_pro
      FROM artists a
      WHERE a.id = NEW.artist_id;

    IF v_pro IS NOT NULL AND v_pro <> 'none' THEN

      SELECT COALESCE(v.name, 'venue')
        INTO v_venue_name
        FROM venues v
        WHERE v.id = NEW.venue_id;

      -- Task 1: submit setlist to PRO
      INSERT INTO tasks (
        artist_id, assigned_to, title, description, type, status, due_date, deal_id, created_by
      ) VALUES (
        NEW.artist_id,
        NEW.created_by,
        'Submit setlist to ' || UPPER(v_pro) || ' Live — ' || COALESCE(v_venue_name, 'show') || ' (' || TO_CHAR(NEW.show_date, 'Mon DD, YYYY') || ')',
        'Log into ' || UPPER(v_pro) || ' Live (bmi.com/live) and submit the setlist for this performance. '
          || 'Royalties are paid quarterly — submit within 6 months of the performance date.',
        'bmi_setlist',
        'todo',
        NEW.show_date + INTERVAL '7 days',
        NEW.id,
        NEW.created_by
      );

      -- Task 2+: flag any tracks in the setlist not registered at PRO
      IF NEW.setlist IS NOT NULL AND jsonb_array_length(NEW.setlist) > 0 THEN
        FOR v_track IN SELECT * FROM jsonb_array_elements(NEW.setlist)
        LOOP
          v_track_title := v_track->>'title';
          v_track_isrc  := v_track->>'isrc';

          IF v_track_title IS NULL THEN
            CONTINUE;
          END IF;

          -- Check if this track is registered at the artist's PRO
          SELECT EXISTS (
            SELECT 1 FROM publishing_registrations pr
            WHERE (pr.artist_id = NEW.artist_id OR pr.artist_id IS NULL)
              AND (
                (v_track_isrc IS NOT NULL AND pr.isrc = v_track_isrc)
                OR pr.title ILIKE v_track_title
              )
              AND (
                (v_pro = 'bmi'   AND pr.bmi_registered  = true)
                OR (v_pro = 'ascap' AND pr.ascap_registered = true)
                OR (v_pro = 'sesac' AND pr.bmi_registered  = true)
              )
          ) INTO v_registered;

          IF NOT v_registered THEN
            INSERT INTO tasks (
              artist_id, assigned_to, title, description, type, status, due_date, deal_id, created_by
            ) VALUES (
              NEW.artist_id,
              NEW.created_by,
              'Register "' || v_track_title || '" at ' || UPPER(v_pro) || ' — not registered',
              'This track was performed at ' || COALESCE(v_venue_name, 'show') || ' on ' || TO_CHAR(NEW.show_date, 'Mon DD, YYYY')
                || ' but has no ' || UPPER(v_pro) || ' registration on file. '
                || 'Register it to collect performance royalties from this and future shows. '
                || CASE WHEN v_track_isrc IS NOT NULL THEN 'ISRC: ' || v_track_isrc ELSE 'No ISRC on file — get it from VMG.' END,
              'publishing',
              'todo',
              NEW.show_date + INTERVAL '14 days',
              NEW.id,
              NEW.created_by
            );
          END IF;
        END LOOP;
      END IF;

    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the old trigger
DROP TRIGGER IF EXISTS bmi_task_on_deal_completion ON deals;
CREATE TRIGGER bmi_task_on_deal_completion
  AFTER UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION create_bmi_task_on_completion();
