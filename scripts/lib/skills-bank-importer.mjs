import { createHash } from 'node:crypto'

import { z } from 'zod'

const identifierSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const localizedOptionsSchema = z
  .array(z.string().trim().min(1).max(1000))
  .min(3)
  .max(6)

const questionSchema = z
  .object({
    id: identifierSchema,
    promptFr: z.string().trim().min(10).max(2000),
    promptEn: z.string().trim().min(10).max(2000),
    optionsFr: localizedOptionsSchema,
    optionsEn: localizedOptionsSchema,
    correctIndex: z.number().int().min(0).max(5),
    active: z.boolean(),
  })
  .strict()
  .superRefine((question, context) => {
    if (question.optionsFr.length !== question.optionsEn.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Translated options must have the same length.',
      })
    }
    if (question.correctIndex >= question.optionsFr.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The answer index must identify an available option.',
      })
    }
  })

const checkSchema = z
  .object({
    checkId: identifierSchema,
    checkVersion: z.number().int().min(1).max(10_000),
    questions: z.array(questionSchema).min(1).max(1000),
  })
  .strict()
  .superRefine((check, context) => {
    const questionIds = new Set()
    for (const question of check.questions) {
      if (questionIds.has(question.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Question identifiers must be unique within a check version.',
        })
        return
      }
      questionIds.add(question.id)
    }
  })

const skillsBankSchema = z
  .object({
    schemaVersion: z.literal(1),
    bankId: identifierSchema,
    bankVersion: z.number().int().min(1).max(10_000),
    checks: z.array(checkSchema).min(1).max(100),
  })
  .strict()
  .superRefine((bank, context) => {
    const versions = new Set()
    for (const check of bank.checks) {
      const identity = `${check.checkId}@${check.checkVersion}`
      if (versions.has(identity)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Check versions must be unique within a bank release.',
        })
        return
      }
      versions.add(identity)
    }
  })

export class SkillsBankImportError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'SkillsBankImportError'
    this.code = code
  }
}

export function parseSkillsBank(raw) {
  let decoded
  try {
    decoded = JSON.parse(raw)
  } catch {
    throw new SkillsBankImportError(
      'invalid_json',
      'The skills bank secret is not valid JSON.',
    )
  }

  const parsed = skillsBankSchema.safeParse(decoded)
  if (!parsed.success) {
    throw new SkillsBankImportError(
      'invalid_schema',
      'The skills bank secret failed strict schema validation.',
    )
  }
  return parsed.data
}

export function skillsBankDigest(bank) {
  return createHash('sha256').update(JSON.stringify(bank)).digest('hex')
}

async function verifyExistingRelease(client, bank, digest, expectedQuestionCount) {
  const existing = await client.query(
    `SELECT content_digest, question_count
     FROM skills_bank_releases
     WHERE bank_id = $1 AND bank_version = $2
     FOR UPDATE`,
    [bank.bankId, bank.bankVersion],
  )
  if (!existing.rows[0]) return false
  if (
    existing.rows[0].content_digest !== digest
    || Number(existing.rows[0].question_count) !== expectedQuestionCount
  ) {
    throw new SkillsBankImportError(
      'immutable_release_conflict',
      'This skills bank identity already belongs to different content.',
    )
  }

  for (const check of bank.checks) {
    const verified = await client.query(
      `SELECT c.status, c.current_version, v.lifecycle_status, v.bank_digest,
          count(q.id)::integer AS question_count,
          count(k.question_id)::integer AS key_count
       FROM skills_checks c
       JOIN skills_check_versions v
         ON v.check_id = c.id AND v.version = $2
       LEFT JOIN skills_check_questions q
         ON q.check_id = v.check_id AND q.check_version = v.version
       LEFT JOIN skills_check_answer_keys k
         ON k.check_id = q.check_id
        AND k.check_version = q.check_version
        AND k.question_id = q.id
       WHERE c.id = $1
       GROUP BY c.status, c.current_version, v.lifecycle_status, v.bank_digest`,
      [check.checkId, check.checkVersion],
    )
    const row = verified.rows[0]
    if (
      !row
      || row.status !== 'published'
      || Number(row.current_version) !== check.checkVersion
      || row.lifecycle_status !== 'published'
      || row.bank_digest !== digest
      || Number(row.question_count) !== check.questions.length
      || Number(row.key_count) !== check.questions.length
    ) {
      throw new SkillsBankImportError(
        'release_verification_failed',
        'The existing skills bank release is incomplete or inconsistent.',
      )
    }
  }
  return true
}

