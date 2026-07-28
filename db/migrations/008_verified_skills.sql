-- Yahnu Skills Check — verified conditions.
--
-- This migration contains schema and non-secret check metadata only. The live
-- question bank and answer keys are loaded from a Render Secret File by the
-- pre-deploy importer. Never add production prompts, options, or keys here.

CREATE TABLE skills_checks (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  skill_area text NOT NULL CHECK (skill_area IN (
    'digital', 'data', 'customer_experience', 'operations', 'finance', 'agriculture'
  )),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
  current_version integer NOT NULL DEFAULT 1 CHECK (current_version BETWEEN 1 AND 10000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE skills_bank_releases (
  bank_id text NOT NULL CHECK (bank_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  bank_version integer NOT NULL CHECK (bank_version BETWEEN 1 AND 10000),
  content_digest text NOT NULL CHECK (content_digest ~ '^[0-9a-f]{64}$'),
  question_count integer NOT NULL CHECK (question_count BETWEEN 1 AND 10000),
  imported_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bank_id, bank_version)
);

CREATE TABLE skills_check_versions (
  check_id text NOT NULL REFERENCES skills_checks(id) ON DELETE RESTRICT,
  version integer NOT NULL CHECK (version BETWEEN 1 AND 10000),
  title_fr text NOT NULL CHECK (length(btrim(title_fr)) BETWEEN 3 AND 160),
  title_en text NOT NULL CHECK (length(btrim(title_en)) BETWEEN 3 AND 160),
  description_fr text NOT NULL CHECK (length(btrim(description_fr)) BETWEEN 20 AND 1000),
  description_en text NOT NULL CHECK (length(btrim(description_en)) BETWEEN 20 AND 1000),
  duration_seconds integer NOT NULL CHECK (duration_seconds BETWEEN 300 AND 3600),
  questions_per_attempt integer NOT NULL CHECK (questions_per_attempt BETWEEN 5 AND 30),
  passing_score integer NOT NULL CHECK (passing_score BETWEEN 50 AND 100),
  cooldown_hours integer NOT NULL DEFAULT 24 CHECK (cooldown_hours BETWEEN 1 AND 720),
  max_attempts_30_days integer NOT NULL DEFAULT 3 CHECK (max_attempts_30_days BETWEEN 1 AND 10),
  lifecycle_status text NOT NULL DEFAULT 'draft' CHECK (
    lifecycle_status IN ('draft', 'published', 'retired')
  ),
  bank_id text,
  bank_version integer,
  bank_digest text CHECK (bank_digest IS NULL OR bank_digest ~ '^[0-9a-f]{64}$'),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (check_id, version),
  FOREIGN KEY (bank_id, bank_version)
    REFERENCES skills_bank_releases(bank_id, bank_version)
    ON DELETE RESTRICT,
  CHECK (
    (lifecycle_status = 'draft'
      AND bank_id IS NULL
      AND bank_version IS NULL
      AND bank_digest IS NULL
      AND published_at IS NULL)
    OR
    (lifecycle_status IN ('published', 'retired')
      AND bank_id IS NOT NULL
      AND bank_version IS NOT NULL
      AND bank_digest IS NOT NULL
      AND published_at IS NOT NULL)
  )
);

CREATE TABLE skills_check_questions (
  check_id text NOT NULL,
  check_version integer NOT NULL,
  id text NOT NULL CHECK (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  prompt_fr text NOT NULL CHECK (length(btrim(prompt_fr)) BETWEEN 10 AND 2000),
  prompt_en text NOT NULL CHECK (length(btrim(prompt_en)) BETWEEN 10 AND 2000),
  options_fr jsonb NOT NULL CHECK (
    jsonb_typeof(options_fr) = 'array'
    AND jsonb_array_length(options_fr) BETWEEN 3 AND 6
  ),
  options_en jsonb NOT NULL CHECK (
    jsonb_typeof(options_en) = 'array'
    AND jsonb_array_length(options_en) BETWEEN 3 AND 6
    AND jsonb_array_length(options_en) = jsonb_array_length(options_fr)
  ),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (check_id, check_version, id),
  FOREIGN KEY (check_id, check_version)
    REFERENCES skills_check_versions(check_id, version)
    ON DELETE RESTRICT
);

CREATE TABLE skills_check_answer_keys (
  check_id text NOT NULL,
  check_version integer NOT NULL,
  question_id text NOT NULL,
  correct_index smallint NOT NULL CHECK (correct_index BETWEEN 0 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (check_id, check_version, question_id),
  FOREIGN KEY (check_id, check_version, question_id)
    REFERENCES skills_check_questions(check_id, check_version, id)
    ON DELETE RESTRICT
);

CREATE INDEX skills_check_questions_pool_idx
  ON skills_check_questions (check_id, check_version, is_active, id);

CREATE TABLE skills_check_attempts (
  id text PRIMARY KEY CHECK (id ~ '^[0-9a-f-]{36}$'),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_id text NOT NULL,
  check_version integer NOT NULL CHECK (check_version BETWEEN 1 AND 10000),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'in_progress', 'submitted', 'expired', 'voided'
  )),
  question_manifest jsonb NOT NULL CHECK (jsonb_typeof(question_manifest) = 'array'),
  accommodation_code text NOT NULL DEFAULT 'none' CHECK (accommodation_code IN (
    'none', 'extra_time_25', 'extra_time_50'
  )),
  accommodation_seconds integer NOT NULL DEFAULT 0 CHECK (
    accommodation_seconds BETWEEN 0 AND 1800
  ),
  check_title_fr text NOT NULL,
  check_title_en text NOT NULL,
  skill_area text NOT NULL,
  duration_seconds integer NOT NULL CHECK (duration_seconds BETWEEN 300 AND 3600),
  questions_per_attempt integer NOT NULL CHECK (questions_per_attempt BETWEEN 5 AND 30),
  passing_score integer NOT NULL CHECK (passing_score BETWEEN 50 AND 100),
  cooldown_hours integer NOT NULL CHECK (cooldown_hours BETWEEN 1 AND 720),
  max_attempts_30_days integer NOT NULL CHECK (max_attempts_30_days BETWEEN 1 AND 10),
  conditions_version text NOT NULL CHECK (length(btrim(conditions_version)) BETWEEN 3 AND 80),
  conditions_accepted_at timestamptz NOT NULL,
  privacy_notice_version text NOT NULL CHECK (
    length(btrim(privacy_notice_version)) BETWEEN 3 AND 80
  ),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  submitted_at timestamptz,
  score integer CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  passed boolean,
  integrity_review_status text NOT NULL DEFAULT 'clear' CHECK (
    integrity_review_status IN (
      'clear', 'review_suggested', 'reviewed_clear', 'confirmed_concern',
      'review_expired'
    )
  ),
  integrity_signal_count integer NOT NULL DEFAULT 0 CHECK (
    integrity_signal_count BETWEEN 0 AND 1000
  ),
  integrity_reviewed_at timestamptz,
  integrity_reviewed_by text REFERENCES users(id) ON DELETE SET NULL,
  integrity_review_category text CHECK (
    integrity_review_category IS NULL OR integrity_review_category IN (
      'focus_pattern', 'external_evidence', 'identity_mismatch', 'other'
    )
  ),
  integrity_review_note text CHECK (
    integrity_review_note IS NULL
    OR length(btrim(integrity_review_note)) BETWEEN 3 AND 500
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (check_id, check_version)
    REFERENCES skills_check_versions(check_id, version)
    ON DELETE RESTRICT,
  CHECK (expires_at > started_at),
  CHECK (
    (status = 'in_progress' AND submitted_at IS NULL AND score IS NULL AND passed IS NULL)
    OR
    (status = 'submitted' AND submitted_at IS NOT NULL AND score IS NOT NULL AND passed IS NOT NULL)
    OR
    (status IN ('expired', 'voided') AND score IS NULL AND passed IS NULL)
  ),
  CHECK (
    (integrity_review_status IN ('clear', 'review_suggested')
      AND integrity_reviewed_at IS NULL
      AND integrity_reviewed_by IS NULL
      AND integrity_review_category IS NULL
      AND integrity_review_note IS NULL)
    OR
    (integrity_review_status = 'reviewed_clear'
      AND integrity_reviewed_at IS NOT NULL
      AND integrity_reviewed_by IS NOT NULL
      AND integrity_review_category IS NULL)
    OR
    (integrity_review_status = 'confirmed_concern'
      AND integrity_reviewed_at IS NOT NULL
      AND integrity_reviewed_by IS NOT NULL
      AND integrity_review_category IS NOT NULL
      AND integrity_review_note IS NOT NULL)
    OR
    (integrity_review_status = 'review_expired'
      AND integrity_reviewed_at IS NOT NULL
      AND integrity_reviewed_by IS NULL
      AND integrity_review_category IS NULL
      AND integrity_review_note IS NOT NULL)
  )
);

CREATE UNIQUE INDEX skills_check_attempts_one_active_idx
  ON skills_check_attempts (user_id, check_id)
  WHERE status = 'in_progress';
CREATE INDEX skills_check_attempts_user_history_idx
  ON skills_check_attempts (user_id, started_at DESC);
CREATE INDEX skills_check_attempts_review_idx
  ON skills_check_attempts (integrity_review_status, submitted_at DESC)
  WHERE integrity_review_status = 'review_suggested';

CREATE TABLE skills_check_integrity_signals (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attempt_id text NOT NULL REFERENCES skills_check_attempts(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('visibility_hidden', 'focus_lost')),
  client_elapsed_ms integer CHECK (
    client_elapsed_ms IS NULL OR client_elapsed_ms BETWEEN 0 AND 7200000
  ),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(metadata) = 'object'
    AND octet_length(metadata::text) <= 2048
  ),
  received_at timestamptz NOT NULL DEFAULT now(),
  retention_expires_at timestamptz NOT NULL DEFAULT now() + interval '90 days',
  CHECK (retention_expires_at > received_at)
);

CREATE INDEX skills_check_integrity_attempt_idx
  ON skills_check_integrity_signals (attempt_id, received_at);
CREATE INDEX skills_check_integrity_retention_idx
  ON skills_check_integrity_signals (retention_expires_at);

CREATE TABLE skills_attestations (
  id text PRIMARY KEY CHECK (id ~ '^[0-9a-f-]{36}$'),
  attempt_id text NOT NULL UNIQUE REFERENCES skills_check_attempts(id) ON DELETE RESTRICT,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_id text NOT NULL,
  check_version integer NOT NULL CHECK (check_version BETWEEN 1 AND 10000),
  holder_name text NOT NULL CHECK (length(btrim(holder_name)) BETWEEN 1 AND 160),
  check_title_fr text NOT NULL,
  check_title_en text NOT NULL,
  skill_area text NOT NULL,
  score integer NOT NULL CHECK (score BETWEEN 50 AND 100),
  duration_seconds integer NOT NULL CHECK (duration_seconds BETWEEN 300 AND 5400),
  question_count integer NOT NULL CHECK (question_count BETWEEN 5 AND 30),
  conditions_version text NOT NULL,
  verification_code text NOT NULL UNIQUE CHECK (
    verification_code ~ '^[A-Za-z0-9_-]{32,64}$'
  ),
  is_public boolean NOT NULL DEFAULT false,
  public_consent_at timestamptz,
  public_consent_version text CHECK (
    public_consent_version IS NULL
    OR length(btrim(public_consent_version)) BETWEEN 3 AND 80
  ),
  issued_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revocation_reason text CHECK (
    revocation_reason IS NULL OR length(btrim(revocation_reason)) BETWEEN 3 AND 500
  ),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (check_id, check_version)
    REFERENCES skills_check_versions(check_id, version)
    ON DELETE RESTRICT,
  CHECK (
    is_public = false
    OR (
      public_consent_at IS NOT NULL
      AND public_consent_version IS NOT NULL
      AND revoked_at IS NULL
    )
  )
);

CREATE INDEX skills_attestations_user_idx
  ON skills_attestations (user_id, issued_at DESC);
CREATE UNIQUE INDEX skills_attestations_one_active_per_check_idx
  ON skills_attestations (user_id, check_id)
  WHERE revoked_at IS NULL;
CREATE INDEX skills_attestations_public_code_idx
  ON skills_attestations (verification_code)
  WHERE public_consent_at IS NOT NULL;

CREATE OR REPLACE FUNCTION guard_skills_version_lifecycle()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'skills check versions are immutable';
  END IF;

  IF ROW(
    OLD.check_id, OLD.version, OLD.title_fr, OLD.title_en,
    OLD.description_fr, OLD.description_en, OLD.duration_seconds,
    OLD.questions_per_attempt, OLD.passing_score, OLD.cooldown_hours,
    OLD.max_attempts_30_days
  ) IS DISTINCT FROM ROW(
    NEW.check_id, NEW.version, NEW.title_fr, NEW.title_en,
    NEW.description_fr, NEW.description_en, NEW.duration_seconds,
    NEW.questions_per_attempt, NEW.passing_score, NEW.cooldown_hours,
    NEW.max_attempts_30_days
  ) THEN
    RAISE EXCEPTION 'skills check version metadata is immutable';
  END IF;

  IF OLD.lifecycle_status = 'draft' AND NEW.lifecycle_status = 'published' THEN
    RETURN NEW;
  END IF;
  IF OLD.lifecycle_status = 'published' AND NEW.lifecycle_status = 'retired'
    AND ROW(OLD.bank_id, OLD.bank_version, OLD.bank_digest, OLD.published_at)
      IS NOT DISTINCT FROM
      ROW(NEW.bank_id, NEW.bank_version, NEW.bank_digest, NEW.published_at)
  THEN
    RETURN NEW;
  END IF;
  IF NEW IS NOT DISTINCT FROM OLD THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'invalid skills check version lifecycle transition';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skills_versions_are_immutable
  BEFORE UPDATE OR DELETE ON skills_check_versions
  FOR EACH ROW EXECUTE FUNCTION guard_skills_version_lifecycle();

CREATE OR REPLACE FUNCTION guard_skills_question_mutation()
RETURNS trigger AS $$
DECLARE
  target_check_id text;
  target_version integer;
  target_status text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_check_id := OLD.check_id;
    target_version := OLD.check_version;
  ELSE
    target_check_id := NEW.check_id;
    target_version := NEW.check_version;
  END IF;
  SELECT lifecycle_status INTO target_status
  FROM skills_check_versions
  WHERE check_id = target_check_id AND version = target_version;

  IF target_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'published skills question banks are immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skills_questions_are_immutable_after_publish
  BEFORE INSERT OR UPDATE OR DELETE ON skills_check_questions
  FOR EACH ROW EXECUTE FUNCTION guard_skills_question_mutation();
CREATE TRIGGER skills_answer_keys_are_immutable_after_publish
  BEFORE INSERT OR UPDATE OR DELETE ON skills_check_answer_keys
  FOR EACH ROW EXECUTE FUNCTION guard_skills_question_mutation();

CREATE OR REPLACE FUNCTION enforce_skills_attempt_owner_and_snapshot()
RETURNS trigger AS $$
DECLARE
  owner_role text;
  check_status text;
  version_row skills_check_versions%ROWTYPE;
  area text;
BEGIN
  SELECT role INTO owner_role
  FROM users
  WHERE id = NEW.user_id AND deleted_at IS NULL;
  IF owner_role IS DISTINCT FROM 'graduate' THEN
    RAISE EXCEPTION 'skills checks are owned by graduate accounts';
  END IF;

  SELECT c.status, c.skill_area
  INTO check_status, area
  FROM skills_checks c
  WHERE c.id = NEW.check_id
    AND c.current_version = NEW.check_version;

  SELECT *
  INTO version_row
  FROM skills_check_versions
  WHERE check_id = NEW.check_id
    AND version = NEW.check_version;

  IF check_status IS DISTINCT FROM 'published'
    OR version_row.lifecycle_status IS DISTINCT FROM 'published'
  THEN
    RAISE EXCEPTION 'skills check version is not published';
  END IF;

  NEW.check_title_fr := version_row.title_fr;
  NEW.check_title_en := version_row.title_en;
  NEW.skill_area := area;
  NEW.duration_seconds := version_row.duration_seconds;
  NEW.questions_per_attempt := version_row.questions_per_attempt;
  NEW.passing_score := version_row.passing_score;
  NEW.cooldown_hours := version_row.cooldown_hours;
  NEW.max_attempts_30_days := version_row.max_attempts_30_days;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skills_attempts_require_graduate_snapshot
  BEFORE INSERT ON skills_check_attempts
  FOR EACH ROW EXECUTE FUNCTION enforce_skills_attempt_owner_and_snapshot();

CREATE OR REPLACE FUNCTION protect_skills_attempt_snapshot()
RETURNS trigger AS $$
BEGIN
  IF ROW(
    OLD.user_id, OLD.check_id, OLD.check_version, OLD.question_manifest,
    OLD.accommodation_code, OLD.accommodation_seconds, OLD.check_title_fr,
    OLD.check_title_en, OLD.skill_area, OLD.duration_seconds,
    OLD.questions_per_attempt, OLD.passing_score, OLD.cooldown_hours,
    OLD.max_attempts_30_days, OLD.conditions_version,
    OLD.conditions_accepted_at, OLD.privacy_notice_version,
    OLD.started_at, OLD.expires_at
  ) IS DISTINCT FROM ROW(
    NEW.user_id, NEW.check_id, NEW.check_version, NEW.question_manifest,
    NEW.accommodation_code, NEW.accommodation_seconds, NEW.check_title_fr,
    NEW.check_title_en, NEW.skill_area, NEW.duration_seconds,
    NEW.questions_per_attempt, NEW.passing_score, NEW.cooldown_hours,
    NEW.max_attempts_30_days, NEW.conditions_version,
    NEW.conditions_accepted_at, NEW.privacy_notice_version,
    NEW.started_at, NEW.expires_at
  ) THEN
    RAISE EXCEPTION 'skills attempt conditions are immutable';
  END IF;

  IF OLD.status <> NEW.status AND NOT (
    OLD.status = 'in_progress'
    AND NEW.status IN ('submitted', 'expired', 'voided')
  ) THEN
    RAISE EXCEPTION 'invalid skills attempt status transition';
  END IF;

  IF OLD.integrity_review_status <> NEW.integrity_review_status AND NOT (
    OLD.integrity_review_status = 'clear' AND NEW.integrity_review_status = 'review_suggested'
    OR OLD.integrity_review_status = 'review_suggested'
      AND NEW.integrity_review_status IN (
        'reviewed_clear', 'confirmed_concern', 'review_expired'
      )
  ) THEN
    RAISE EXCEPTION 'invalid skills integrity review transition';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skills_attempt_snapshot_is_immutable
  BEFORE UPDATE ON skills_check_attempts
  FOR EACH ROW EXECUTE FUNCTION protect_skills_attempt_snapshot();

CREATE OR REPLACE FUNCTION validate_skills_attempt_manifest()
RETURNS trigger AS $$
DECLARE
  manifest_entry jsonb;
  configured_question_count integer;
  option_count integer;
  distinct_question_count integer;
  distinct_option_count integer;
BEGIN
  SELECT questions_per_attempt
  INTO configured_question_count
  FROM skills_check_versions
  WHERE check_id = NEW.check_id
    AND version = NEW.check_version
    AND lifecycle_status = 'published';

  IF configured_question_count IS NULL
    OR jsonb_array_length(NEW.question_manifest) <> configured_question_count
  THEN
    RAISE EXCEPTION 'attempt manifest must match the configured question count';
  END IF;

  SELECT count(DISTINCT value ->> 'questionId')
  INTO distinct_question_count
  FROM jsonb_array_elements(NEW.question_manifest);
  IF distinct_question_count <> jsonb_array_length(NEW.question_manifest) THEN
    RAISE EXCEPTION 'attempt manifest contains duplicate questions';
  END IF;

  FOR manifest_entry IN SELECT value FROM jsonb_array_elements(NEW.question_manifest)
  LOOP
    IF jsonb_typeof(manifest_entry) <> 'object'
      OR NOT (manifest_entry ? 'questionId')
      OR NOT (manifest_entry ? 'optionOrder')
      OR manifest_entry - ARRAY['questionId', 'optionOrder']::text[] <> '{}'::jsonb
      OR jsonb_typeof(manifest_entry -> 'questionId') <> 'string'
      OR jsonb_typeof(manifest_entry -> 'optionOrder') <> 'array'
      OR jsonb_array_length(manifest_entry -> 'optionOrder') NOT BETWEEN 3 AND 6
    THEN
      RAISE EXCEPTION 'invalid attempt manifest';
    END IF;

    SELECT jsonb_array_length(options_fr)
    INTO option_count
    FROM skills_check_questions
    WHERE check_id = NEW.check_id
      AND check_version = NEW.check_version
      AND id = manifest_entry ->> 'questionId'
      AND is_active = true;
    IF option_count IS NULL
      OR option_count <> jsonb_array_length(manifest_entry -> 'optionOrder')
    THEN
      RAISE EXCEPTION 'attempt manifest references an unavailable question';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(manifest_entry -> 'optionOrder') AS option_value(value)
      WHERE jsonb_typeof(value) <> 'number'
    ) THEN
      RAISE EXCEPTION 'attempt manifest contains an invalid option order';
    END IF;

    SELECT count(DISTINCT value)
    INTO distinct_option_count
    FROM jsonb_array_elements(manifest_entry -> 'optionOrder');
    IF distinct_option_count <> option_count
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements(manifest_entry -> 'optionOrder') AS option_value(value)
        WHERE (value::text)::integer < 0
          OR (value::text)::integer >= option_count
      )
    THEN
      RAISE EXCEPTION 'attempt manifest contains an invalid option order';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skills_attempt_manifest_is_server_safe
  BEFORE INSERT ON skills_check_attempts
  FOR EACH ROW EXECUTE FUNCTION validate_skills_attempt_manifest();

