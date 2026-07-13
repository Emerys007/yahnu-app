CREATE TABLE users (
  id text PRIMARY KEY,
  legacy_firebase_uid text UNIQUE,
  email text NOT NULL,
  pending_email text,
  password_hash text,
  google_sub text UNIQUE,
  auth_provider text NOT NULL DEFAULT 'password' CHECK (auth_provider IN ('password', 'google', 'migrated')),
  name text NOT NULL,
  first_name text,
  last_name text,
  role text NOT NULL CHECK (role IN ('graduate', 'company', 'school', 'admin', 'super_admin', 'content_manager', 'content_moderator', 'support_staff')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'declined')),
  school_id text REFERENCES users(id) ON DELETE SET NULL,
  school_name text,
  company_name text,
  contact_name text,
  industry text,
  experience text,
  education jsonb NOT NULL DEFAULT '[]'::jsonb,
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  phone text,
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX users_email_unique ON users (lower(email)) WHERE deleted_at IS NULL;
CREATE INDEX users_role_status_idx ON users (role, status);
CREATE INDEX users_school_role_status_idx ON users (school_id, role, status);
CREATE INDEX users_created_at_idx ON users (created_at DESC);

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  ip_hash text
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE auth_tokens (
  token_hash text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('verify_email', 'reset_password', 'change_email')),
  target_email text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);

CREATE INDEX auth_tokens_user_purpose_idx ON auth_tokens (user_id, purpose);
CREATE INDEX auth_tokens_expires_at_idx ON auth_tokens (expires_at);

CREATE TABLE invites (
  id text PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'super_admin', 'content_manager', 'content_moderator', 'support_staff')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'revoked', 'expired')),
  created_by text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  used_by text REFERENCES users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);

CREATE INDEX invites_email_status_idx ON invites (lower(email), status);
CREATE INDEX invites_created_at_idx ON invites (created_at DESC);

CREATE TABLE pages (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tickets (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  subject text,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tickets_user_id_idx ON tickets (user_id, submitted_at DESC);
CREATE INDEX tickets_status_idx ON tickets (status, submitted_at DESC);

CREATE TABLE dashboard_preferences (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  layouts jsonb NOT NULL DEFAULT '{}'::jsonb,
  reports jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE oauth_flows (
  state_hash text PRIMARY KEY,
  code_verifier text NOT NULL,
  nonce text NOT NULL,
  return_to text NOT NULL DEFAULT '/dashboard',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX oauth_flows_expires_at_idx ON oauth_flows (expires_at);

CREATE TABLE rate_limits (
  scope text NOT NULL,
  subject_hash text NOT NULL,
  count integer NOT NULL,
  reset_at timestamptz NOT NULL,
  PRIMARY KEY (scope, subject_hash)
);

CREATE INDEX rate_limits_reset_at_idx ON rate_limits (reset_at);

CREATE TABLE audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id text REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_actor_created_idx ON audit_logs (actor_user_id, created_at DESC);
CREATE INDEX audit_logs_target_idx ON audit_logs (target_type, target_id, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER pages_set_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tickets_set_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER dashboard_preferences_set_updated_at BEFORE UPDATE ON dashboard_preferences FOR EACH ROW EXECUTE FUNCTION set_updated_at();
