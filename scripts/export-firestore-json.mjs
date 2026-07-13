import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const COLLECTIONS = ['users', 'invites', 'tickets', 'pages', 'dashboards']
const PAGE_SIZE = 300
const MAX_DOCUMENTS_PER_COLLECTION = 250_000

function printHelp() {
  process.stdout.write(`Export Yahnu's Firestore collections as importer-compatible JSON.

Usage:
  npm run firebase:export:firestore -- --project <id> --output C:\\secure\\yahnu-firestore.json

Options:
  --project <id>    Firebase / Google Cloud project ID (or FIREBASE_PROJECT_ID)
  --database <id>   Firestore database ID; defaults to (default)
  --output <path>   Absolute output path outside this repository (required)
  --help            Show this help

Authentication:
  Set GOOGLE_ACCESS_TOKEN to a short-lived OAuth access token with permission to read
  Firestore. The token is sent only to firestore.googleapis.com and is never written.
`)
}

function parseArguments(argv) {
  const result = { project: process.env.FIREBASE_PROJECT_ID, database: process.env.FIRESTORE_DATABASE_ID ?? '(default)', output: undefined, help: false }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help') {
      result.help = true
      continue
    }

    const option = ['project', 'database', 'output'].find((name) => argument === `--${name}` || argument.startsWith(`--${name}=`))
    if (!option) throw new Error(`Unknown option: ${argument}`)
    const value = argument === `--${option}` ? argv[++index] : argument.slice(`--${option}=`.length)
    if (!value || value.startsWith('--')) throw new Error(`--${option} requires a value.`)
    result[option] = value
  }

  return result
}

function validateIdentifier(value, label) {
  if (typeof value !== 'string' || !value.trim() || value.length > 128 || /[\r\n/]/.test(value)) {
    throw new Error(`${label} is invalid.`)
  }
  return value.trim()
}

function isInsideDirectory(base, target) {
  const relative = path.relative(base, target)
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}

async function listCollection({ project, database, collection, token }) {
  const documents = []
  let pageToken

  do {
    const endpoint = new URL(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/${encodeURIComponent(database)}/documents/${encodeURIComponent(collection)}`)
    endpoint.searchParams.set('pageSize', String(PAGE_SIZE))
    if (pageToken) endpoint.searchParams.set('pageToken', pageToken)

    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      const providerMessage = typeof body?.error?.message === 'string' ? ` ${body.error.message.slice(0, 300)}` : ''
      throw new Error(`Firestore rejected the ${collection} export (${response.status}).${providerMessage}`)
    }

    const body = await response.json()
    if (Array.isArray(body.documents)) documents.push(...body.documents)
    if (documents.length > MAX_DOCUMENTS_PER_COLLECTION) {
      throw new Error(`${collection} exceeded the ${MAX_DOCUMENTS_PER_COLLECTION.toLocaleString()} document safety limit.`)
    }
    pageToken = typeof body.nextPageToken === 'string' && body.nextPageToken ? body.nextPageToken : undefined
  } while (pageToken)

  return documents
}

async function main() {
  const args = parseArguments(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const project = validateIdentifier(args.project, 'Firebase project ID')
  const database = validateIdentifier(args.database, 'Firestore database ID')
  const token = process.env.GOOGLE_ACCESS_TOKEN?.trim()
  if (!token || token.length < 20 || /\s/.test(token)) throw new Error('GOOGLE_ACCESS_TOKEN is required and must be a valid single-line OAuth token.')
  if (!args.output || !path.isAbsolute(args.output)) throw new Error('--output must be an absolute path.')

  const outputPath = path.resolve(args.output)
  if (isInsideDirectory(process.cwd(), outputPath)) {
    throw new Error('For credential safety, the export path must be outside this repository.')
  }

  const entries = await Promise.all(COLLECTIONS.map(async (collection) => [
    collection,
    await listCollection({ project, database, collection, token }),
  ]))
  const collections = Object.fromEntries(entries)
  const payload = {
    _metadata: {
      format: 'yahnu-firestore-rest-v1',
      project,
      database,
      exportedAt: new Date().toISOString(),
    },
    ...collections,
  }

  try {
    await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 })
  } catch (error) {
    if (error?.code === 'EEXIST') throw new Error('The output file already exists; choose a new path so an earlier export is not overwritten.')
    throw error
  }

  const counts = Object.fromEntries(COLLECTIONS.map((collection) => [collection, collections[collection].length]))
  process.stdout.write(`${JSON.stringify({ output: outputPath, counts }, null, 2)}\n`)
}

main().catch((error) => {
  process.stderr.write(`Firestore export failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
