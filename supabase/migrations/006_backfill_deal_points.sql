-- Migration 006: Backfill deal_points from venues and promoters tables
-- For existing TMTYL deals that have venue_id / promoter_id but no deal_points
-- Run in Supabase SQL Editor

UPDATE deals d
SET deal_points = jsonb_build_object(
  'city',         COALESCE(v.city, ''),
  'state',        COALESCE(v.state, ''),
  'venue',        COALESCE(v.name, ''),
  'promoterName', COALESCE(p.name, ''),
  'promoterEmail',COALESCE(p.email, ''),
  'promoterPhone',COALESCE(p.phone, '')
)
FROM venues v
LEFT JOIN promoters p ON p.id = d.promoter_id
WHERE d.venue_id = v.id
  AND (d.deal_points IS NULL OR d.deal_points = '{}');

-- For deals that already have partial deal_points, merge in the missing fields
UPDATE deals d
SET deal_points = d.deal_points || jsonb_build_object(
  'city',   COALESCE(v.city, ''),
  'state',  COALESCE(v.state, ''),
  'venue',  COALESCE(v.name, '')
)
FROM venues v
WHERE d.venue_id = v.id
  AND d.deal_points IS NOT NULL
  AND d.deal_points != '{}'
  AND (d.deal_points->>'city' IS NULL OR d.deal_points->>'city' = '');
