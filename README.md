# Yahnu

Yahnu is a career network connecting graduates, institutions, and employers around trusted opportunities. The application now runs entirely on Next.js and PostgreSQL and is designed for deployment on Render.

## Architecture

- **Application:** Next.js 16 App Router with standalone Node output
- **Database:** PostgreSQL 17 through `node-postgres`
- **Authentication:** Yahnu-owned password and Google OpenID Connect flows
- **Sessions:** opaque, revocable, HTTP-only cookies backed by PostgreSQL
- **Email:** Resend's HTTP API for verification, reset, and staff-invitation messages
- **Hosting:** Render web service and Render Postgres, provisioned by `render.yaml`

Firebase is not a runtime dependency. The only Firebase-specific code left is the optional, one-time export/import tooling used during cutover.

## Local setup

Requirements: Node 22.9 or newer in the Node 22 line, plus Docker Desktop (or a local PostgreSQL 17 server).

```powershell
Copy-Item .env.example .env.local
npm ci
docker compose up -d --wait
npm run db:migrate
npm run admin:create -- --email admin@example.com --name "Local Admin" --password "ChangeMe12345!"
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The database-aware health endpoint is [http://localhost:3000/api/health](http://localhost:3000/api/health).

Without `RESEND_API_KEY` and `EMAIL_FROM`, development-mode verification and reset screens expose a local-only link so the complete flow can still be tested. Production fails closed when email is not configured.

Useful checks:

```powershell
npm run lint
npm run lint:i18n
npm run typecheck
npm run build
npm audit --omit=dev
```

Stop the database with `docker compose stop`; restart it with `docker compose up -d --wait`. Data lives in the named `yahnu_pgdata` volume. To smoke-test the production bundle locally after `npm run build`, run `npm start`; the start script loads `.env.local` before launching the standalone server.

## Environment

Copy `.env.example` to `.env.local`. Important values:

- `DATABASE_URL`: direct PostgreSQL connection; migrations always use this URL.
- `DATABASE_POOL_URL`: optional PgBouncer URL for application traffic. Runtime code prefers it when present.
- `AUTH_SECRET`: at least 32 random characters in production.
- `APP_URL`: the public origin, without a trailing slash.
- `RESEND_API_KEY` and `EMAIL_FROM`: required for production account email.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: optional Google login. Register `${APP_URL}/api/auth/google/callback` as an authorized redirect URI.
- `NEXT_PUBLIC_OPENCAGE_API_KEY`: optional address autocomplete.
- `GEMINI_API_KEY` plus `YAHNU_ENABLE_AI=true`: optional server-only AI features.

Never commit `.env.local`, database dumps, Firebase exports, or service credentials.

## Render deployment

Create a Render Blueprint from this repository. `render.yaml` provisions a paid Starter web service and a production PostgreSQL database in the same Ohio region. It also:

- runs `npm ci --include=dev && npm run build`;
- runs `npm run db:migrate` as a pre-deploy command before traffic moves;
- injects the internal database URL and generates `AUTH_SECRET`;
- blocks external database access by default;
- checks both Node and PostgreSQL through `/api/health`.

Set the prompted secret values in Render. Set `APP_URL` to the final HTTPS origin. A custom domain change also requires updating the Google callback URI. Verify the `EMAIL_FROM` domain/address in Resend and send a production delivery test before opening registration.

After the first migration succeeds, immediately enable Render [Maintenance Mode](https://render.com/docs/maintenance-mode) for the web service and verify its `onrender.com` URL returns HTTP 503. Then open Render Shell and create the first super administrator. Use an email that does not belong to any legacy Firebase account. For shell-history safety, add `ADMIN_EMAIL`, `ADMIN_NAME`, and a temporary `ADMIN_PASSWORD` as secret environment variables, run `npm run admin:create`, then remove `ADMIN_PASSWORD`. Additional staff should use the in-app invitation flow.

The migration script uses a session-level PostgreSQL advisory lock. Keep `DATABASE_URL` pointed at the direct port 5432 connection. If PgBouncer is enabled later, expose its `connectionPoolString` separately as `DATABASE_POOL_URL`; never run migrations through the transaction pool.

## Firebase data cutover

The one-time cutover workstation needs the Firebase CLI and Google Cloud CLI (`gcloud`). Rehearse the entire process against staging first and start the final production import from the fresh Blueprint database plus the distinct break-glass administrator.

The importer treats Firebase Auth as the identity authority. Auth owns UID, canonical email, verification, and disabled state; Firestore can enrich only an already-imported Auth UID. Firestore-only user documents are never resurrected as accounts, an Auth-disabled user cannot be reactivated by stale profile data, and password-like fields are stripped recursively. Any skipped, invalid, orphaned, conflicting, or database-rejected record rolls the whole import back and fails non-zero (the direct script uses exit code 2) unless `--allow-partial` is deliberately supplied.

### 1. Enforce the source freeze

Schedule a maintenance window and lower the existing domain's DNS TTL 24-48 hours beforehand. At the start of the window:

1. Save the current Firebase Auth provider settings and Firestore rules for rollback.
2. Deploy a maintenance-only Firebase build with registration, login, and all mutations removed.
3. Temporarily disable the enabled sign-in providers in Firebase Authentication.
4. Deploy Firestore rules that deny every client write while preserving only the reads needed for the maintenance page.
5. Prove the freeze: a test signup/sign-in must fail, a direct Firestore write must be denied, and no background worker may still write.
6. Keep the paid Render web service in Maintenance Mode too; its `onrender.com` URL must return 503 throughout import and reconciliation.

A banner alone is not a freeze. Do not take either export until both source and target write checks pass.

### 2. Export Auth and Firestore

`C:\secure` is only an example path, not a security control. Before exporting, create it on a BitLocker/device-encrypted volume, remove inherited access, grant only the cutover operator access, and inspect the final ACL. Do not proceed if another interactive user or broad group can read it.

```powershell
New-Item -ItemType Directory -Path C:\secure -Force | Out-Null
icacls C:\secure /inheritance:r
if ($LASTEXITCODE -ne 0) { throw 'Could not remove inherited export-directory access.' }
icacls C:\secure /grant:r "$($env:USERDOMAIN)\$($env:USERNAME):(OI)(CI)F"
if ($LASTEXITCODE -ne 0) { throw 'Could not grant the cutover operator access.' }
Get-Acl C:\secure | Format-List Owner,AccessToString
```

Firebase Auth exports can contain password hashes, and legacy Firestore data can contain plaintext secrets. Keep both files out of source control, sync folders, chat, and tickets.

```powershell
firebase auth:export C:\secure\yahnu-auth.json --project <firebase-project-id> --format=json
if ($LASTEXITCODE -ne 0) { throw 'Firebase Auth export failed.' }

