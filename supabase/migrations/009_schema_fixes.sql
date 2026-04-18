-- Migration 009: Fix RLS gaps from migrations 001–008
-- Safe to run against a live DB that already has 001–008 applied.

-- ── 1. Fix deal_attachments RLS (was passing deal_id to is_artist_member, always false) ──
DROP POLICY IF EXISTS "attachment_member_access" ON deal_attachments;
CREATE POLICY "attachment_member_access" ON deal_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM deals d
      WHERE d.id = deal_attachments.deal_id AND is_artist_member(d.artist_id)
    )
  );

-- ── 2. Tighten contracts RLS (was open to all authenticated users) ──
DROP POLICY IF EXISTS "Authenticated users can manage contracts" ON contracts;
DROP POLICY IF EXISTS "Deal owners can manage contracts" ON contracts;
CREATE POLICY "contracts_member_access" ON contracts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM deals d
      WHERE d.id = contracts.deal_id AND is_artist_member(d.artist_id)
    )
  );

-- ── 3. Auto-add manager to artist_members when a new artist is created ──
CREATE OR REPLACE FUNCTION add_manager_as_artist_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
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
  AFTER INSERT ON artists
  FOR EACH ROW EXECUTE PROCEDURE add_manager_as_artist_admin();

-- ── 4. Backfill: add existing managers to artist_members for artists they own ──
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
