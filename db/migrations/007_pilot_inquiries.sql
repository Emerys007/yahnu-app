CREATE TABLE pilot_inquiries (
  id text PRIMARY KEY CHECK (id ~ '^[0-9a-f-]{36}$'),
  kind text NOT NULL CHECK (kind IN (
    'pilot', 'partnership', 'employer', 'school', 'product', 'other'
  )),
  full_name text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (length(btrim(email)) BETWEEN 3 AND 254),
  phone text CHECK (phone IS NULL OR length(btrim(phone)) BETWEEN 7 AND 30),
  organization_name text NOT NULL CHECK (length(btrim(organization_name)) BETWEEN 2 AND 180),
  organization_type text NOT NULL CHECK (organization_type IN (
    'public_institution', 'university', 'company', 'ngo', 'funder', 'community', 'other'
  )),
  role_title text CHECK (role_title IS NULL OR length(btrim(role_title)) BETWEEN 2 AND 120),
  city text CHECK (city IS NULL OR length(btrim(city)) BETWEEN 2 AND 100),
  country_code text NOT NULL DEFAULT 'CI' CHECK (country_code IN (
    'CI', 'ZA', 'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'KM', 'CG',
    'CD', 'DJ', 'EG', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GQ', 'GW',
    'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MA', 'MU', 'MR', 'MZ', 'NA',
    'NE', 'NG', 'UG', 'CF', 'RW', 'EH', 'ST', 'SN', 'SC', 'SL', 'SO', 'SD',
    'SS', 'TZ', 'TD', 'TG', 'TN', 'ZM', 'ZW'
  )),
  participant_estimate integer CHECK (
    participant_estimate IS NULL OR participant_estimate BETWEEN 1 AND 1000000
  ),
  timeline text NOT NULL CHECK (timeline IN ('now', 'three_months', 'six_months', 'exploring')),
  message text NOT NULL CHECK (length(btrim(message)) BETWEEN 30 AND 3000),
  locale text NOT NULL DEFAULT 'fr' CHECK (locale IN ('fr', 'en')),
  source text NOT NULL DEFAULT 'contact' CHECK (source IN (
    'contact', 'institutions', 'impact', 'footer', 'other'
  )),
  campaign text CHECK (campaign IS NULL OR length(btrim(campaign)) BETWEEN 1 AND 80),
  status text NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'reviewing', 'contacted', 'qualified', 'closed'
  )),
  internal_notes text CHECK (
    internal_notes IS NULL OR length(btrim(internal_notes)) BETWEEN 1 AND 4000
  ),
  consented_at timestamptz NOT NULL,
  retention_expires_at timestamptz NOT NULL DEFAULT (now() + interval '18 months'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (retention_expires_at > created_at)
);

CREATE INDEX pilot_inquiries_status_created_idx
  ON pilot_inquiries (status, created_at DESC);
CREATE INDEX pilot_inquiries_email_created_idx
  ON pilot_inquiries (lower(email), created_at DESC);
CREATE INDEX pilot_inquiries_retention_idx
  ON pilot_inquiries (retention_expires_at);

CREATE TRIGGER pilot_inquiries_set_updated_at
  BEFORE UPDATE ON pilot_inquiries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
