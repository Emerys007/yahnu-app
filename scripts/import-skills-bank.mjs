import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

import pg from 'pg'

import {
  importSkillsBank,
  parseSkillsBank,
  SkillsBankImportError,
  skillsBankDigest,
} from './lib/skills-bank-importer.mjs'
import { directDatabaseConfig } from '../src/lib/server/database-config.mjs'

const DEFAULT_SECRET_PATH = '/etc/secrets/yahnu-skills-bank.v1.json'
const MAX_SECRET_BYTES = 1024 * 1024
const IMPORT_LOCK_ID = 78_342_110

async function readProtectedBank() {
  const configuredPath = process.env.YAHNU_SKILLS_BANK_PATH?.trim()
    || DEFAULT_SECRET_PATH
  if (!path.isAbsolute(configuredPath)) {
    throw new SkillsBankImportError(
      'relative_secret_path',
      'YAHNU_SKILLS_BANK_PATH must be an absolute path.',
    )
  }

  let metadata
  try {
    metadata = await stat(configuredPath)
  } catch {
    throw new SkillsBankImportError(
      'missing_secret_file',
      'The Render skills bank Secret File is missing.',
    )
  }
  if (!metadata.isFile() || metadata.size < 2 || metadata.size > MAX_SECRET_BYTES) {
    throw new SkillsBankImportError(
      'invalid_secret_file',
      'The Render skills bank Secret File has an invalid size or type.',
    )
  }

  try {
    return parseSkillsBank(await readFile(configuredPath, 'utf8'))
  } catch (error) {
    if (error instanceof SkillsBankImportError) throw error
    throw new SkillsBankImportError(
      'unreadable_secret_file',
      'The Render skills bank Secret File could not be read.',
    )
  }
}

let pool
let client
let transactionOpen = false
try {
  const bank = await readProtectedBank()
  const digest = skillsBankDigest(bank)
  pool = new pg.Pool({ ...directDatabaseConfig(), max: 1 })
  client = await pool.connect()
  await client.query('BEGIN')
  transactionOpen = true
  await client.query('SELECT pg_advisory_xact_lock($1)', [IMPORT_LOCK_ID])
  const result = await importSkillsBank(client, bank, digest)
  await client.query('COMMIT')
  transactionOpen = false
  process.stdout.write(
    `${result.imported ? 'Imported' : 'Verified'} protected skills bank `
      + `${result.bankId}@${result.bankVersion} `
      + `(${result.questionCount} questions; sha256=${result.digest}).\n`,
  )
} catch (error) {
  if (transactionOpen && client) {
    await client.query('ROLLBACK').catch(() => undefined)
  }
  const message = error instanceof SkillsBankImportError
    ? error.message
    : 'Skills bank deployment failed; no changes were committed.'
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
} finally {
  client?.release()
  await pool?.end().catch(() => undefined)
}
