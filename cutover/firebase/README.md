# Firebase source-freeze assets

These files are **cutover-only**. They deny every Firestore and Storage client read and write. Final export and verification use privileged Google credentials and do not depend on client rules.

Before applying them:

1. Export the active Firestore rules and Storage rules to an encrypted rollback bundle.
2. Record the active Firebase App Hosting release and automatic-rollout setting.
3. Record enabled Authentication providers and the Trigger Email extension configuration.
4. Disable App Hosting automatic rollouts and present the scheduled maintenance notice.
5. Drain or explicitly disposition pending `mail` documents, then disable Trigger Email and every Admin SDK, scheduled, extension, or background writer.
6. Confirm project `yahnu-50c61`, database `(default)`, and the actual bucket with Firebase Console or `gcloud storage buckets list --project yahnu-50c61`. Do not infer the bucket suffix: project evidence contains both `appspot.com` and `firebasestorage.app` values.

Apply both rule sets with an authenticated Firebase CLI:

```powershell
firebase deploy --project yahnu-50c61 --only firestore:rules --config cutover/firebase/firebase.freeze.json
firebase deploy --project yahnu-50c61 --only storage --config cutover/firebase/firebase.freeze.json
```

Prove that test reads and writes now fail, and observe zero privileged writes before taking final exports. The production app may show only its static shell during this window; data access is intentionally unavailable.

Do not delete Firebase after launch. Keep it frozen for the agreed rollback window.

## Pre-write rollback

Rollback is safe only before Render has accepted production writes:

1. Enable Render Maintenance Mode first.
2. Restore the archived Firestore and Storage rules with explicit `--project yahnu-50c61` commands.
3. Restore the recorded Authentication providers, Trigger Email/writers, and the known-good App Hosting release.
4. Restore only the DNS record changed for the application hostname, if any.
5. Verify Firebase read/write, login, email, and media flows before reopening it.

After Render accepts writes, do not perform this simple rollback: first reverse-reconcile Render data into Firebase or obtain explicit acceptance of the resulting data loss. Never let both stores accept writes.
