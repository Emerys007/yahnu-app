-- Production parity for the Firebase application. Every source-backed table keeps
-- the original Firestore document ID and a canonical source hash so cutover can
-- be reconciled without relying on approximate row counts.

ALTER TABLE users
  ADD COLUMN legacy_firestore_source_hash text
  CHECK (legacy_firestore_source_hash IS NULL OR legacy_firestore_source_hash ~ '^[0-9a-f]{64}$');

ALTER TABLE tickets
  ADD CONSTRAINT tickets_runtime_id_length CHECK (length(id) BETWEEN 1 AND 200),
  ADD CONSTRAINT tickets_runtime_subject_length CHECK (subject IS NULL OR length(btrim(subject)) BETWEEN 5 AND 200),
  ADD CONSTRAINT tickets_runtime_description_length CHECK (length(btrim(description)) BETWEEN 20 AND 10000);

CREATE TABLE auth_identities (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider ~ '^[a-z][a-z0-9._-]{0,127}$'),
  provider_subject text NOT NULL CHECK (length(provider_subject) BETWEEN 1 AND 1500),
  provider_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, provider),
  UNIQUE (provider, provider_subject)
);

CREATE INDEX auth_identities_user_idx ON auth_identities (user_id);
CREATE INDEX auth_identities_email_idx ON auth_identities (lower(provider_email)) WHERE provider_email IS NOT NULL;

CREATE TABLE media_assets (
  id text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{1,200}$'),
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  content_type text NOT NULL DEFAULT 'application/octet-stream',
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  content bytea NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  uploaded_by text REFERENCES users(id) ON DELETE SET NULL,
  source_provider text,
  source_bucket text,
  source_path text,
  source_generation text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  legacy_url_hashes jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(legacy_url_hashes) = 'array'),
  source_created_at timestamptz,
  source_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (octet_length(content) = byte_size),
  CHECK (
    source_provider IS DISTINCT FROM 'firebase_storage'
    OR (
      source_bucket IS NOT NULL
      AND source_path IS NOT NULL
      AND source_generation IS NOT NULL
      AND source_generation ~ '^[1-9][0-9]{0,29}$'
    )
  )
);

CREATE INDEX media_assets_path_idx ON media_assets (source_bucket, source_path);
CREATE INDEX media_assets_sha256_idx ON media_assets (sha256);
CREATE UNIQUE INDEX media_assets_firebase_source_unique
  ON media_assets (source_provider, source_bucket, source_path, source_generation)
  WHERE source_provider = 'firebase_storage';

ALTER TABLE users
  ADD COLUMN avatar_asset_id text REFERENCES media_assets(id) ON DELETE SET NULL,
  ADD COLUMN legacy_avatar_url_sha256 text
    CHECK (legacy_avatar_url_sha256 IS NULL OR legacy_avatar_url_sha256 ~ '^[0-9a-f]{64}$');

CREATE INDEX users_legacy_avatar_hash_idx ON users (legacy_avatar_url_sha256)
  WHERE legacy_avatar_url_sha256 IS NOT NULL;

