-- ============================================================
-- 019: Publisher PRO credentials — DSR ASCAP + Leigh Bray BMI
-- ============================================================

-- Add PRO member ID column (PRO-specific, e.g. ASCAP Member ID)
ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS pro_member_id text;

COMMENT ON COLUMN artists.pro_member_id IS 'PRO-specific member ID (e.g. ASCAP Member ID #7423184 for DSR)';

-- DirtySnatcha Records (DSR) — ASCAP publisher
-- IPI Name Number: 1238282844 | ASCAP Member ID: 7423184
UPDATE artists
SET
  pro_affiliation = 'ascap',
  pro_ipi         = '1238282844',
  pro_member_id   = '7423184'
WHERE stage_name = 'DSR';

-- Leigh Bray / DirtySnatcha — BMI songwriter IPI
UPDATE artists
SET
  pro_ipi       = '01017500116',
  pro_member_id = NULL
WHERE stage_name = 'DirtySnatcha' AND pro_affiliation = 'bmi';