gcloud auth login
if ($LASTEXITCODE -ne 0) { throw 'Google Cloud login failed.' }
$token = gcloud auth print-access-token
if ($LASTEXITCODE -ne 0) { throw 'Access-token creation failed.' }
$env:GOOGLE_ACCESS_TOKEN = $token
try {
  npm run firebase:export:firestore -- --project <firebase-project-id> --output C:\secure\yahnu-firestore.json
  if ($LASTEXITCODE -ne 0) { throw 'Firestore export failed.' }
} finally {
  Remove-Item Env:GOOGLE_ACCESS_TOKEN -ErrorAction SilentlyContinue
  $token = $null
}
```

The Google identity needs Firestore read permission. The OAuth token is short-lived and is never written by the exporter. Do not use `gcloud firestore export`: it creates a managed Cloud Storage backup, not importer-compatible JSON.

### 3. Import with explicit review gates

In Render PostgreSQL **Networking**, temporarily allow only the workstation's current public IP as a `/32`, then copy the full external database URL. The following block prompts for secrets without placing them in shell history, stops after any failed native command, and requires typed confirmation between the dry runs and writes:

```powershell
function Set-SecretEnvironmentVariable([string]$Name, [string]$Prompt) {
  $secure = Read-Host $Prompt -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    [Environment]::SetEnvironmentVariable($Name, [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer), 'Process')
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}
function Assert-NativeStep([string]$Step) {
  if ($LASTEXITCODE -ne 0) { throw "$Step failed with exit code $LASTEXITCODE." }
}
function Confirm-Gate([string]$Expected, [string]$Prompt) {
  if ((Read-Host $Prompt) -cne $Expected) { throw 'Cutover stopped at operator review gate.' }
}

Set-SecretEnvironmentVariable DATABASE_URL 'Paste the full external Render PostgreSQL URL'
Set-SecretEnvironmentVariable AUTH_SECRET 'Paste the exact Render AUTH_SECRET'
$env:PGSSLMODE = 'verify-full'