CREATE TABLE media_asset_url_rewrites (
  source_url_sha256 text PRIMARY KEY CHECK (source_url_sha256 ~ '^[0-9a-f]{64}$'),
  media_asset_id text NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  replacement_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX media_asset_url_rewrites_asset_idx ON media_asset_url_rewrites (media_asset_id);

CREATE TABLE blog_posts (
  id text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9_-]{1,200}$'),
  slug text NOT NULL,
  title text NOT NULL,
  author text NOT NULL DEFAULT 'Yahnu',
  excerpt text NOT NULL DEFAULT '',
  content_html text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  image_url text,
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  author_ref text,
  image_asset_id text REFERENCES media_assets(id) ON DELETE SET NULL,
  legacy_image_url text CHECK (legacy_image_url IS NULL),
  legacy_image_url_sha256 text CHECK (legacy_image_url_sha256 IS NULL OR legacy_image_url_sha256 ~ '^[0-9a-f]{64}$'),
  published_at timestamptz,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_hash text NOT NULL DEFAULT repeat('0', 64) CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  source_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX blog_posts_slug_unique ON blog_posts (lower(slug));
CREATE INDEX blog_posts_status_published_idx ON blog_posts (status, published_at DESC, created_at DESC);
CREATE INDEX blog_posts_legacy_image_hash_idx ON blog_posts (legacy_image_url_sha256) WHERE legacy_image_url_sha256 IS NOT NULL;

CREATE TABLE conversations (
  id text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 240),
  name text NOT NULL DEFAULT '' CHECK (length(name) <= 500),
  avatar_url text,
  avatar_asset_id text REFERENCES media_assets(id) ON DELETE SET NULL,
  legacy_avatar_url_sha256 text CHECK (legacy_avatar_url_sha256 IS NULL OR legacy_avatar_url_sha256 ~ '^[0-9a-f]{64}$'),
  last_message text CHECK (last_message IS NULL OR length(last_message) <= 10000),
  last_message_at timestamptz,
  ticket_id text REFERENCES tickets(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_hash text NOT NULL DEFAULT repeat('0', 64) CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  source_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conversations_activity_idx ON conversations (COALESCE(last_message_at, updated_at) DESC);
CREATE INDEX conversations_legacy_avatar_hash_idx ON conversations (legacy_avatar_url_sha256)
  WHERE legacy_avatar_url_sha256 IS NOT NULL;

CREATE TABLE conversation_participants (
  conversation_id text NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_ref text,
  display_name text,
  unread_count integer NOT NULL DEFAULT 0 CHECK (unread_count >= 0),
  last_read_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX conversation_participants_user_idx ON conversation_participants (user_id, conversation_id);
CREATE INDEX conversation_participants_ref_idx ON conversation_participants (participant_ref, conversation_id);

CREATE TABLE messages (
  id text PRIMARY KEY,
  conversation_id text NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_ref text,
  body text NOT NULL DEFAULT '' CHECK (length(body) <= 10000),
  attachment_asset_id text REFERENCES media_assets(id) ON DELETE SET NULL,
  legacy_attachment_url text CHECK (legacy_attachment_url IS NULL),
  legacy_attachment_url_sha256 text CHECK (legacy_attachment_url_sha256 IS NULL OR legacy_attachment_url_sha256 ~ '^[0-9a-f]{64}$'),
  source_index integer CHECK (source_index IS NULL OR source_index >= 0),
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_hash text NOT NULL DEFAULT repeat('0', 64) CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  source_updated_at timestamptz,
  sent_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_conversation_sent_idx ON messages (conversation_id, sent_at, id);
CREATE INDEX messages_sender_idx ON messages (sender_id, sent_at DESC);
CREATE INDEX messages_legacy_attachment_hash_idx ON messages (legacy_attachment_url_sha256) WHERE legacy_attachment_url_sha256 IS NOT NULL;

CREATE TABLE notifications (
  id text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 500),
  user_id text REFERENCES users(id) ON DELETE CASCADE,
  recipient_ref text,
  target_role text,
  is_global boolean NOT NULL DEFAULT false,
  announcement_id text UNIQUE,
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  actor_ref text,
  type text NOT NULL DEFAULT 'general' CHECK (length(btrim(type)) BETWEEN 1 AND 100),
  title text NOT NULL DEFAULT '' CHECK (length(title) <= 500),
  body text NOT NULL DEFAULT '' CHECK (length(body) <= 10000),
  link text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_hash text NOT NULL DEFAULT repeat('0', 64) CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  source_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  CHECK (
    (user_id IS NOT NULL AND target_role IS NULL AND is_global = false)
    OR (user_id IS NULL AND target_role IS NOT NULL AND is_global = false)
    OR (user_id IS NULL AND target_role IS NULL AND is_global = true)
  ),
  CHECK (
    target_role IS NULL
    OR target_role IN (
      'graduate', 'company', 'school', 'admin', 'super_admin',
      'content_manager', 'content_moderator', 'support_staff'
    )
  )
);

CREATE INDEX notifications_recipient_created_idx ON notifications (user_id, created_at DESC);
CREATE INDEX notifications_audience_created_idx ON notifications (target_role, created_at DESC);

CREATE TABLE notification_receipts (
  notification_id text NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivered_at timestamptz,
  read_at timestamptz,
  dismissed_at timestamptz,
  PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX notification_receipts_user_unread_idx ON notification_receipts (user_id, read_at, notification_id);

CREATE TABLE jobs (
  id text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 200),
  company_id text REFERENCES users(id) ON DELETE SET NULL,
  company_ref text,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 3 AND 160),
  company_name text CHECK (company_name IS NULL OR length(btrim(company_name)) BETWEEN 1 AND 500),
  location text CHECK (location IS NULL OR length(btrim(location)) BETWEEN 1 AND 200),
  employment_type text CHECK (employment_type IS NULL OR employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'temporary', 'volunteer', 'other')),
  description text NOT NULL DEFAULT '' CHECK (length(btrim(description)) BETWEEN 20 AND 100000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed')),
  application_url text CHECK (application_url IS NULL OR length(application_url) <= 2048),
  closes_at timestamptz,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_hash text NOT NULL DEFAULT repeat('0', 64) CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  source_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX jobs_status_created_idx ON jobs (status, created_at DESC);
CREATE INDEX jobs_company_idx ON jobs (company_id, status, created_at DESC);

CREATE TABLE applications (
  id text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 200),
  job_id text REFERENCES jobs(id) ON DELETE SET NULL,
  job_ref text,
  applicant_id text REFERENCES users(id) ON DELETE SET NULL,
  applicant_ref text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'shortlisted', 'interviewing', 'accepted', 'rejected', 'withdrawn')),
  cover_letter text CHECK (cover_letter IS NULL OR length(cover_letter) <= 20000),
  resume_asset_id text REFERENCES media_assets(id) ON DELETE SET NULL,
  legacy_resume_url text CHECK (legacy_resume_url IS NULL),
  legacy_resume_url_sha256 text CHECK (legacy_resume_url_sha256 IS NULL OR legacy_resume_url_sha256 ~ '^[0-9a-f]{64}$'),
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_hash text NOT NULL DEFAULT repeat('0', 64) CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  source_updated_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX applications_job_status_idx ON applications (job_id, status, submitted_at DESC);
CREATE INDEX applications_applicant_idx ON applications (applicant_id, submitted_at DESC);
CREATE INDEX applications_legacy_resume_hash_idx ON applications (legacy_resume_url_sha256) WHERE legacy_resume_url_sha256 IS NOT NULL;

CREATE TABLE partnerships (
  id text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 200),
  requester_id text REFERENCES users(id) ON DELETE SET NULL,
  requester_ref text,
  partner_id text REFERENCES users(id) ON DELETE SET NULL,
  partner_ref text,
  organization_name text CHECK (organization_name IS NULL OR length(btrim(organization_name)) BETWEEN 1 AND 500),
  contact_email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_hash text NOT NULL DEFAULT repeat('0', 64) CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  source_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX partnerships_status_created_idx ON partnerships (status, created_at DESC);
CREATE INDEX partnerships_requester_idx ON partnerships (requester_id, created_at DESC);

CREATE TABLE archived_mail (
  id text PRIMARY KEY,
  envelope_from text,
  envelope_to jsonb NOT NULL DEFAULT '[]'::jsonb,
  subject text,
  delivery_status text,
  source_payload jsonb NOT NULL DEFAULT '{"format":"yahnu-archived-mail-metadata-v1"}'::jsonb,
  source_hash text NOT NULL DEFAULT repeat('0', 64) CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  source_updated_at timestamptz,
  queued_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    jsonb_typeof(source_payload) = 'object'
    AND source_payload - ARRAY['format', 'textSha256', 'htmlSha256']::text[] = '{}'::jsonb
    AND source_payload ->> 'format' = 'yahnu-archived-mail-metadata-v1'
    AND (
      source_payload ->> 'textSha256' IS NULL
      OR source_payload ->> 'textSha256' ~ '^[0-9a-f]{64}$'
    )
    AND (
      source_payload ->> 'htmlSha256' IS NULL
      OR source_payload ->> 'htmlSha256' ~ '^[0-9a-f]{64}$'
    )
  )
);

