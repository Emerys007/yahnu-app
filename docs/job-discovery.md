# Approved-source job discovery

Yahnu combines two distinct opportunity types in the authenticated graduate
workspace:

- `yahnu`: posted by an employer account and applied to inside Yahnu;
- `external`: copied from an approved employer ATS feed and applied to on
  that employer's hosted Lever or Greenhouse page.

The interface must keep those application modes visibly distinct. An external
application status is always candidate-declared. It is never represented as
confirmed by Yahnu or the employer. The external CTA discloses that opening the
ATS records a removable `opened` entry in the graduate's private tracker.

## Refresh model and cost

There is no cron worker or paid scheduling service. When an authenticated
graduate opens the opportunity workspace, Yahnu checks source freshness. Up to
two stale sources are refreshed in the background while the last successful
copy remains available; discovery never waits for an external feed. A process
runs only one access-triggered refresh batch at a time, PostgreSQL advisory
locks coordinate multiple processes, and failed sources use durable exponential
backoff. Authorized content/admin staff can also use
**Synchroniser** for an immediate refresh.

This means sources do not refresh while the platform has no traffic and nobody
uses the admin action. The dashboard describes this behavior directly.

## Approved sources

Feed URLs, ATS hosts and expected employer-board path prefixes are code-pinned
in `src/lib/server/job-source-registry.ts` and
mirrored by migration `009_unified_job_discovery.sql`. Admins can pause or
resume an approved source; they cannot enter a URL for Yahnu to fetch.
The separately stored career URL points to the employer's own career page so
the interface never labels an ATS destination as if it were the employer domain.

Initial sources:

- Heetch / Fleetch — Lever official postings feed, Côte d'Ivoire filter;
- Yassir — Lever official postings feed, African location filter;
- Jumia — Greenhouse official job-board feed, African location filter;
- ALX Africa — Greenhouse official job-board feed, African/remote filter.

No demo board or third-party job aggregator is configured.

## Network and data controls

- HTTPS and exact-host allowlists for feed and application URLs;
- blocked local/internal hostnames plus public-DNS/IP validation;
- redirects disabled, six-second timeout, 1.5 MB response cap;
- bounded Lever pagination that requires a final short page before expiry;
- bounded Zod schemas and plain-text descriptions;
- PostgreSQL advisory lock per source;
- stable source IDs, source hashes and cross-source fingerprints;
- missing jobs expire only after a complete successful sync;
- failed or suspiciously empty syncs preserve the last-known-good catalog;
- same-source reposts retain the canonical card, moderation state, saves and
  candidate tracking even when the provider changes its external ID;
- inactive sources and moderated jobs are excluded at query time.
