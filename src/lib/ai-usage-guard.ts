import 'server-only'

import { enforceRateLimitSubject } from '@/lib/server/rate-limit'

/**
 * Keeps paid AI features opt-in and applies a shared PostgreSQL-backed quota per user.
 */
export async function assertAiRequestAllowed(feature: string, limit: number, userId: string) {
  if (process.env.YAHNU_ENABLE_AI !== 'true') {
    throw new Error('AI features are not enabled for this deployment.')
  }

  if (!process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
    throw new Error('AI features are not configured for this deployment.')
  }

  await enforceRateLimitSubject(`ai:${feature}`, limit, 60 * 60, `user:${userId}`)
}
