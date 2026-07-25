-- These rows represent source references whose target is conclusively absent
-- from Firebase Auth and every exported Firestore document. They are retained
-- for reconciliation without creating a runtime relationship or account.

CREATE TABLE legacy_unresolved_firestore_references (
  source_collection text NOT NULL,
  source_id text NOT NULL CHECK (length(source_id) BETWEEN 1 AND 1500),
  source_field text NOT NULL,
  target_ref_sha256 text NOT NULL CHECK (target_ref_sha256 ~ '^[0-9a-f]{64}$'),
  source_hash text NOT NULL CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  reason text NOT NULL CHECK (reason = 'source_target_absent_from_export'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_collection, source_id, source_field, target_ref_sha256),
  CHECK (
    (source_collection, source_field) IN (
      ('jobs', 'company_ref'),
      ('partnerships', 'partner_ref'),
      ('conversations', 'participant_ref')
    )
  )
);

CREATE INDEX legacy_unresolved_firestore_references_source_hash_idx
  ON legacy_unresolved_firestore_references (source_hash);

CREATE TRIGGER legacy_unresolved_firestore_references_set_updated_at
  BEFORE UPDATE ON legacy_unresolved_firestore_references
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE legacy_unresolved_firestore_references IS
  'Verified-absent Firebase references quarantined outside runtime foreign keys.';
