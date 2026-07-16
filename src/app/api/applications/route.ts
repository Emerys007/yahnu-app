import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';

import { serializeApplication, type ApplicationRow } from '@/lib/careers-server';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { sourceHash } from '@/lib/server/source-hash';

const applicationRoles = new Set<'graduate' | 'company'>(['graduate', 'company']);
const MAX_RESUME_BYTES = 8 * 1024 * 1024;
const MAX_MULTIPART_APPLICATION_BYTES = MAX_RESUME_BYTES + (512 * 1024);
const pdfContentTypes = new Set(['application/pdf', 'application/x-pdf']);
const listSchema = z.object({
  jobId: z.string().trim().max(1_500).default(''),
  q: z.string().trim().max(120).default(''),
  status: z.string().trim().max(100).default('all'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
}).strict();
const createSchema = z.object({
  jobId: z.string().trim().min(1).max(1_500),
  coverLetter: z.string().trim().max(20_000).nullable().optional(),
  resumeAssetId: z.string().trim().min(1).max(200).nullable().optional(),
}).strict();

type CreateApplicationInput = z.infer<typeof createSchema>;
type ResumeUpload = {
  bytes: Buffer;
  originalFilename: string;
  sha256: string;
};

function cleanResumeFilename(filename: string) {
  const cleaned = filename
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/]+/g, ' ')
    .trim()
    .slice(0, 160);
  const safeName = cleaned || 'resume';
  return /\.pdf$/i.test(safeName) ? safeName : `${safeName}.pdf`;
}

function hasPdfSignature(bytes: Buffer) {
  return bytes.subarray(0, Math.min(bytes.length, 1_024)).toString('latin1').includes('%PDF-');
}

function multipartText(formData: FormData, name: string) {
  const value = formData.get(name);
  if (value === null) return undefined;
  if (typeof value !== 'string') throw new ApiError(422, 'invalid_application_form', `The ${name} field must be text.`);
  return value;
}

async function readApplicationCreateRequest(request: Request): Promise<{ input: CreateApplicationInput; resume: ResumeUpload | null }> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.startsWith('multipart/form-data;')) {
    return { input: createSchema.parse(await readJson(request, 32 * 1024)), resume: null };
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_MULTIPART_APPLICATION_BYTES) {
    throw new ApiError(413, 'resume_too_large', 'A resume must be 8 MB or smaller.');
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw new ApiError(400, 'invalid_multipart_body', 'The application form could not be read.');
  }

  const allowedFields = new Set(['jobId', 'coverLetter', 'resume']);
  const seenFields = new Set<string>();
  for (const [name] of formData.entries()) {
    if (!allowedFields.has(name) || seenFields.has(name)) {
      throw new ApiError(422, 'invalid_application_form', 'The application form contains unsupported fields.');
    }
    seenFields.add(name);
  }

  const input = createSchema.parse({
    jobId: multipartText(formData, 'jobId'),
    coverLetter: multipartText(formData, 'coverLetter') ?? null,
  });
  const resumeValue = formData.get('resume');
  if (resumeValue === null) return { input, resume: null };
  if (!(resumeValue instanceof File)) throw new ApiError(422, 'invalid_resume', 'Select a PDF resume to upload.');
  if (resumeValue.size <= 0) throw new ApiError(422, 'empty_resume', 'The selected resume is empty.');
  if (resumeValue.size > MAX_RESUME_BYTES) throw new ApiError(413, 'resume_too_large', 'A resume must be 8 MB or smaller.');

  const declaredFileType = resumeValue.type.toLowerCase();
  if (declaredFileType && !pdfContentTypes.has(declaredFileType)) {
    throw new ApiError(415, 'unsupported_resume_type', 'Upload your resume as a PDF.');
  }
  const bytes = Buffer.from(await resumeValue.arrayBuffer());
  if (bytes.length > MAX_RESUME_BYTES) throw new ApiError(413, 'resume_too_large', 'A resume must be 8 MB or smaller.');
  if (!hasPdfSignature(bytes)) throw new ApiError(415, 'invalid_resume', 'The selected file is not a valid PDF resume.');

  return {
    input,
    resume: {
      bytes,
      originalFilename: cleanResumeFilename(resumeValue.name),
      sha256: createHash('sha256').update(bytes).digest('hex'),
    },
  };
}

const applicationSelect = `
  application.id, application.job_id, job.title AS job_title,
  job.company_name AS job_company_name, company.name AS job_owner_name,
  job.status AS job_status, job.closes_at AS job_closes_at,
  application.applicant_id, applicant.name AS applicant_name,
  applicant.email AS applicant_email, application.status,
  application.cover_letter, application.resume_asset_id,
  application.submitted_at, application.updated_at
`;

