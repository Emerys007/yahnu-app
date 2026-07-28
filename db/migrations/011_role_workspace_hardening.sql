-- Audited organization verification workflow for databases that already ran 010.

ALTER TABLE organization_profiles
  ADD COLUMN IF NOT EXISTS verification_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_reviewed_by text REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verification_note text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organization_profiles_verification_note_length'
  ) THEN
    ALTER TABLE organization_profiles
      ADD CONSTRAINT organization_profiles_verification_note_length
      CHECK (verification_note IS NULL OR length(verification_note) <= 1000);
  END IF;
END
$$;

UPDATE organization_profiles
SET verification_requested_at = COALESCE(verification_requested_at, updated_at)
WHERE verification_status = 'pending';

CREATE INDEX IF NOT EXISTS organization_profiles_verification_queue_idx
  ON organization_profiles (verification_status, verification_requested_at, updated_at)
  WHERE verification_status = 'pending';
