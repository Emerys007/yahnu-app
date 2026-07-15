-- Firestore profile documents without a matching Firebase Auth UID are source
-- records, not runtime identities. Keeping them out of users prevents password
-- reset or Google sign-in from turning a stale document into an account.

CREATE TABLE legacy_firestore_user_archives (
  legacy_firebase_uid text PRIMARY KEY CHECK (length(legacy_firebase_uid) BETWEEN 1 AND 1500),
  source_payload jsonb NOT NULL CHECK (jsonb_typeof(source_payload) = 'object'),
  source_hash text NOT NULL CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  archive_reason text NOT NULL CHECK (archive_reason = 'missing_auth_identity'),
  source_created_at timestamptz,
  source_updated_at timestamptz,
  archived_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX legacy_firestore_user_archives_source_hash_idx
  ON legacy_firestore_user_archives (source_hash);

CREATE TRIGGER legacy_firestore_user_archives_set_updated_at
  BEFORE UPDATE ON legacy_firestore_user_archives
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE legacy_firestore_user_archives IS
  'Firebase Firestore profiles with no Firebase Auth identity; never a runtime account source.';

CREATE TABLE legacy_firestore_user_archive_references (
  source_collection text NOT NULL,
  source_id text NOT NULL CHECK (length(source_id) BETWEEN 1 AND 1500),
  source_field text NOT NULL,
  legacy_firebase_uid text NOT NULL
    REFERENCES legacy_firestore_user_archives(legacy_firebase_uid) ON DELETE RESTRICT,
  source_hash text NOT NULL CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_collection, source_id, source_field),
  CHECK (
    (source_collection, source_field) IN (
      ('users', 'school_id'),
      ('jobs', 'company_ref'),
      ('applications', 'applicant_ref'),
      ('partnerships', 'requester_ref'),
      ('partnerships', 'partner_ref')
    )
  )
);

CREATE INDEX legacy_firestore_user_archive_references_uid_idx
  ON legacy_firestore_user_archive_references (legacy_firebase_uid);

CREATE TRIGGER legacy_firestore_user_archive_references_set_updated_at
  BEFORE UPDATE ON legacy_firestore_user_archive_references
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE legacy_firestore_user_archive_references IS
  'Auditable source references to non-runtime archived Firestore profiles.';
