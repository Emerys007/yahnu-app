export function refreshBackoffMinutes(consecutiveFailures: number) {
  const failures = Math.max(1, Math.min(Math.trunc(consecutiveFailures), 8));
  return Math.min(360, 5 * (2 ** (failures - 1)));
}

export function shouldAttemptJobSourceRefresh(input: {
  force: boolean;
  enabled: boolean;
  lastSuccessAt: Date | string | null;
  nextSyncAfter: Date | string | null;
  syncIntervalMinutes: number;
  now?: Date;
}) {
  if (!input.enabled) return false;
  if (input.force) return true;

  const now = (input.now ?? new Date()).getTime();
  if (input.nextSyncAfter && new Date(input.nextSyncAfter).getTime() > now) return false;
  if (!input.lastSuccessAt) return true;

  return new Date(input.lastSuccessAt).getTime() + input.syncIntervalMinutes * 60_000 <= now;
}
