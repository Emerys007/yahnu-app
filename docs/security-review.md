# Yahnu release security review

Reviewed for the Côte d’Ivoire market release on 2026-07-28.

## Release posture

- Authentication and role authorization remain server-side. `/admin` is only a role-aware entry point; it does not bypass admin or super-admin checks.
- Session, reset, invitation, and verification credentials are opaque, hashed at rest, time-bounded, and single-use where applicable.
- Mutating API routes use the canonical `APP_URL` origin policy and fail closed in production. Proxy-supplied host headers are not trusted.
- Account-recovery responses are generic, rate-limited by privacy-preserving identifiers, protected against replay, and unavailable in production until email delivery is configured.
- Organization identity changes revoke verification. Talent visibility and employer contact require explicit graduate consent.
- Media is signature-checked, quota-bound, private until deliberately published, and cleaned up on failed operations.
- External job ingestion accepts only configured HTTPS sources and applies hostname, redirect, address, size, and timeout controls to reduce SSRF exposure.
- Skills questions and answer keys live outside Git in a Render Secret File. Attempts are timed, randomized, graded server-side, and snapshot an immutable release. Human review, consent versions, adverse-decision reasons, revocation, expiry, and public-verification privacy are persisted.
- Database migrations protect immutable assessment releases and prevent pending or revoked attestations from becoming public.
- CI and production dependencies currently report zero known high-severity runtime vulnerabilities.

## Residual risks and operating decisions

- The static-compatible Next.js Content Security Policy retains narrowly scoped `unsafe-inline` allowances. Moving to per-request nonces would make affected routes dynamic and should be evaluated separately against Render cost and caching impact.
- Email delivery is a production health dependency. `RESEND_API_KEY`, `EMAIL_FROM`, and the canonical HTTPS `APP_URL` must remain configured and monitored.
- The protected assessment bank is operationally sensitive. Restrict Render workspace access, rotate compromised releases by creating a new immutable version, and never copy bank contents into issues, pull requests, CI logs, or support messages.
- Official job sources may change schemas or availability. Source failures must stay isolated, visible to administrators, and must never convert unverified listings into first-party Yahnu claims.

## Verification commands

Run the full release checklist in `README.md`, including:

```powershell
npm run typecheck
npm run lint
npm run test:http-security
npm run test:password-recovery
npm run test:role-workspaces
npm run test:skills-checks
npm audit --omit=dev --audit-level=high
npm run build
```
