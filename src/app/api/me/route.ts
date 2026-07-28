import { z } from 'zod';

import type { UserRow } from '@/lib/server/auth';
import { hashToken, newOpaqueToken, requireUser, toUserProfile, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { sendVerificationEmail } from '@/lib/server/email';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { verifyPassword } from '@/lib/server/password';
import { enforceRateLimit, enforceRateLimitSubject } from '@/lib/server/rate-limit';

const educationSchema = z.object({
  degree: z.string().trim().max(160),
  field: z.string().trim().max(160),
  gradYear: z.string().trim().max(20),
  verified: z.boolean().optional(),
}).strict();

const updateSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()).optional(),
  name: z.string().trim().min(2).max(160).optional(),
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  schoolName: z.string().trim().max(200).optional(),
  companyName: z.string().trim().max(200).optional(),
  contactName: z.string().trim().max(160).optional(),
  industry: z.string().trim().max(160).optional(),
  experience: z.string().trim().max(5_000).optional(),
  education: z.array(educationSchema).max(20).optional(),
  skills: z.union([z.string().max(2_000), z.array(z.string().trim().min(1).max(100)).max(100)]).optional(),
  phone: z.string().trim().max(40).optional(),
  currentPassword: z.string().min(1).max(128).optional(),
}).strict();

const returningFields = `id, email, name, first_name, last_name, role, status, school_id,
  school_name, company_name, contact_name, industry, experience, education, skills,
  phone, auth_provider, password_hash, email_verified_at, created_at`;

export async function GET() {
  try {
    return jsonOk({ user: await requireUser() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const sessionUser = await requireUser();
    const input = updateSchema.parse(await readJson(request));
    const updatedFields = Object.keys(input).filter((field) => field !== 'currentPassword');
    if (!updatedFields.length) throw new ApiError(422, 'empty_update', 'No profile changes were submitted.');
    if (input.email && input.email !== sessionUser.email?.toLowerCase()) {
      await enforceRateLimit(request, 'email_change_ip', 10, 15 * 60);
      await enforceRateLimit(request, 'email_change_account_ip', 5, 15 * 60, sessionUser.uid);
      await enforceRateLimitSubject('email_change_account', 5, 15 * 60, sessionUser.uid);
    }

    let emailToken: string | undefined;
    let pendingEmail: string | undefined;
    const updated = await transaction(async (client) => {
      const currentResult = await client.query<UserRow>(`SELECT ${returningFields} FROM users WHERE id = $1 FOR UPDATE`, [sessionUser.uid]);
      const current = currentResult.rows[0];
      if (!current) throw new ApiError(404, 'user_not_found', 'User profile not found.');

      const sets: string[] = [];
      const values: unknown[] = [];
      const add = (column: string, value: unknown) => {
        values.push(value);
        sets.push(`${column} = $${values.length}`);
      };

      for (const [inputKey, column] of [
        ['name', 'name'], ['firstName', 'first_name'], ['lastName', 'last_name'],
        ['experience', 'experience'], ['skills', 'skills'], ['phone', 'phone'],
      ] as const) {
        const value = input[inputKey];
        if (value !== undefined) add(column, column === 'skills' ? JSON.stringify(value) : value);
      }

      if (current.role === 'company') {
        if (input.companyName !== undefined) add('company_name', input.companyName);
        if (input.contactName !== undefined) add('contact_name', input.contactName);
        if (input.industry !== undefined) add('industry', input.industry);
      }
      if (current.role === 'school') {
        if (input.schoolName !== undefined) add('school_name', input.schoolName);
        if (input.contactName !== undefined) add('contact_name', input.contactName);
      }

      if (input.education !== undefined) {
        if (current.role !== 'graduate') throw new ApiError(403, 'field_forbidden', 'Education history is only available to graduates.');
        const verifiedEntries = new Set((current.education ?? [])
          .filter((entry) => entry.verified)
          .map((entry) => `${entry.degree}\u0000${entry.field}\u0000${entry.gradYear}`));
        const safeEducation = input.education.map((entry) => ({
          degree: entry.degree,
          field: entry.field,
          gradYear: entry.gradYear,
          verified: verifiedEntries.has(`${entry.degree}\u0000${entry.field}\u0000${entry.gradYear}`),
        }));
        add('education', JSON.stringify(safeEducation));
      }

      if (input.email && input.email !== current.email.toLowerCase()) {
        if (!current.password_hash) {
          throw new ApiError(403, 'password_setup_required', 'Create a password before changing your email address.');
        }
        if (!input.currentPassword || !(await verifyPassword(input.currentPassword, current.password_hash))) {
          throw new ApiError(403, 'reauthentication_failed', 'Enter your current password to change your email address.');
        }
        const conflict = await client.query('SELECT 1 FROM users WHERE lower(email) = $1 AND id <> $2 AND deleted_at IS NULL', [input.email, current.id]);
        if (conflict.rowCount) throw new ApiError(409, 'email_in_use', 'That email address is already in use.');
        emailToken = newOpaqueToken();
        pendingEmail = input.email;
        add('pending_email', input.email);
        await client.query(`DELETE FROM auth_tokens WHERE user_id = $1 AND purpose = 'change_email' AND used_at IS NULL`, [current.id]);
        await client.query(`
          INSERT INTO auth_tokens (token_hash, user_id, purpose, target_email, expires_at)
          VALUES ($1, $2, 'change_email', $3, now() + interval '24 hours')
        `, [hashToken(emailToken), current.id, input.email]);
      }

      if (!sets.length) return current;
      const organizationIdentityChanged = (
        current.role === 'company'
        && (
          (input.companyName !== undefined && input.companyName !== (current.company_name ?? ''))
          || (input.name !== undefined && input.name !== current.name)
        )
      ) || (
        current.role === 'school'
        && (
          (input.schoolName !== undefined && input.schoolName !== (current.school_name ?? ''))
          || (input.name !== undefined && input.name !== current.name)
        )
      );
      values.push(current.id);
      const result = await client.query<UserRow>(`
        UPDATE users SET ${sets.join(', ')} WHERE id = $${values.length}
        RETURNING ${returningFields}
      `, values);
      if (organizationIdentityChanged) {
        const revoked = await client.query(`
          UPDATE organization_profiles
          SET verification_status = 'unverified',
            verified_at = NULL,
            verification_requested_at = NULL,
            verification_reviewed_at = NULL,
            verification_reviewed_by = NULL,
            verification_note = NULL
          WHERE user_id = $1
            AND verification_status <> 'unverified'
        `, [current.id]);
        if (revoked.rowCount) {
          await writeAuditLog(
            client,
            request,
            current.id,
            'organization_verification.revoked',
            'organization_profile',
            current.id,
            { reason: 'organization_name_changed' },
          );
        }
      }
      await writeAuditLog(client, request, current.id, 'profile.update', 'user', current.id, { fields: updatedFields });
      return result.rows[0];
    });

    let emailChangeDelivery: 'sent' | 'development_link' | 'failed' | undefined;
    let debugUrl: string | undefined;
    if (emailToken && pendingEmail) {
      try {
        const delivery = await sendVerificationEmail(pendingEmail, updated.name, emailToken);
        emailChangeDelivery = delivery.delivered ? 'sent' : 'development_link';
        debugUrl = delivery.debugUrl;
      } catch (error) {
        emailChangeDelivery = 'failed';
        console.error('Profile updated but email-change verification delivery failed:', error);
      }
    }

    return jsonOk({ user: toUserProfile(updated), emailChangeDelivery, debugUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