CREATE OR REPLACE FUNCTION validate_skills_attestation()
RETURNS trigger AS $$
DECLARE
  source_attempt skills_check_attempts%ROWTYPE;
  owner_name text;
BEGIN
  SELECT * INTO source_attempt
  FROM skills_check_attempts
  WHERE id = NEW.attempt_id;
  SELECT name INTO owner_name
  FROM users
  WHERE id = NEW.user_id AND deleted_at IS NULL AND role = 'graduate';

  IF source_attempt.id IS NULL
    OR owner_name IS NULL
    OR source_attempt.user_id <> NEW.user_id
    OR source_attempt.check_id <> NEW.check_id
    OR source_attempt.check_version <> NEW.check_version
    OR source_attempt.status <> 'submitted'
    OR source_attempt.passed IS DISTINCT FROM true
    OR source_attempt.score <> NEW.score
    OR source_attempt.integrity_review_status = 'confirmed_concern'
  THEN
    RAISE EXCEPTION 'attestation must match a passed submitted attempt';
  END IF;

  NEW.holder_name := owner_name;
  NEW.check_title_fr := source_attempt.check_title_fr;
  NEW.check_title_en := source_attempt.check_title_en;
  NEW.skill_area := source_attempt.skill_area;
  NEW.duration_seconds := source_attempt.duration_seconds
    + source_attempt.accommodation_seconds;
  NEW.question_count := source_attempt.questions_per_attempt;
  NEW.conditions_version := source_attempt.conditions_version;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skills_attestation_matches_attempt
  BEFORE INSERT ON skills_attestations
  FOR EACH ROW EXECUTE FUNCTION validate_skills_attestation();

