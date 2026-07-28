import 'server-only';

import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { z } from 'zod';

import {
  accommodationSeconds,
  createRandomizedManifest,
  SKILLS_CONDITIONS_VERSION,
  SKILLS_PRIVACY_NOTICE_VERSION,
  SKILLS_PUBLIC_CONSENT_VERSION,
  type SkillsAccommodationCode,
  type SkillsAttestationSummary,
  type SkillsAttemptView,
  type SkillsCheckSummary,
} from '@/lib/skills-checks';
import { writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { ApiError } from '@/lib/server/http';

type Locale = 'fr' | 'en';
type IntegrityReviewStatus = SkillsAttemptView['integrityReviewStatus'];

type CheckRow = {
  id: string;
  title_fr: string;
  title_en: string;
  description_fr: string;
  description_en: string;
  skill_area: string;
  version: number;
  duration_seconds: number;
  questions_per_attempt: number;
  passing_score: number;
  cooldown_hours: number;
  max_attempts_30_days: number;
};

type AttemptRow = {
  id: string;
  user_id: string;
  check_id: string;
  check_version: number;
  status: 'in_progress' | 'submitted' | 'expired' | 'voided';
  question_manifest: unknown;
  accommodation_code: SkillsAccommodationCode;
  accommodation_seconds: number;
  check_title_fr: string;
  check_title_en: string;
  skill_area: string;
  duration_seconds: number;
  questions_per_attempt: number;
  passing_score: number;
  cooldown_hours: number;
  max_attempts_30_days: number;
  started_at: Date | string;
  expires_at: Date | string;
  submitted_at: Date | string | null;
  score: number | null;
  passed: boolean | null;
  integrity_review_status: IntegrityReviewStatus;
  integrity_signal_count: number;
};

type QuestionRow = {
  id: string;
  prompt_fr: string;
  prompt_en: string;
  options_fr: unknown;
  options_en: unknown;
  correct_index?: number;
};

type AttestationRow = {
  id: string;
  attempt_id: string;
  user_id: string;
  check_id: string;
  check_version: number;
  score: number;
  verification_code: string;
  is_public: boolean;
  issued_at: Date | string;
  revoked_at: Date | string | null;
  title_fr: string;
  title_en: string;
  integrity_review_status: IntegrityReviewStatus;
};

const manifestSchema = z.array(z.object({
  questionId: z.string().min(1).max(200),
  optionOrder: z.array(z.number().int().min(0).max(5)).min(3).max(6),
}).strict()).min(1).max(30);

const optionsSchema = z.array(z.string().min(1).max(1000)).min(3).max(6);

const attemptColumns = `
  id, user_id, check_id, check_version, status, question_manifest,
  accommodation_code, accommodation_seconds, check_title_fr, check_title_en,
  skill_area, duration_seconds, questions_per_attempt, passing_score,
  cooldown_hours, max_attempts_30_days, started_at, expires_at, submitted_at,
  score, passed, integrity_review_status, integrity_signal_count
`;

function localizedTitle(
  row: Pick<CheckRow, 'title_fr' | 'title_en'>
    | Pick<AttestationRow, 'title_fr' | 'title_en'>
    | Pick<AttemptRow, 'check_title_fr' | 'check_title_en'>,
  locale: Locale,
) {
  if ('check_title_fr' in row) {
    return locale === 'en' ? row.check_title_en : row.check_title_fr;
  }
  return locale === 'en' ? row.title_en : row.title_fr;
}

function localizedDescription(row: CheckRow, locale: Locale) {
  return locale === 'en' ? row.description_en : row.description_fr;
}

function serializeAttestation(
  row: AttestationRow,
  locale: Locale,
): SkillsAttestationSummary {
  return {
    id: row.id,
    checkId: row.check_id,
    title: localizedTitle(row, locale),
    score: row.score,
    issuedAt: new Date(row.issued_at).toISOString(),
    verificationCode: row.verification_code,
    isPublic: row.is_public,
    reviewStatus: row.integrity_review_status,
    ...(row.revoked_at ? { revokedAt: new Date(row.revoked_at).toISOString() } : {}),
  };
}

async function databaseNow(client: Pick<PoolClient, 'query'>) {
  const result = await client.query<{ now: Date | string }>('SELECT now() AS now');
  return new Date(result.rows[0].now);
}

async function checkById(
  client: Pick<PoolClient, 'query'>,
  checkId: string,
  lock = false,
  publishedOnly = false,
) {
  const result = await client.query<CheckRow>(`
    SELECT c.id, c.skill_area, v.title_fr, v.title_en,
      v.description_fr, v.description_en, v.version, v.duration_seconds,
      v.questions_per_attempt, v.passing_score, v.cooldown_hours,
      v.max_attempts_30_days
    FROM skills_checks c
    JOIN skills_check_versions v
      ON v.check_id = c.id AND v.version = c.current_version
    WHERE c.id = $1
      AND (
        $2::boolean = false
        OR (c.status = 'published' AND v.lifecycle_status = 'published')
      )
    ${lock ? 'FOR SHARE OF c, v' : ''}
  `, [checkId, publishedOnly]);
  if (!result.rows[0]) {
    throw new ApiError(404, 'skills_check_not_found', 'This skills check is not available.');
  }
  return result.rows[0];
}

async function attemptById(
  client: Pick<PoolClient, 'query'>,
  attemptId: string,
  userId: string,
  lock = false,
) {
  const result = await client.query<AttemptRow>(`
    SELECT ${attemptColumns}
    FROM skills_check_attempts
    WHERE id = $1 AND user_id = $2
    ${lock ? 'FOR UPDATE' : ''}
  `, [attemptId, userId]);
  if (!result.rows[0]) {
    throw new ApiError(404, 'skills_attempt_not_found', 'This skills check attempt was not found.');
  }
  return result.rows[0];
}

async function serializeAttempt(
  client: Pick<PoolClient, 'query'>,
  attempt: AttemptRow,
  locale: Locale,
): Promise<SkillsAttemptView> {
  const manifest = manifestSchema.parse(attempt.question_manifest);
  let questions: SkillsAttemptView['questions'] = [];

  if (attempt.status === 'in_progress') {
    const ids = manifest.map((entry) => entry.questionId);
    const questionResult = await client.query<QuestionRow>(`
      SELECT id, prompt_fr, prompt_en, options_fr, options_en
      FROM skills_check_questions
      WHERE check_id = $1
        AND check_version = $2
        AND id = ANY($3::text[])
    `, [attempt.check_id, attempt.check_version, ids]);
    const byId = new Map(questionResult.rows.map((question) => [question.id, question]));

    questions = manifest.map((entry) => {
      const question = byId.get(entry.questionId);
      if (!question) {
        throw new ApiError(409, 'skills_attempt_invalid', 'This attempt can no longer be completed.');
      }
      const options = optionsSchema.parse(
        locale === 'en' ? question.options_en : question.options_fr,
      );
      if (
        entry.optionOrder.length !== options.length
        || new Set(entry.optionOrder).size !== options.length
        || entry.optionOrder.some((index) => index >= options.length)
      ) {
        throw new ApiError(409, 'skills_attempt_invalid', 'This attempt can no longer be completed.');
      }
      return {
        id: question.id,
        prompt: locale === 'en' ? question.prompt_en : question.prompt_fr,
        options: entry.optionOrder.map((optionIndex) => options[optionIndex]),
      };
    });
  }

  return {
    id: attempt.id,
    checkId: attempt.check_id,
    checkTitle: localizedTitle(attempt, locale),
    status: attempt.status,
    startedAt: new Date(attempt.started_at).toISOString(),
    expiresAt: new Date(attempt.expires_at).toISOString(),
    serverNow: (await databaseNow(client)).toISOString(),
    accommodationCode: attempt.accommodation_code,
    accommodationSeconds: attempt.accommodation_seconds,
    passingScore: attempt.passing_score,
    cooldownHours: attempt.cooldown_hours,
    questions,
    integritySignalCount: attempt.integrity_signal_count,
    integrityReviewStatus: attempt.integrity_review_status,
    ...(attempt.score !== null ? { score: attempt.score } : {}),
    ...(attempt.passed !== null ? { passed: attempt.passed } : {}),
  };
}

export async function listSkillsChecks(
  userId: string,
  locale: Locale = 'fr',
): Promise<SkillsCheckSummary[]> {
  await query('SELECT purge_expired_skills_integrity_signals()');
  await query(`
    UPDATE skills_check_attempts
    SET status = 'expired'
    WHERE user_id = $1
      AND status = 'in_progress'
      AND expires_at <= now()
  `, [userId]);

  const [checksResult, attemptsResult, attestationsResult, nowResult] = await Promise.all([
    query<CheckRow>(`
      SELECT c.id, c.skill_area, v.title_fr, v.title_en,
        v.description_fr, v.description_en, v.version, v.duration_seconds,
        v.questions_per_attempt, v.passing_score, v.cooldown_hours,
        v.max_attempts_30_days
      FROM skills_checks c
      JOIN skills_check_versions v
        ON v.check_id = c.id AND v.version = c.current_version
      WHERE c.status = 'published' AND v.lifecycle_status = 'published'
      ORDER BY
        CASE c.skill_area
          WHEN 'customer_experience' THEN 1
          WHEN 'data' THEN 2
          WHEN 'operations' THEN 3
          ELSE 4
        END,
        v.title_fr
    `),
    query<AttemptRow>(`
      SELECT ${attemptColumns}
      FROM skills_check_attempts
      WHERE user_id = $1
        AND started_at >= now() - interval '30 days'
        AND status <> 'voided'
      ORDER BY started_at DESC
    `, [userId]),
    query<AttestationRow>(`
      SELECT a.id, a.attempt_id, a.user_id, a.check_id, a.check_version,
        a.score, a.verification_code, a.is_public, a.issued_at, a.revoked_at,
        a.check_title_fr AS title_fr, a.check_title_en AS title_en,
        attempt.integrity_review_status
      FROM skills_attestations a
      JOIN skills_check_attempts attempt ON attempt.id = a.attempt_id
      WHERE a.user_id = $1
      ORDER BY a.issued_at DESC
    `, [userId]),
    query<{ now: Date | string }>('SELECT now() AS now'),
  ]);
  const now = new Date(nowResult.rows[0].now);

  const attemptsByCheck = new Map<string, AttemptRow[]>();
  for (const attempt of attemptsResult.rows) {
    const existing = attemptsByCheck.get(attempt.check_id) ?? [];
    existing.push(attempt);
    attemptsByCheck.set(attempt.check_id, existing);
  }
  const attestationByCheck = new Map<string, AttestationRow>();
  for (const attestation of attestationsResult.rows) {
    if (!attestationByCheck.has(attestation.check_id) && !attestation.revoked_at) {
      attestationByCheck.set(attestation.check_id, attestation);
    }
  }

  return checksResult.rows.map((check) => {
    const attempts = attemptsByCheck.get(check.id) ?? [];
    const latest = attempts[0];
    const active = attempts.find((attempt) => attempt.status === 'in_progress');
    const latestCompleted = attempts.find((attempt) =>
      attempt.status === 'submitted' || attempt.status === 'expired');
    const nextAvailableAt = latestCompleted
      ? new Date(
        new Date(latestCompleted.submitted_at ?? latestCompleted.expires_at).getTime()
        + latestCompleted.cooldown_hours * 60 * 60 * 1000,
      )
      : null;
    const attestation = attestationByCheck.get(check.id);

    return {
      id: check.id,
      title: localizedTitle(check, locale),
      description: localizedDescription(check, locale),
      skillArea: check.skill_area,
      version: check.version,
      durationSeconds: check.duration_seconds,
      questionsPerAttempt: check.questions_per_attempt,
      passingScore: check.passing_score,
      cooldownHours: check.cooldown_hours,
      maxAttempts30Days: check.max_attempts_30_days,
      attemptsUsed30Days: attempts.length,
      ...(active ? { activeAttemptId: active.id } : {}),
      ...(nextAvailableAt && nextAvailableAt > now
        ? { nextAvailableAt: nextAvailableAt.toISOString() }
        : {}),
      ...(latest?.score !== null && latest?.score !== undefined
        ? { latestScore: latest.score, latestPassed: Boolean(latest.passed) }
        : {}),
      ...(attestation ? { attestation: serializeAttestation(attestation, locale) } : {}),
    };
  });
}

export async function startSkillsAttempt(input: {
  request: Request;
  userId: string;
  checkId: string;
  accommodationCode: SkillsAccommodationCode;
  locale?: Locale;
}) {
  return transaction(async (client) => {
    const owner = await client.query(`
      SELECT id FROM users
      WHERE id = $1 AND deleted_at IS NULL
      FOR UPDATE
    `, [input.userId]);
    if (!owner.rows[0]) {
      throw new ApiError(404, 'skills_owner_not_found', 'The graduate account was not found.');
    }

    const check = await checkById(client, input.checkId, true, true);
    await client.query(`
      UPDATE skills_check_attempts
      SET status = 'expired'
      WHERE user_id = $1
        AND check_id = $2
        AND status = 'in_progress'
        AND expires_at <= now()
    `, [input.userId, check.id]);

    const active = await client.query<AttemptRow>(`
      SELECT ${attemptColumns}
      FROM skills_check_attempts
      WHERE user_id = $1 AND check_id = $2 AND status = 'in_progress'
      LIMIT 1
      FOR UPDATE
    `, [input.userId, check.id]);
    if (active.rows[0]) {
      return serializeAttempt(client, active.rows[0], input.locale ?? 'fr');
    }

    const recent = await client.query<{
      attempts: string;
      next_allowed_at: Date | string | null;
      cooldown_active: boolean;
    }>(`
      SELECT
        count(*) FILTER (
          WHERE started_at >= now() - interval '30 days' AND status <> 'voided'
        )::text AS attempts,
        max(
          COALESCE(submitted_at, expires_at)
          + cooldown_hours * interval '1 hour'
        ) FILTER (WHERE status IN ('submitted', 'expired')) AS next_allowed_at,
        COALESCE(
          max(
            COALESCE(submitted_at, expires_at)
            + cooldown_hours * interval '1 hour'
          ) FILTER (WHERE status IN ('submitted', 'expired')) > now(),
          false
        ) AS cooldown_active
      FROM skills_check_attempts
      WHERE user_id = $1 AND check_id = $2
    `, [input.userId, check.id]);
    const attempts = Number(recent.rows[0]?.attempts ?? 0);
    if (attempts >= check.max_attempts_30_days) {
      throw new ApiError(
        429,
        'skills_attempt_limit',
        `You can start up to ${check.max_attempts_30_days} attempts in 30 days.`,
      );
    }
    if (recent.rows[0]?.cooldown_active) {
      throw new ApiError(
        429,
        'skills_attempt_cooldown',
        `A ${check.cooldown_hours}-hour preparation period applies between attempts.`,
      );
    }

    const questionResult = await client.query<{
      id: string;
      option_count: number;
    }>(`
      SELECT id, jsonb_array_length(options_fr)::integer AS option_count
      FROM skills_check_questions
      WHERE check_id = $1
        AND check_version = $2
        AND is_active = true
      ORDER BY id
    `, [check.id, check.version]);
    if (questionResult.rows.length < check.questions_per_attempt) {
      throw new ApiError(503, 'skills_question_pool_incomplete', 'This skills check is being prepared.');
    }

    const manifest = createRandomizedManifest(
      questionResult.rows.map((question) => ({
        id: question.id,
        optionCount: question.option_count,
      })),
      check.questions_per_attempt,
      randomInt,
    );
    const extraSeconds = accommodationSeconds(
      check.duration_seconds,
      input.accommodationCode,
    );
    const attemptId = randomUUID();
    const inserted = await client.query<AttemptRow>(`
      INSERT INTO skills_check_attempts (
        id, user_id, check_id, check_version, question_manifest,
        accommodation_code, accommodation_seconds, conditions_version,
        conditions_accepted_at, privacy_notice_version, started_at, expires_at
      ) VALUES (
        $1, $2, $3, $4, $5::jsonb, $6, $7, $8, now(), $9,
        now(), now() + ($10 * interval '1 second')
      )
      RETURNING ${attemptColumns}
    `, [
      attemptId,
      input.userId,
      check.id,
      check.version,
      JSON.stringify(manifest),
      input.accommodationCode,
      extraSeconds,
      SKILLS_CONDITIONS_VERSION,
      SKILLS_PRIVACY_NOTICE_VERSION,
      check.duration_seconds + extraSeconds,
    ]);
    await writeAuditLog(
      client,
      input.request,
      input.userId,
      'skills_attempt.start',
      'skills_check_attempt',
      attemptId,
      {
        checkId: check.id,
        checkVersion: check.version,
        accommodationCode: input.accommodationCode,
        conditionsVersion: SKILLS_CONDITIONS_VERSION,
        privacyNoticeVersion: SKILLS_PRIVACY_NOTICE_VERSION,
      },
    );
    return serializeAttempt(client, inserted.rows[0], input.locale ?? 'fr');
  });
}

export async function getSkillsAttempt(
  attemptId: string,
  userId: string,
  locale: Locale = 'fr',
) {
  return transaction(async (client) => {
    let attempt = await attemptById(client, attemptId, userId, true);
    if (attempt.status === 'in_progress') {
      const expired = await client.query<AttemptRow>(`
        UPDATE skills_check_attempts
        SET status = 'expired'
        WHERE id = $1 AND status = 'in_progress' AND expires_at <= now()
        RETURNING ${attemptColumns}
      `, [attempt.id]);
      attempt = expired.rows[0] ?? attempt;
    }
    return serializeAttempt(client, attempt, locale);
  });
}

export async function recordSkillsIntegritySignal(input: {
  request: Request;
  attemptId: string;
  userId: string;
  kind: 'visibility_hidden' | 'focus_lost';
  clientElapsedMs?: number;
}) {
  const outcome = await transaction(async (client) => {
    const attempt = await attemptById(client, input.attemptId, input.userId, true);
    if (attempt.status !== 'in_progress') return { closed: true as const };

    const expired = await client.query(`
      UPDATE skills_check_attempts
      SET status = 'expired'
      WHERE id = $1 AND status = 'in_progress' AND expires_at <= now()
      RETURNING id
    `, [attempt.id]);
    if (expired.rows[0]) {
      await writeAuditLog(
        client,
        input.request,
        input.userId,
        'skills_attempt.expire',
        'skills_check_attempt',
        attempt.id,
      );
      return { closed: true as const };
    }
    if (attempt.integrity_signal_count >= 100) {
      return {
        accepted: true as const,
        signalCount: attempt.integrity_signal_count,
        reviewStatus: attempt.integrity_review_status,
      };
    }

    await client.query(`
      INSERT INTO skills_check_integrity_signals (
        attempt_id, kind, client_elapsed_ms, metadata
      ) VALUES ($1, $2, $3, '{"meaning":"review_signal_only"}'::jsonb)
    `, [attempt.id, input.kind, input.clientElapsedMs ?? null]);
    const updated = await client.query<{
      integrity_signal_count: number;
      integrity_review_status: IntegrityReviewStatus;
    }>(`
      UPDATE skills_check_attempts
      SET
        integrity_signal_count = integrity_signal_count + 1,
        integrity_review_status = CASE
          WHEN integrity_signal_count + 1 >= 3 THEN 'review_suggested'
          ELSE integrity_review_status
        END
      WHERE id = $1
      RETURNING integrity_signal_count, integrity_review_status
    `, [attempt.id]);
    return {
      accepted: true as const,
      signalCount: updated.rows[0].integrity_signal_count,
      reviewStatus: updated.rows[0].integrity_review_status,
    };
  });
  if ('closed' in outcome) {
    throw new ApiError(409, 'skills_attempt_closed', 'This attempt is no longer active.');
  }
  return outcome;
}

export async function submitSkillsAttempt(input: {
  request: Request;
  attemptId: string;
  userId: string;
  answers: Array<{ questionId: string; optionIndex: number }>;
  locale?: Locale;
}) {
  const outcome = await transaction(async (client) => {
    const attempt = await attemptById(client, input.attemptId, input.userId, true);
    if (attempt.status !== 'in_progress') {
      return { error: 'closed' as const };
    }
    const expired = await client.query(`
      UPDATE skills_check_attempts
      SET status = 'expired'
      WHERE id = $1 AND status = 'in_progress' AND expires_at <= now()
      RETURNING id
    `, [attempt.id]);
    if (expired.rows[0]) {
      await writeAuditLog(
        client,
        input.request,
        input.userId,
        'skills_attempt.expire',
        'skills_check_attempt',
        attempt.id,
      );
      return { error: 'expired' as const };
    }

    const manifest = manifestSchema.parse(attempt.question_manifest);
    const answersByQuestion = new Map<string, number>();
    for (const answer of input.answers) {
      if (answersByQuestion.has(answer.questionId)) {
        throw new ApiError(422, 'skills_duplicate_answer', 'Each question can be answered only once.');
      }
      answersByQuestion.set(answer.questionId, answer.optionIndex);
    }
    if (
      answersByQuestion.size !== manifest.length
      || manifest.some((entry) => !answersByQuestion.has(entry.questionId))
    ) {
      throw new ApiError(422, 'skills_incomplete_answers', 'Answer every question before submitting.');
    }

    const questionResult = await client.query<QuestionRow>(`
      SELECT q.id, q.prompt_fr, q.prompt_en, q.options_fr, q.options_en,
        key.correct_index
      FROM skills_check_questions q
      JOIN skills_check_answer_keys key
        ON key.check_id = q.check_id
       AND key.check_version = q.check_version
       AND key.question_id = q.id
      WHERE q.check_id = $1
        AND q.check_version = $2
        AND q.id = ANY($3::text[])
    `, [
      attempt.check_id,
      attempt.check_version,
      manifest.map((entry) => entry.questionId),
    ]);
    const byId = new Map(questionResult.rows.map((question) => [question.id, question]));
    let correct = 0;
    for (const entry of manifest) {
      const question = byId.get(entry.questionId);
      const displayedIndex = answersByQuestion.get(entry.questionId);
      if (!question || displayedIndex === undefined || question.correct_index === undefined) {
        throw new ApiError(409, 'skills_attempt_invalid', 'This attempt can no longer be graded.');
      }
      const optionCount = optionsSchema.parse(question.options_fr).length;
      if (
        entry.optionOrder.length !== optionCount
        || new Set(entry.optionOrder).size !== optionCount
        || entry.optionOrder.some((index) => index >= optionCount)
      ) {
        throw new ApiError(409, 'skills_attempt_invalid', 'This attempt can no longer be graded.');
      }
      if (displayedIndex < 0 || displayedIndex >= optionCount) {
        throw new ApiError(422, 'skills_invalid_answer', 'One selected answer is not available.');
      }
      if (entry.optionOrder[displayedIndex] === question.correct_index) correct += 1;
    }

    const score = Math.round((correct / manifest.length) * 100);
    const passed = score >= attempt.passing_score;
    const submitted = await client.query<AttemptRow>(`
      UPDATE skills_check_attempts
      SET status = 'submitted', submitted_at = now(), score = $2, passed = $3
      WHERE id = $1 AND status = 'in_progress' AND expires_at > now()
      RETURNING ${attemptColumns}
    `, [attempt.id, score, passed]);
    if (!submitted.rows[0]) {
      await client.query(`
        UPDATE skills_check_attempts
        SET status = 'expired'
        WHERE id = $1 AND status = 'in_progress'
      `, [attempt.id]);
      await writeAuditLog(
        client,
        input.request,
        input.userId,
        'skills_attempt.expire',
        'skills_check_attempt',
        attempt.id,
      );
      return { error: 'expired' as const };
    }

    let attestation: SkillsAttestationSummary | undefined;
    if (passed) {
      const superseded = await client.query<{ id: string }>(`
        UPDATE skills_attestations
        SET
          is_public = false,
          revoked_at = now(),
          revocation_reason = 'Superseded by a newer passed Yahnu Skills Check'
        WHERE user_id = $1
          AND check_id = $2
          AND revoked_at IS NULL
        RETURNING id
      `, [input.userId, attempt.check_id]);
      const issued = await client.query<AttestationRow>(`
        INSERT INTO skills_attestations (
          id, attempt_id, user_id, check_id, check_version, score, verification_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, attempt_id, user_id, check_id, check_version, score,
          verification_code, is_public, issued_at, revoked_at,
          check_title_fr AS title_fr, check_title_en AS title_en,
          $8::text AS integrity_review_status
      `, [
        randomUUID(),
        attempt.id,
        input.userId,
        attempt.check_id,
        attempt.check_version,
        score,
        randomBytes(24).toString('base64url'),
        submitted.rows[0].integrity_review_status,
      ]);
      attestation = serializeAttestation(issued.rows[0], input.locale ?? 'fr');
      await writeAuditLog(
        client,
        input.request,
        input.userId,
        'skills_attestation.issue',
        'skills_attestation',
        attestation.id,
        {
          attemptId: attempt.id,
          checkId: attempt.check_id,
          checkVersion: attempt.check_version,
          supersededAttestationId: superseded.rows[0]?.id,
        },
      );
    }
    await writeAuditLog(
      client,
      input.request,
      input.userId,
      'skills_attempt.submit',
      'skills_check_attempt',
      attempt.id,
      {
        checkId: attempt.check_id,
        score,
        passed,
        integrityReviewStatus: submitted.rows[0].integrity_review_status,
      },
    );
    return {
      attempt: await serializeAttempt(client, submitted.rows[0], input.locale ?? 'fr'),
      ...(attestation ? { attestation } : {}),
    };
  });

  if ('error' in outcome) {
    if (outcome.error === 'expired') {
      throw new ApiError(409, 'skills_attempt_expired', 'The server time limit has ended this attempt.');
    }
    throw new ApiError(409, 'skills_attempt_closed', 'This attempt has already been closed.');
  }
  return outcome;
}

export async function listSkillsAttestations(
  userId: string,
  locale: Locale = 'fr',
) {
  const result = await query<AttestationRow>(`
    SELECT a.id, a.attempt_id, a.user_id, a.check_id, a.check_version,
      a.score, a.verification_code, a.is_public, a.issued_at, a.revoked_at,
      a.check_title_fr AS title_fr, a.check_title_en AS title_en,
      attempt.integrity_review_status
    FROM skills_attestations a
    JOIN skills_check_attempts attempt ON attempt.id = a.attempt_id
    WHERE a.user_id = $1
    ORDER BY a.issued_at DESC
  `, [userId]);
  return result.rows.map((row) => serializeAttestation(row, locale));
}

export async function updateSkillsAttestation(input: {
  request: Request;
  attestationId: string;
  userId: string;
  action: 'publish' | 'hide' | 'revoke';
  consent?: boolean;
}) {
  return transaction(async (client) => {
    const selected = await client.query<AttestationRow>(`
      SELECT a.id, a.attempt_id, a.user_id, a.check_id, a.check_version,
        a.score, a.verification_code, a.is_public, a.issued_at, a.revoked_at,
        a.check_title_fr AS title_fr, a.check_title_en AS title_en,
        attempt.integrity_review_status
      FROM skills_attestations a
      JOIN skills_check_attempts attempt ON attempt.id = a.attempt_id
      WHERE a.id = $1 AND a.user_id = $2
      FOR UPDATE OF a
    `, [input.attestationId, input.userId]);
    const current = selected.rows[0];
    if (!current) {
      throw new ApiError(404, 'skills_attestation_not_found', 'This skills attestation was not found.');
    }
    if (current.revoked_at) {
      throw new ApiError(409, 'skills_attestation_revoked', 'A revoked skills attestation cannot be changed.');
    }
    if (input.action === 'publish' && input.consent !== true) {
      throw new ApiError(
        422,
        'skills_public_consent_required',
        'Explicit consent is required before a skills attestation can be public.',
      );
    }
    if (
      input.action === 'publish'
      && !['clear', 'reviewed_clear'].includes(current.integrity_review_status)
    ) {
      throw new ApiError(
        409,
        'skills_review_pending',
        'This attestation remains private until the human integrity review is complete.',
      );
    }

    const updated = await client.query<AttestationRow>(`
      UPDATE skills_attestations
      SET
        is_public = CASE WHEN $3 = 'publish' THEN true ELSE false END,
        public_consent_at = CASE
          WHEN $3 = 'publish' THEN COALESCE(public_consent_at, now())
          ELSE public_consent_at
        END,
        public_consent_version = CASE
          WHEN $3 = 'publish' THEN $4
          ELSE public_consent_version
        END,
        revoked_at = CASE WHEN $3 = 'revoke' THEN now() ELSE revoked_at END,
        revocation_reason = CASE
          WHEN $3 = 'revoke' THEN 'Revoked by the graduate account owner'
          ELSE revocation_reason
        END
      WHERE id = $1 AND user_id = $2
      RETURNING id, attempt_id, user_id, check_id, check_version, score,
        verification_code, is_public, issued_at, revoked_at,
        check_title_fr AS title_fr, check_title_en AS title_en,
        $5::text AS integrity_review_status
    `, [
      input.attestationId,
      input.userId,
      input.action,
      SKILLS_PUBLIC_CONSENT_VERSION,
      current.integrity_review_status,
    ]);
    await writeAuditLog(
      client,
      input.request,
      input.userId,
      `skills_attestation.${input.action}`,
      'skills_attestation',
      current.id,
      {
        checkId: current.check_id,
        ...(input.action === 'publish'
          ? { consentVersion: SKILLS_PUBLIC_CONSENT_VERSION }
          : {}),
      },
    );
    return serializeAttestation(updated.rows[0], 'fr');
  });
}

export type PublicSkillsAttestation =
  | {
    verificationCode: string;
    status: 'revoked';
    revokedAt: string;
  }
  | {
    verificationCode: string;
    holderName: string;
    checkTitle: string;
    skillArea: string;
    checkVersion: number;
    score: number;
    durationSeconds: number;
    questionCount: number;
    issuedAt: string;
    status: 'active';
    methodology: 'randomized_server_graded_timed';
  };

export async function publicSkillsAttestation(
  verificationCode: string,
  locale: Locale = 'fr',
): Promise<PublicSkillsAttestation | null> {
  if (!/^[A-Za-z0-9_-]{32,64}$/.test(verificationCode)) return null;
  const result = await query<{
    verification_code: string;
    holder_name: string;
    title_fr: string;
    title_en: string;
    skill_area: string;
    score: number;
    check_version: number;
    duration_seconds: number;
    question_count: number;
    issued_at: Date | string;
    revoked_at: Date | string | null;
    integrity_review_status: IntegrityReviewStatus;
  }>(`
    SELECT a.verification_code, a.holder_name,
      a.check_title_fr AS title_fr, a.check_title_en AS title_en,
      a.skill_area, a.check_version, a.score, a.duration_seconds,
      a.question_count, a.issued_at, a.revoked_at,
      attempt.integrity_review_status
    FROM skills_attestations a
    JOIN skills_check_attempts attempt ON attempt.id = a.attempt_id
    WHERE a.verification_code = $1
      AND a.public_consent_at IS NOT NULL
      AND (
        a.revoked_at IS NOT NULL
        OR (
          a.is_public = true
          AND attempt.integrity_review_status IN ('clear', 'reviewed_clear')
        )
      )
  `, [verificationCode]);
  const row = result.rows[0];
  if (!row) return null;
  if (row.revoked_at) {
    return {
      verificationCode: row.verification_code,
      status: 'revoked',
      revokedAt: new Date(row.revoked_at).toISOString(),
    };
  }
  return {
    verificationCode: row.verification_code,
    holderName: row.holder_name,
    checkTitle: locale === 'en' ? row.title_en : row.title_fr,
    skillArea: row.skill_area,
    checkVersion: row.check_version,
    score: row.score,
    durationSeconds: row.duration_seconds,
    questionCount: row.question_count,
    issuedAt: new Date(row.issued_at).toISOString(),
    status: 'active',
    methodology: 'randomized_server_graded_timed',
  };
}

export async function reviewSkillsAttempt(input: {
  request: Request;
  actorUserId: string;
  attemptId: string;
  decision: 'reviewed_clear' | 'confirmed_concern';
  category?: 'focus_pattern' | 'external_evidence' | 'identity_mismatch' | 'other';
  note?: string;
}) {
  return transaction(async (client) => {
    const selected = await client.query<{
      id: string;
      integrity_review_status: IntegrityReviewStatus;
    }>(`
      SELECT id, integrity_review_status
      FROM skills_check_attempts
      WHERE id = $1 AND status = 'submitted'
      FOR UPDATE
    `, [input.attemptId]);
    if (!selected.rows[0]) {
      throw new ApiError(404, 'skills_attempt_not_found', 'This submitted attempt was not found.');
    }
    if (selected.rows[0].integrity_review_status !== 'review_suggested') {
      throw new ApiError(
        409,
        'skills_review_already_resolved',
        'Only a pending integrity review can receive a final decision.',
      );
    }
    if (
      input.decision === 'confirmed_concern'
      && (!input.category || !input.note)
    ) {
      throw new ApiError(
        422,
        'skills_review_evidence_required',
        'A concern category and review note are required.',
      );
    }

    await client.query(`
      UPDATE skills_check_attempts
      SET
        integrity_review_status = $2,
        integrity_reviewed_at = now(),
        integrity_reviewed_by = $3,
        integrity_review_category = $4,
        integrity_review_note = $5
      WHERE id = $1 AND integrity_review_status = 'review_suggested'
    `, [
      input.attemptId,
      input.decision,
      input.actorUserId,
      input.decision === 'confirmed_concern' ? input.category : null,
      input.note ?? null,
    ]);
    if (input.decision === 'confirmed_concern') {
      await client.query(`
        UPDATE skills_attestations
        SET
          is_public = false,
          revoked_at = now(),
          revocation_reason = 'Revoked after a documented human integrity review'
        WHERE attempt_id = $1 AND revoked_at IS NULL
      `, [input.attemptId]);
    }
    await writeAuditLog(
      client,
      input.request,
      input.actorUserId,
      'skills_attempt.integrity_review',
      'skills_check_attempt',
      input.attemptId,
      {
        decision: input.decision,
        category: input.category ?? null,
        previousStatus: selected.rows[0].integrity_review_status,
        noteProvided: Boolean(input.note),
      },
    );
    return { reviewed: true, decision: input.decision };
  });
}

export async function listSkillsReviewQueue(limit = 50) {
  await query('SELECT purge_expired_skills_integrity_signals()');
  const result = await query<{
    id: string;
    user_id: string;
    graduate_name: string;
    check_id: string;
    check_title: string;
    score: number;
    integrity_signal_count: number;
    integrity_review_status: IntegrityReviewStatus;
    submitted_at: Date | string;
    signals: unknown;
  }>(`
    SELECT a.id, a.user_id, u.name AS graduate_name, a.check_id,
      a.check_title_fr AS check_title, a.score, a.integrity_signal_count,
      a.integrity_review_status, a.submitted_at,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'kind', signal.kind,
            'clientElapsedMs', signal.client_elapsed_ms,
            'receivedAt', signal.received_at
          )
          ORDER BY signal.received_at
        ) FILTER (WHERE signal.id IS NOT NULL),
        '[]'::jsonb
      ) AS signals
    FROM skills_check_attempts a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN skills_check_integrity_signals signal ON signal.attempt_id = a.id
    WHERE a.status = 'submitted'
      AND a.integrity_review_status = 'review_suggested'
    GROUP BY a.id, u.name
    ORDER BY a.submitted_at DESC
    LIMIT $1
  `, [limit]);
  return result.rows.map((row) => ({
    id: row.id,
    graduateId: row.user_id,
    graduateName: row.graduate_name,
    checkId: row.check_id,
    checkTitle: row.check_title,
    score: row.score,
    signalCount: row.integrity_signal_count,
    signals: z.array(z.object({
      kind: z.enum(['visibility_hidden', 'focus_lost']),
      clientElapsedMs: z.number().int().nullable(),
      receivedAt: z.coerce.date(),
    })).parse(row.signals).map((signal) => ({
      kind: signal.kind,
      clientElapsedMs: signal.clientElapsedMs,
      receivedAt: signal.receivedAt.toISOString(),
    })),
    reviewStatus: row.integrity_review_status,
    submittedAt: new Date(row.submitted_at).toISOString(),
  }));
}
