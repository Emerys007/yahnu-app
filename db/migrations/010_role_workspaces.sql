-- Real organization, event, talent-consent, and reporting foundations.
-- These tables intentionally keep public publishing and graduate visibility opt-in.

CREATE TABLE organization_profiles (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' AND length(slug) BETWEEN 3 AND 80),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 6000),
  website_url text CHECK (website_url IS NULL OR length(website_url) <= 2048),
  locations jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(locations) = 'array'),
  organization_size text CHECK (
    organization_size IS NULL
    OR organization_size IN ('1_10', '11_50', '51_200', '201_500', '501_1000', '1000_plus')
  ),
  organization_type text CHECK (organization_type IS NULL OR length(btrim(organization_type)) BETWEEN 2 AND 120),
  programs jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(programs) = 'array'),
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(benefits) = 'array'),
  culture jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(culture) = 'array'),
  logo_asset_id text REFERENCES media_assets(id) ON DELETE SET NULL,
  cover_asset_id text REFERENCES media_assets(id) ON DELETE SET NULL,
  contact_name text CHECK (contact_name IS NULL OR length(btrim(contact_name)) BETWEEN 2 AND 160),
  contact_email text CHECK (contact_email IS NULL OR length(contact_email) <= 320),
  contact_phone text CHECK (contact_phone IS NULL OR length(contact_phone) <= 40),
  public_publish_consent boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_requested_at timestamptz,
  verification_reviewed_at timestamptz,
  verification_reviewed_by text REFERENCES users(id) ON DELETE SET NULL,
  verification_note text CHECK (verification_note IS NULL OR length(verification_note) <= 1000),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (public_publish_consent = false AND published_at IS NULL)
    OR public_publish_consent = true
  )
);

CREATE INDEX organization_profiles_public_idx
  ON organization_profiles (public_publish_consent, updated_at DESC)
  WHERE public_publish_consent = true;

CREATE TABLE career_events (
  id text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 200),
  organizer_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 3 AND 180),
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 20 AND 12000),
  event_format text NOT NULL CHECK (event_format IN ('onsite', 'online', 'hybrid')),
  location text CHECK (location IS NULL OR length(btrim(location)) BETWEEN 2 AND 240),
  online_url text CHECK (online_url IS NULL OR length(online_url) <= 2048),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  registration_deadline timestamptz,
  capacity integer CHECK (capacity IS NULL OR capacity BETWEEN 1 AND 100000),
  audience text NOT NULL DEFAULT 'all_graduates'
    CHECK (audience IN ('all_graduates', 'school_graduates')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  reminder_state text NOT NULL DEFAULT 'not_scheduled'
    CHECK (reminder_state IN ('not_scheduled', 'scheduled', 'processing', 'completed', 'failed')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  CHECK (registration_deadline IS NULL OR registration_deadline <= starts_at),
  CHECK (
    (event_format = 'online' AND online_url IS NOT NULL)
    OR event_format <> 'online'
  ),
  CHECK (
    (status = 'published' AND published_at IS NOT NULL)
    OR status <> 'published'
  )
);

CREATE INDEX career_events_organizer_idx ON career_events (organizer_id, starts_at DESC);
CREATE INDEX career_events_discovery_idx
  ON career_events (starts_at, registration_deadline)
  WHERE status = 'published';

CREATE TABLE career_event_registrations (
  event_id text NOT NULL REFERENCES career_events(id) ON DELETE CASCADE,
  graduate_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered', 'cancelled', 'attended')),
  reminder_state text NOT NULL DEFAULT 'not_scheduled'
    CHECK (reminder_state IN ('not_scheduled', 'scheduled', 'processing', 'completed', 'failed')),
  registered_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, graduate_id),
  CHECK (
    (status = 'cancelled' AND cancelled_at IS NOT NULL)
    OR status <> 'cancelled'
  )
);

CREATE INDEX career_event_registrations_graduate_idx
  ON career_event_registrations (graduate_id, registered_at DESC);
CREATE INDEX career_event_registrations_active_idx
  ON career_event_registrations (event_id, registered_at)
  WHERE status IN ('registered', 'attended');

CREATE TABLE talent_profiles (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  visibility_consent boolean NOT NULL DEFAULT false,
  headline text NOT NULL DEFAULT '' CHECK (length(headline) <= 180),
  summary text NOT NULL DEFAULT '' CHECK (length(summary) <= 3000),
  preferred_roles jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(preferred_roles) = 'array'),
  preferred_locations jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(preferred_locations) = 'array'),
  work_modes jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(work_modes) = 'array'),
  employment_types jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(employment_types) = 'array'),
  availability text CHECK (
    availability IS NULL
    OR availability IN ('immediate', 'one_month', 'three_months', 'exploring')
  ),
  portfolio_evidence jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(portfolio_evidence) = 'array'),
  consented_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (visibility_consent = true AND consented_at IS NOT NULL AND withdrawn_at IS NULL)
    OR visibility_consent = false
  )
);

CREATE INDEX talent_profiles_visible_idx
  ON talent_profiles (updated_at DESC)
  WHERE visibility_consent = true;

CREATE TABLE talent_shortlists (
  organization_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  graduate_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 1000),
  status text NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'contacted', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, graduate_id)
);

CREATE INDEX talent_shortlists_organization_idx
  ON talent_shortlists (organization_id, status, updated_at DESC);

CREATE TABLE talent_contact_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  graduate_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id text REFERENCES conversations(id) ON DELETE SET NULL,
  outcome text NOT NULL CHECK (outcome IN ('conversation_created', 'conversation_reused', 'rate_limited')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX talent_contact_log_limit_idx
  ON talent_contact_log (organization_id, created_at DESC);
CREATE INDEX talent_contact_log_graduate_idx
  ON talent_contact_log (graduate_id, created_at DESC);

CREATE TRIGGER organization_profiles_set_updated_at
  BEFORE UPDATE ON organization_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER career_events_set_updated_at
  BEFORE UPDATE ON career_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER career_event_registrations_set_updated_at
  BEFORE UPDATE ON career_event_registrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER talent_profiles_set_updated_at
  BEFORE UPDATE ON talent_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER talent_shortlists_set_updated_at
  BEFORE UPDATE ON talent_shortlists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