CREATE OR REPLACE FUNCTION protect_skills_attestation_snapshot()
RETURNS trigger AS $$
DECLARE
  source_review_status text;
BEGIN
  IF ROW(
    OLD.attempt_id, OLD.user_id, OLD.check_id, OLD.check_version,
    OLD.holder_name, OLD.check_title_fr, OLD.check_title_en, OLD.skill_area,
    OLD.score, OLD.duration_seconds, OLD.question_count,
    OLD.conditions_version, OLD.verification_code, OLD.issued_at
  ) IS DISTINCT FROM ROW(
    NEW.attempt_id, NEW.user_id, NEW.check_id, NEW.check_version,
    NEW.holder_name, NEW.check_title_fr, NEW.check_title_en, NEW.skill_area,
    NEW.score, NEW.duration_seconds, NEW.question_count,
    NEW.conditions_version, NEW.verification_code, NEW.issued_at
  ) THEN
    RAISE EXCEPTION 'skills attestation evidence is immutable';
  END IF;
  IF OLD.revoked_at IS NOT NULL AND ROW(
    OLD.is_public, OLD.public_consent_at, OLD.public_consent_version,
    OLD.revoked_at, OLD.revocation_reason
  ) IS DISTINCT FROM ROW(
    NEW.is_public, NEW.public_consent_at, NEW.public_consent_version,
    NEW.revoked_at, NEW.revocation_reason
  ) THEN
    RAISE EXCEPTION 'revoked skills attestations are immutable';
  END IF;
  IF NEW.is_public = true THEN
    SELECT integrity_review_status
    INTO source_review_status
    FROM skills_check_attempts
    WHERE id = NEW.attempt_id;
    IF source_review_status NOT IN ('clear', 'reviewed_clear') THEN
      RAISE EXCEPTION 'skills attestation cannot be public while review is unresolved';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skills_attestation_snapshot_is_immutable
  BEFORE UPDATE ON skills_attestations
  FOR EACH ROW EXECUTE FUNCTION protect_skills_attestation_snapshot();