try {
  npm run db:migrate
  Assert-NativeStep 'Database migration'

  npm run firebase:import -- --file C:\secure\yahnu-auth.json --source auth --dry-run
  Assert-NativeStep 'Auth dry run'
  Confirm-Gate 'IMPORT AUTH' 'Review the complete Auth summary, then type IMPORT AUTH'

  npm run firebase:import -- --file C:\secure\yahnu-auth.json --source auth
  Assert-NativeStep 'Auth import'
  Confirm-Gate 'AUTH BACKUP READY' 'Create and wait for a Render logical export now, then type AUTH BACKUP READY'

  npm run firebase:import -- --file C:\secure\yahnu-firestore.json --source firestore --dry-run
  Assert-NativeStep 'Firestore dry run'
  Confirm-Gate 'IMPORT FIRESTORE' 'Review every Firestore warning, then type IMPORT FIRESTORE'

  npm run firebase:import -- --file C:\secure\yahnu-firestore.json --source firestore
  Assert-NativeStep 'Firestore import'

  npm run firebase:verify -- --auth C:\secure\yahnu-auth.json --firestore C:\secure\yahnu-firestore.json
  Assert-NativeStep 'Post-import reconciliation'
  Confirm-Gate 'RECONCILIATION APPROVED' 'Review privileged accounts, role/status totals, Firestore-only UIDs, collection counts, and every accepted exception; then type RECONCILIATION APPROVED'
} finally {
  Remove-Item Env:DATABASE_URL,Env:PGSSLMODE,Env:AUTH_SECRET -ErrorAction SilentlyContinue
}
```

Do not bypass a non-zero strict dry run reflexively. Correct the data or importer first. If records are confirmed obsolete and partial import is an explicit business decision, rerun both that dry run and live command with `--allow-partial`, record the accepted exceptions, and expect reconciliation to keep reporting any collection shortfall.

The Auth import must commit before the Firestore dry run because Firestore updates are intentionally UID-matched and update-only. The reconciliation command checks the Auth UID set, canonical emails, verification flags, disabled users, privileged accounts, role/status counts, school links, and collection counts.

Historical Firebase invitations did not record their creator. Non-pending history is retained with null provenance; an untrusted pending legacy invitation is revoked during import and should be recreated from Yahnu after go-live. A pending invite with valid creator provenance remains usable only when imported with the exact Render `AUTH_SECRET`.

### 4. Validate and switch traffic

1. Complete representative graduate, school, company, staff, password-reset, verification, Google, CMS, dashboard, and support-ticket browser flows in staging before the final freeze. In production maintenance, run the reconciliation command and verify `/api/health` from Render Shell/private access.
2. Verify the Resend sender and deliver real verification/reset emails from staging. Confirm the production Google callback exactly matches `${APP_URL}/api/auth/google/callback`.
3. Create a final [Render logical export](https://render.com/docs/postgresql-backups). Paid Render PostgreSQL also provides point-in-time recovery.
4. Remove the temporary database `/32` rule immediately, revoke temporary Google/Firebase credentials, and delete both local export files with `Remove-Item -LiteralPath C:\secure\yahnu-auth.json,C:\secure\yahnu-firestore.json -Force`. Verify they are gone. Residual-data protection depends on the encrypted volume; a path named `secure` or Windows file deletion alone is not a secure-erasure guarantee.
5. [Add and verify the custom domain](https://render.com/docs/custom-domains), update DNS, and wait until Render has issued TLS and HTTPS succeeds. Only then disable Render Maintenance Mode.
6. Monitor health, authentication, email delivery, database errors, and support traffic closely.

Imported accounts intentionally receive no Firebase password hash. Treat legacy credentials as unavailable and direct users through forgot-password; Firebase profile documents could contain plaintext credential fields, which the importer removes.

Rollback is lossless only while Render is still in Maintenance Mode and has accepted no new writes. After go-live, switching DNS back to the frozen Firebase database would discard Render-side changes. A later rollback therefore requires putting Render back into maintenance, reverse-reconciling/exporting new Render data, and either applying it to Firebase or explicitly accepting the loss. Never let both databases accept writes concurrently.

## Security boundaries

- Public signup can only create pending graduate, company, or school accounts.
- Staff accounts require an email-bound, hashed, expiring, single-use invitation.
- Every data mutation is authorized by a server route; dashboard visibility is only a UX layer.
- Graduates cannot approve themselves, change their school association, or mark education as verified.
- Admin updates are field-allowlisted, sensitive actions revoke sessions, and security-relevant actions are audited.
- Passwords use memory-hard scrypt hashing; reset and verification tokens are hashed and single-use.
- Authentication endpoints are rate-limited and reject cross-site browser requests.
- Production cookies are Secure, HTTP-only, SameSite=Lax, and use the `__Host-` prefix.
- Health and API errors do not expose database or provider internals.
