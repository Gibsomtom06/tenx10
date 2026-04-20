-- User isolation for shared tables (venues, promoters, contacts)
-- Adds created_by column auto-populated via trigger so API routes need no changes

CREATE OR REPLACE FUNCTION set_created_by()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Venues
ALTER TABLE venues ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
DO $$ BEGIN
  CREATE TRIGGER set_venues_created_by
    BEFORE INSERT ON venues FOR EACH ROW EXECUTE PROCEDURE set_created_by();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DROP POLICY IF EXISTS "Authenticated users can manage venues" ON venues;
CREATE POLICY "Users manage own venues" ON venues FOR ALL USING (created_by = auth.uid());

-- Promoters
ALTER TABLE promoters ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
DO $$ BEGIN
  CREATE TRIGGER set_promoters_created_by
    BEFORE INSERT ON promoters FOR EACH ROW EXECUTE PROCEDURE set_created_by();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DROP POLICY IF EXISTS "Authenticated users can manage promoters" ON promoters;
CREATE POLICY "Users manage own promoters" ON promoters FOR ALL USING (created_by = auth.uid());

-- Contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
DO $$ BEGIN
  CREATE TRIGGER set_contacts_created_by
    BEFORE INSERT ON contacts FOR EACH ROW EXECUTE PROCEDURE set_created_by();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DROP POLICY IF EXISTS "Authenticated users can manage contacts" ON contacts;
CREATE POLICY "Users manage own contacts" ON contacts FOR ALL USING (created_by = auth.uid());