CREATE INDEX archived_mail_status_queued_idx ON archived_mail (delivery_status, queued_at DESC);

CREATE TABLE announcements (
  id text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 160),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 180),
  content text NOT NULL CHECK (length(btrim(content)) BETWEEN 1 AND 10000),
  audience text NOT NULL CHECK (audience IN ('all', 'graduate', 'company', 'school')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active')),
  expires_at timestamptz,
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_hash text NOT NULL DEFAULT repeat('0', 64) CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  source_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications
  ADD CONSTRAINT notifications_announcement_fk
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE;

CREATE INDEX announcements_status_created_idx ON announcements (status, created_at DESC);

CREATE TABLE knowledge_base_articles (
  id text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 160),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 180),
  category text NOT NULL CHECK (length(btrim(category)) BETWEEN 1 AND 100),
  content_html text NOT NULL CHECK (length(btrim(content_html)) BETWEEN 50 AND 100000),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_hash text NOT NULL DEFAULT repeat('0', 64) CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  source_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX knowledge_base_articles_status_category_idx ON knowledge_base_articles (status, category, updated_at DESC);

-- Codes from the Firebase emailVerificationCodes collection are intentionally
-- unusable on Render. Only a one-way hash and non-secret provenance are retained
-- so the migration can prove every source document was accounted for.
CREATE TABLE invalidated_legacy_email_codes (
  id text PRIMARY KEY,
  user_ref text,
  email text,
  code_sha256 text CHECK (code_sha256 IS NULL OR code_sha256 ~ '^[0-9a-f]{64}$'),
  source_hash text NOT NULL CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  source_expires_at timestamptz,
  invalidated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX invalidated_legacy_email_codes_user_idx ON invalidated_legacy_email_codes (user_ref);

CREATE TRIGGER auth_identities_set_updated_at BEFORE UPDATE ON auth_identities FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER media_assets_set_updated_at BEFORE UPDATE ON media_assets FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER blog_posts_set_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER conversations_set_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER jobs_set_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER applications_set_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER partnerships_set_updated_at BEFORE UPDATE ON partnerships FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER announcements_set_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER knowledge_base_articles_set_updated_at BEFORE UPDATE ON knowledge_base_articles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