export async function GET(request: Request) {
  try {
    const actor = await requireUser(applicationRoles);
    const url = new URL(request.url);
    const input = listSchema.parse({
      jobId: url.searchParams.get('jobId') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });

    const ownershipFilter = actor.role === 'graduate'
      ? 'application.applicant_id = $1'
      : 'job.company_id = $1';
    const result = await query<ApplicationRow>(`
      SELECT ${applicationSelect}
      FROM applications application
      LEFT JOIN jobs job ON job.id = application.job_id
      LEFT JOIN users company ON company.id = job.company_id AND company.deleted_at IS NULL
      LEFT JOIN users applicant ON applicant.id = application.applicant_id AND applicant.deleted_at IS NULL
      WHERE ${ownershipFilter}
        AND ($2 = '' OR application.job_id = $2)
        AND ($3 = 'all' OR application.status = $3)
        AND ($4 = '' OR job.title ILIKE $4 OR applicant.name ILIKE $4 OR applicant.email ILIKE $4)
      ORDER BY application.submitted_at DESC, application.id
      LIMIT $5 OFFSET $6
    `, [actor.uid, input.jobId, input.status, input.q ? `%${input.q}%` : '', input.limit + 1, input.offset]);
    return jsonOk({
      applications: result.rows.slice(0, input.limit).map(serializeApplication),
      hasMore: result.rows.length > input.limit,
      nextOffset: input.offset + Math.min(input.limit, result.rows.length),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(new Set<'graduate'>(['graduate']));
    await enforceRateLimit(request, 'job-application-create', 15, 60 * 60, actor.uid);
    const { input, resume } = await readApplicationCreateRequest(request);

    const created = await transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`application:${input.jobId}:${actor.uid}`]);
      const jobResult = await client.query<{
        id: string;
        title: string;
        company_id: string | null;
        company_name: string | null;
      }>(`
        SELECT id, title, company_id, company_name
        FROM jobs
        WHERE id = $1 AND status = 'open'
          AND (closes_at IS NULL OR closes_at > now())
        FOR SHARE
      `, [input.jobId]);
      const job = jobResult.rows[0];
      if (!job) throw new ApiError(404, 'job_not_available', 'This job is unavailable or has closed.');

      const existing = await client.query(`
        SELECT 1 FROM applications
        WHERE (job_id = $1 OR job_ref = $1)
          AND (applicant_id = $2 OR applicant_ref = $2)
        LIMIT 1
      `, [job.id, actor.uid]);
      if (existing.rows[0]) throw new ApiError(409, 'already_applied', 'You have already applied for this job.');

      const id = randomUUID();
      let resumeAssetId = input.resumeAssetId || null;
      if (resume) {
        const assetId = randomUUID();
        const storagePath = `applicationResumes/${id}/${assetId}.pdf`;
        const assetMetadata = {
          purpose: 'job_application_resume',
          applicationId: id,
          jobId: job.id,
        };
        await client.query(`
          INSERT INTO media_assets (
            id, storage_path, original_filename, content_type, byte_size, sha256,
            content, uploaded_by, is_public, source_provider, source_bucket, source_path,
            metadata, legacy_url_hashes
          ) VALUES ($1, $2, $3, 'application/pdf', $4, $5, $6, $7, false,
            'render_upload', 'postgres', $2, $8::jsonb, '[]'::jsonb)
        `, [
          assetId,
          storagePath,
          resume.originalFilename,
          resume.bytes.length,
          resume.sha256,
          resume.bytes,
          actor.uid,
          JSON.stringify(assetMetadata),
        ]);
        await writeAuditLog(client, request, actor.uid, 'application.resume.upload', 'media_asset', assetId, {
          applicationId: id,
          jobId: job.id,
          byteSize: resume.bytes.length,
          sha256: resume.sha256,
        });
        resumeAssetId = assetId;
      } else if (resumeAssetId) {
        const asset = await client.query(`
          SELECT 1 FROM media_assets
          WHERE id = $1
            AND uploaded_by = $2
            AND is_public = false
            AND metadata @> '{"purpose":"job_application_resume"}'::jsonb
        `, [resumeAssetId, actor.uid]);
        if (!asset.rows[0]) throw new ApiError(422, 'invalid_resume', 'The selected private resume is unavailable.');
      }

      const metadata = { origin: 'render', jobId: job.id, applicantId: actor.uid, resumeAssetId };
      const result = await client.query<ApplicationRow>(`
        WITH inserted AS (
          INSERT INTO applications (
            id, job_id, job_ref, applicant_id, applicant_ref, status,
            cover_letter, resume_asset_id, source_payload, source_hash, source_updated_at
          ) VALUES ($1, $2, $2, $3, $3, 'submitted', $4, $5, $6::jsonb, $7, now())
          RETURNING *
        )
        SELECT inserted.id, inserted.job_id, job.title AS job_title,
          job.company_name AS job_company_name, company.name AS job_owner_name,
          job.status AS job_status, job.closes_at AS job_closes_at,
          inserted.applicant_id, applicant.name AS applicant_name,
          applicant.email AS applicant_email, inserted.status,
          inserted.cover_letter, inserted.resume_asset_id,
          inserted.submitted_at, inserted.updated_at
        FROM inserted
        JOIN jobs job ON job.id = inserted.job_id
        LEFT JOIN users company ON company.id = job.company_id
        JOIN users applicant ON applicant.id = inserted.applicant_id
      `, [id, job.id, actor.uid, input.coverLetter || null, resumeAssetId, JSON.stringify(metadata), sourceHash(metadata)]);

      if (job.company_id) {
        const notificationId = randomUUID();
        const notificationSource = { origin: 'render', applicationId: id, jobId: job.id, recipientId: job.company_id };
        await client.query(`
          INSERT INTO notifications (
            id, user_id, recipient_ref, created_by, actor_ref, type,
            title, body, link, payload, source_payload, source_hash
          ) VALUES ($1, $2, $2, $3, $3, 'application',
            'Nouvelle candidature', $4, $5, $6::jsonb, $6::jsonb, $7)
        `, [
          notificationId,
          job.company_id,
          actor.uid,
          `${actor.name || 'Un jeune diplômé'} a postulé à l’offre « ${job.title} » sur Yahnu.`,
          `/dashboard/applicants?jobId=${encodeURIComponent(job.id)}`,
          JSON.stringify(notificationSource),
          sourceHash(notificationSource),
        ]);
      }
      await writeAuditLog(client, request, actor.uid, 'application.create', 'application', id, { jobId: job.id });
      return result.rows[0];
    });

    if (!created) throw new ApiError(500, 'application_create_failed', 'The application could not be submitted.');
    return jsonOk({ application: serializeApplication(created) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
