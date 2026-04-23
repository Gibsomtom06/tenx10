-- Apollo enrichment backfill
-- Run this AFTER you download the enriched CSV from Apollo
--
-- HOW TO USE:
-- 1. Upload apollo-contacts-import.csv to Apollo → People → Import CSV
-- 2. Map columns: Organization Name → Company, City, State/Region
-- 3. Let Apollo enrich → Export CSV (include email, phone, linkedin_url)
-- 4. The export will have the supabase_id column you can join on
-- 5. Replace the VALUES below with rows from the enriched CSV export
-- 6. Run this script in Supabase SQL editor (project: ocscxqaythiuidkwjuvg)

-- Template: update one contact
-- UPDATE contacts SET
--   email = 'booker@venue.com',
--   phone = '+1-555-000-0000'
-- WHERE id = 'supabase-uuid-here';

-- Bulk update pattern (paste enriched rows here):
UPDATE contacts SET email = enriched.email, phone = enriched.phone
FROM (VALUES
  -- ('supabase_id', 'email', 'phone'),
  -- example:
  -- ('ea0540f5-2b9e-483f-b210-e9fc5d4fe9ba', 'booking@skywaymnpls.com', '+16125550100'),
  ('placeholder', NULL, NULL)
) AS enriched(id, email, phone)
WHERE contacts.id = enriched.id
  AND enriched.email IS NOT NULL;

-- After the bulk update, verify:
SELECT
  COUNT(*) FILTER (WHERE email IS NOT NULL) AS contacts_with_email,
  COUNT(*) FILTER (WHERE phone IS NOT NULL) AS contacts_with_phone,
  COUNT(*) AS total
FROM contacts;
