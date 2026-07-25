export const PASSWORD_FORGOT_MINIMUM_RESPONSE_MS = 1_200
export const PASSWORD_FORGOT_RESPONSE_JITTER_MS = 300
export const PASSWORD_RESET_ISSUANCE_DEBOUNCE_MINUTES = 10

/**
 * Computes the remaining delay for an accepted recovery request. The random
 * jitter is supplied by the server route so this function remains unit-testable.
 */
export function remainingRecoveryResponseDelayMs(startedAt, now, jitterMs = 0) {
  const safeStartedAt = Number.isFinite(startedAt) ? startedAt : now
  const safeJitter = Number.isFinite(jitterMs)
    ? Math.min(PASSWORD_FORGOT_RESPONSE_JITTER_MS, Math.max(0, Math.floor(jitterMs)))
    : 0
  const elapsed = Math.max(0, now - safeStartedAt)
  return Math.max(0, PASSWORD_FORGOT_MINIMUM_RESPONSE_MS + safeJitter - elapsed)
}

export async function waitForNeutralRecoveryTiming(startedAt, jitterMs) {
  const delay = remainingRecoveryResponseDelayMs(startedAt, Date.now(), jitterMs)
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay))
}