CREATE OR REPLACE FUNCTION purge_expired_skills_integrity_signals()
RETURNS integer AS $$
DECLARE
  removed integer;
BEGIN
  UPDATE skills_check_attempts
  SET
    integrity_review_status = 'review_expired',
    integrity_reviewed_at = now(),
    integrity_reviewed_by = NULL,
    integrity_review_category = NULL,
    integrity_review_note = 'Evidence retention window expired without a human decision'
  WHERE integrity_review_status = 'review_suggested'
    AND COALESCE(submitted_at, created_at) <= now() - interval '90 days';

  DELETE FROM skills_check_integrity_signals
  WHERE retention_expires_at <= now();
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skills_checks_set_updated_at
  BEFORE UPDATE ON skills_checks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER skills_attempts_set_updated_at
  BEFORE UPDATE ON skills_check_attempts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER skills_attestations_set_updated_at
  BEFORE UPDATE ON skills_attestations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO skills_checks (id, skill_area, status, current_version)
VALUES
  ('service-client-ci', 'customer_experience', 'draft', 1),
  ('analyse-donnees-ci', 'data', 'draft', 1),
  ('logistique-operations-ci', 'operations', 'draft', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO skills_check_versions (
  check_id, version, title_fr, title_en, description_fr, description_en,
  duration_seconds, questions_per_attempt, passing_score,
  cooldown_hours, max_attempts_30_days, lifecycle_status
) VALUES
  (
    'service-client-ci', 1,
    'Service client & communication professionnelle',
    'Customer service & professional communication',
    'Des situations réalistes en agence, par téléphone et sur WhatsApp pour démontrer une communication claire, respectueuse et orientée solution.',
    'Realistic agency, phone, and WhatsApp scenarios that demonstrate clear, respectful, solution-focused communication.',
    720, 6, 70, 24, 3, 'draft'
  ),
  (
    'analyse-donnees-ci', 1,
    'Analyse de données & décisions opérationnelles',
    'Data analysis & operational decisions',
    'Lecture de tableaux, contrôle de cohérence et interprétation d’indicateurs en FCFA dans le contexte d’une organisation ivoirienne.',
    'Tables, data quality, and KPI interpretation in FCFA within an Ivorian organization.',
    900, 6, 70, 24, 3, 'draft'
  ),
  (
    'logistique-operations-ci', 1,
    'Logistique & opérations en Côte d’Ivoire',
    'Logistics & operations in Côte d’Ivoire',
    'Des décisions de stock, livraison et coordination inspirées du port d’Abidjan et des échanges entre les principales villes du pays.',
    'Inventory, delivery, and coordination decisions inspired by the Port of Abidjan and trade between major Ivorian cities.',
    900, 6, 70, 24, 3, 'draft'
  )
ON CONFLICT (check_id, version) DO NOTHING;
