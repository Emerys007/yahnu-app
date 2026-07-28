-- Unified, source-transparent opportunity discovery for graduates.
-- External source endpoints are also pinned in the application registry. The
-- database copy is operational metadata, not an open redirect/fetch target.

CREATE TABLE job_sources (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  organization_name text NOT NULL CHECK (length(btrim(organization_name)) BETWEEN 2 AND 160),
  adapter text NOT NULL CHECK (adapter IN ('lever', 'greenhouse')),
  feed_url text NOT NULL CHECK (feed_url ~ '^https://'),
  career_url text NOT NULL CHECK (career_url ~ '^https://'),
  official_domain text NOT NULL CHECK (official_domain ~ '^[a-z0-9.-]+$'),
  market_scope text NOT NULL CHECK (market_scope IN ('ivory_coast', 'africa')),
  enabled boolean NOT NULL DEFAULT true,
  sync_interval_minutes integer NOT NULL DEFAULT 360 CHECK (sync_interval_minutes BETWEEN 60 AND 10080),
  max_items integer NOT NULL DEFAULT 150 CHECK (max_items BETWEEN 1 AND 200),
  last_sync_started_at timestamptz,
  last_sync_completed_at timestamptz,
  last_success_at timestamptz,
  next_sync_after timestamptz,
  last_error_code text CHECK (last_error_code IS NULL OR length(last_error_code) <= 100),
  consecutive_failures integer NOT NULL DEFAULT 0 CHECK (consecutive_failures >= 0),
  last_item_count integer NOT NULL DEFAULT 0 CHECK (last_item_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX job_sources_refresh_idx
  ON job_sources (enabled, next_sync_after, last_success_at NULLS FIRST);

CREATE TABLE external_jobs (
  id text PRIMARY KEY CHECK (id ~ '^ext_[0-9a-f]{32}$'),
  source_id text NOT NULL REFERENCES job_sources(id) ON DELETE RESTRICT,
  external_id text NOT NULL CHECK (length(btrim(external_id)) BETWEEN 1 AND 300),
  dedup_key text NOT NULL UNIQUE CHECK (dedup_key ~ '^[0-9a-f]{64}$'),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 2 AND 240),
  company_name text NOT NULL CHECK (length(btrim(company_name)) BETWEEN 2 AND 160),
  location text CHECK (location IS NULL OR length(btrim(location)) BETWEEN 1 AND 500),
  employment_type text CHECK (
    employment_type IS NULL OR employment_type IN
      ('full_time', 'part_time', 'contract', 'internship', 'temporary', 'volunteer', 'other')
  ),
  workplace_type text CHECK (
    workplace_type IS NULL OR workplace_type IN ('on_site', 'hybrid', 'remote', 'unspecified')
  ),
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 20 AND 30000),
  apply_url text NOT NULL CHECK (apply_url ~ '^https://'),
  canonical_url text NOT NULL CHECK (canonical_url ~ '^https://'),
  categories text[] NOT NULL DEFAULT '{}'::text[],
  target_markets text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'hidden')),
  source_published_at timestamptz,
  source_updated_at timestamptz,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '21 days',
  moderated_by text REFERENCES users(id) ON DELETE SET NULL,
  moderated_at timestamptz,
  moderation_note text CHECK (moderation_note IS NULL OR length(moderation_note) <= 1000),
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_hash text NOT NULL CHECK (source_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, external_id)
);

CREATE INDEX external_jobs_discovery_idx
  ON external_jobs (status, expires_at, source_updated_at DESC NULLS LAST);
CREATE INDEX external_jobs_source_seen_idx
  ON external_jobs (source_id, last_seen_at DESC);
CREATE INDEX external_jobs_search_idx
  ON external_jobs USING gin (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(company_name, '') || ' '
        || coalesce(location, '') || ' ' || left(coalesce(description, ''), 30000)
    )
  );
CREATE INDEX jobs_discovery_search_idx
  ON jobs USING gin (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(company_name, '') || ' '
        || coalesce(location, '') || ' ' || left(coalesce(description, ''), 30000)
    )
  );

CREATE TABLE saved_jobs (
  id text PRIMARY KEY CHECK (id ~ '^saved_[0-9a-f]{32}$'),
  graduate_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_kind text NOT NULL CHECK (job_kind IN ('yahnu', 'external')),
  internal_job_id text REFERENCES jobs(id) ON DELETE CASCADE,
  external_job_id text REFERENCES external_jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (job_kind = 'yahnu' AND internal_job_id IS NOT NULL AND external_job_id IS NULL)
    OR
    (job_kind = 'external' AND external_job_id IS NOT NULL AND internal_job_id IS NULL)
  )
);

CREATE UNIQUE INDEX saved_jobs_internal_unique
  ON saved_jobs (graduate_id, internal_job_id)
  WHERE internal_job_id IS NOT NULL;
CREATE UNIQUE INDEX saved_jobs_external_unique
  ON saved_jobs (graduate_id, external_job_id)
  WHERE external_job_id IS NOT NULL;
CREATE INDEX saved_jobs_graduate_created_idx
  ON saved_jobs (graduate_id, created_at DESC);

CREATE TABLE external_job_statuses (
  graduate_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_job_id text NOT NULL REFERENCES external_jobs(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (
    status IN ('opened', 'considering', 'applied', 'interview', 'offer', 'rejected', 'withdrawn')
  ),
  candidate_note text CHECK (candidate_note IS NULL OR length(candidate_note) <= 1000),
  candidate_declared_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz,
  employer_confirmed boolean NOT NULL DEFAULT false CHECK (employer_confirmed = false),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (graduate_id, external_job_id)
);

CREATE INDEX external_job_statuses_graduate_idx
  ON external_job_statuses (graduate_id, updated_at DESC);

INSERT INTO job_sources (
  id, organization_name, adapter, feed_url, career_url, official_domain,
  market_scope, sync_interval_minutes, max_items
) VALUES
  (
    'lever-heetch',
    'Heetch / Fleetch',
    'lever',
    'https://api.lever.co/v0/postings/heetch?mode=json',
    'https://www.heetch.com/jobs',
    'heetch.com',
    'ivory_coast',
    240,
    100
  ),
  (
    'lever-yassir',
    'Yassir',
    'lever',
    'https://api.lever.co/v0/postings/Yassir?mode=json',
    'https://yassir.com/career',
    'yassir.com',
    'africa',
    360,
    200
  ),
  (
    'greenhouse-jumia',
    'Jumia',
    'greenhouse',
    'https://boards-api.greenhouse.io/v1/boards/jumia/jobs?content=true',
    'https://group.jumia.com/careers',
    'jumia.com',
    'africa',
    360,
    100
  ),
  (
    'greenhouse-alx-africa',
    'ALX Africa',
    'greenhouse',
    'https://boards-api.greenhouse.io/v1/boards/alxafrica/jobs?content=true',
    'https://careers.alxafrica.com/joinus/',
    'alxafrica.com',
    'africa',
    360,
    100
  );
