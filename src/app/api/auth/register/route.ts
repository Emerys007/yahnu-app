import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { hashToken, newOpaqueToken, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { sendVerificationEmail } from '@/lib/server/email';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { hashPassword, validatePassword } from '@/lib/server/password';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const publicRoles = ['graduate', 'company', 'school'] as const;
const staffRoles = ['admin', 'super_admin', 'content_manager', 'content_moderator', 'support_staff'] as const;

const registerSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()).optional(),
  password: z.string().min(1).max(128),
  role: z.enum([...publicRoles, ...staffRoles]),
  name: z.string().trim().min(2).max(160).optional(),
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  schoolId: z.string().trim().max(160).optional(),
  schoolName: z.string().trim().max(200).optional(),
  companyName: z.string().trim().max(200).optional(),
  contactName: z.string().trim().max(160).optional(),
  industry: z.string().trim().max(160).optional(),
  inviteToken: z.string().trim().min(20).max(500).optional(),
}).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, 'register_ip', 10, 60 * 60);
    const input = registerSchema.parse(await readJson(request));
    const passwordError = validatePassword(input.password);
    if (passwordError) throw new ApiError(422, 'weak_password', passwordError);
    await enforceRateLimit(request, 'register_account_ip', 5, 60 * 60, input.email ?? input.inviteToken);

    const isPublicRole = (publicRoles as readonly string[]).includes(input.role);
    if (!input.inviteToken && !isPublicRole) {
      throw new ApiError(403, 'invitation_required', 'Staff accounts require a valid invitation.');
    }
    if (input.inviteToken && isPublicRole) {
      throw new ApiError(422, 'invalid_invitation', 'This invitation cannot create a public account.');
    }
    if (!input.inviteToken && !input.email) {
      throw new ApiError(422, 'email_required', 'Email is required.');
    }
    if (input.role === 'graduate' && !input.schoolId) {
      throw new ApiError(422, 'school_required', 'Select your school to continue.');
    }
    if (input.role === 'graduate' && ((input.firstName?.length ?? 0) < 2 || (input.lastName?.length ?? 0) < 2)) {
      throw new ApiError(422, 'name_required', 'First and last name are required.');
    }
    if (input.role === 'company' && ((input.companyName?.length ?? 0) < 2 || (input.contactName?.length ?? 0) < 2 || !input.industry)) {
      throw new ApiError(422, 'company_details_required', 'Company name, contact name, and industry are required.');
    }
    if (input.role === 'school' && ((input.schoolName?.length ?? 0) < 2 || (input.contactName?.length ?? 0) < 2)) {
      throw new ApiError(422, 'school_details_required', 'School name and contact name are required.');
    }
    if (!isPublicRole && ((input.firstName?.length ?? 0) < 2 || (input.lastName?.length ?? 0) < 2)) {
      throw new ApiError(422, 'name_required', 'First and last name are required.');
    }

    const id = randomUUID();
    const passwordHash = await hashPassword(input.password);
    const verifyToken = newOpaqueToken();
    let registeredEmail = input.email;
    let registeredSchoolName = input.role === 'school' ? input.schoolName : undefined;
    const registeredName = input.role === 'graduate' || !isPublicRole
      ? `${input.firstName} ${input.lastName}`.trim()
      : input.role === 'company'
        ? input.companyName!
        : input.schoolName!;

    await transaction(async (client) => {
      let inviteId: string | null = null;
      if (input.inviteToken) {
        const invite = await client.query<{ id: string; email: string; role: string }>(`
          SELECT id, email, role FROM invites
          WHERE token_hash = $1 AND status = 'pending' AND expires_at > now()
          FOR UPDATE
        `, [hashToken(input.inviteToken)]);
        const record = invite.rows[0];
        if (!record || (input.email && record.email.toLowerCase() !== input.email) || record.role !== input.role) {
          throw new ApiError(404, 'invalid_invitation', 'This invitation is invalid or has expired.');
        }
        inviteId = record.id;
        registeredEmail = record.email.toLowerCase();
      }

      if (input.role === 'graduate') {
        const school = await client.query<{ name: string }>(`
          SELECT COALESCE(school_name, name) AS name FROM users
          WHERE id = $1 AND role = $2 AND status = $3 AND deleted_at IS NULL
        `, [input.schoolId, 'school', 'active']);
        if (!school.rowCount) throw new ApiError(422, 'invalid_school', 'The selected school is not available.');
        registeredSchoolName = school.rows[0].name;
      }

      try {
        await client.query(`
          INSERT INTO users (
            id, email, password_hash, auth_provider, name, first_name, last_name,
            role, status, school_id, school_name, company_name, contact_name,
            industry, email_verified_at
          ) VALUES ($1, $2, $3, 'password', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NULL)
        `, [
          id, registeredEmail, passwordHash, registeredName,
          input.role === 'graduate' || !isPublicRole ? input.firstName : null,
          input.role === 'graduate' || !isPublicRole ? input.lastName : null,
          input.role, input.inviteToken ? 'active' : 'pending',
          input.role === 'graduate' ? input.schoolId : null,
          registeredSchoolName ?? null,
          input.role === 'company' ? input.companyName : null,
          input.role === 'company' || input.role === 'school' ? input.contactName : null,
          input.role === 'company' ? input.industry : null,
        ]);
      } catch (error) {
        if ((error as { code?: string }).code === '23505') {
          throw new ApiError(409, 'email_in_use', 'An account already exists for this email address.');
        }
        throw error;
      }

      await client.query(`
        INSERT INTO auth_tokens (token_hash, user_id, purpose, expires_at)
        VALUES ($1, $2, 'verify_email', now() + interval '24 hours')
      `, [hashToken(verifyToken), id]);

      if (inviteId) {
        await client.query(`UPDATE invites SET status = 'used', used_by = $1, used_at = now() WHERE id = $2`, [id, inviteId]);
      }
      await writeAuditLog(client, request, id, 'auth.register', 'user', id, { role: input.role, invited: Boolean(inviteId) });
    });

    let emailDelivery: 'sent' | 'development_link' | 'failed' = 'failed';
    let debugUrl: string | undefined;
    try {
      const delivery = await sendVerificationEmail(registeredEmail!, registeredName, verifyToken);
      emailDelivery = delivery.delivered ? 'sent' : 'development_link';
      debugUrl = delivery.debugUrl;
    } catch (error) {
      console.error('Registration succeeded but verification email failed:', error);
    }

    return jsonOk({ created: true, emailDelivery, debugUrl }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