export async function importSkillsBank(client, bank, digest = skillsBankDigest(bank)) {
  if (!/^[0-9a-f]{64}$/.test(digest)) {
    throw new SkillsBankImportError(
      'invalid_digest',
      'The skills bank digest is invalid.',
    )
  }

  const questionCount = bank.checks.reduce(
    (total, check) => total + check.questions.length,
    0,
  )
  if (await verifyExistingRelease(client, bank, digest, questionCount)) {
    return {
      imported: false,
      bankId: bank.bankId,
      bankVersion: bank.bankVersion,
      digest,
      questionCount,
    }
  }

  for (const check of bank.checks) {
    const version = await client.query(
      `SELECT c.status, c.current_version, v.lifecycle_status,
          v.questions_per_attempt
       FROM skills_checks c
       JOIN skills_check_versions v
         ON v.check_id = c.id AND v.version = $2
       WHERE c.id = $1
       FOR UPDATE OF c, v`,
      [check.checkId, check.checkVersion],
    )
    const row = version.rows[0]
    if (!row) {
      throw new SkillsBankImportError(
        'unknown_check_version',
        'The skills bank references a check version that is not declared by a migration.',
      )
    }
    const existingContent = await client.query(
      `SELECT
         (SELECT count(*)::integer
          FROM skills_check_questions
          WHERE check_id = $1 AND check_version = $2) AS question_count,
         (SELECT count(*)::integer
          FROM skills_check_answer_keys
          WHERE check_id = $1 AND check_version = $2) AS key_count`,
      [check.checkId, check.checkVersion],
    )
    if (
      row.status !== 'draft'
      || row.lifecycle_status !== 'draft'
      || Number(row.current_version) !== check.checkVersion
      || Number(existingContent.rows[0]?.question_count) !== 0
      || Number(existingContent.rows[0]?.key_count) !== 0
    ) {
      throw new SkillsBankImportError(
        'check_version_not_empty_draft',
        'A skills bank can only publish an empty draft check version.',
      )
    }
    const activeQuestionCount = check.questions.filter((question) => question.active).length
    if (activeQuestionCount < Number(row.questions_per_attempt)) {
      throw new SkillsBankImportError(
        'insufficient_active_questions',
        'A skills bank does not contain enough active questions for its configured attempt size.',
      )
    }
  }

  await client.query(
    `INSERT INTO skills_bank_releases (
       bank_id, bank_version, content_digest, question_count
     ) VALUES ($1, $2, $3, $4)`,
    [bank.bankId, bank.bankVersion, digest, questionCount],
  )

  for (const check of bank.checks) {
    for (const question of check.questions) {
      await client.query(
        `INSERT INTO skills_check_questions (
           check_id, check_version, id, prompt_fr, prompt_en,
           options_fr, options_en, is_active
         ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)`,
        [
          check.checkId,
          check.checkVersion,
          question.id,
          question.promptFr,
          question.promptEn,
          JSON.stringify(question.optionsFr),
          JSON.stringify(question.optionsEn),
          question.active,
        ],
      )
      await client.query(
        `INSERT INTO skills_check_answer_keys (
           check_id, check_version, question_id, correct_index
         ) VALUES ($1, $2, $3, $4)`,
        [
          check.checkId,
          check.checkVersion,
          question.id,
          question.correctIndex,
        ],
      )
    }

    const publishedVersion = await client.query(
      `UPDATE skills_check_versions
       SET lifecycle_status = 'published',
         bank_id = $3,
         bank_version = $4,
         bank_digest = $5,
         published_at = now()
       WHERE check_id = $1
         AND version = $2
         AND lifecycle_status = 'draft'
       RETURNING check_id`,
      [
        check.checkId,
        check.checkVersion,
        bank.bankId,
        bank.bankVersion,
        digest,
      ],
    )
    if (publishedVersion.rows.length !== 1) {
      throw new SkillsBankImportError(
        'publish_race',
        'The skills check version changed while the bank was being imported.',
      )
    }

    const publishedCheck = await client.query(
      `UPDATE skills_checks
       SET status = 'published', current_version = $2
       WHERE id = $1
         AND status = 'draft'
         AND current_version = $2
       RETURNING id`,
      [check.checkId, check.checkVersion],
    )
    if (publishedCheck.rows.length !== 1) {
      throw new SkillsBankImportError(
        'publish_race',
        'The skills check changed while the bank was being imported.',
      )
    }
  }

  return {
    imported: true,
    bankId: bank.bankId,
    bankVersion: bank.bankVersion,
    digest,
    questionCount,
  }
}
