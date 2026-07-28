import 'server-only';

import { createHmac } from 'node:crypto';
import { ZodError } from 'zod';

import {
  expectedRequestOrigin,
  OriginConfigurationError,
} from '@/lib/server/origin-policy.mjs';

export class ApiError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string[]>;

  constructor(status: number, code: string, message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function jsonOk<T>(data: T, init: ResponseInit = {}) {
  return Response.json({ data }, {
    ...init,
    headers: { 'Cache-Control': 'no-store, max-age=0', ...init.headers },
  });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({
      error: { code: error.code, message: error.message, ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}) },
    }, { status: error.status, headers: { 'Cache-Control': 'no-store, max-age=0' } });
  }

  if (error instanceof ZodError) {
    return Response.json({
      error: {
        code: 'validation_failed',
        message: 'Please review the submitted information.',
        fieldErrors: error.flatten().fieldErrors,
      },
    }, { status: 422, headers: { 'Cache-Control': 'no-store, max-age=0' } });
  }

  // Do not emit request bodies, database values, credentials, or provider
  // responses through a generic error object. Operational logs retain only
  // enough structured context to group the failure.
  const safeError = error instanceof Error
    ? {
        name: error.name,
        code: typeof (error as Error & { code?: unknown }).code === 'string'
          ? (error as Error & { code: string }).code
          : undefined,
      }
    : { name: typeof error };
  console.error('Unhandled API error', safeError);
  return Response.json({ error: { code: 'internal_error', message: 'Something went wrong. Please try again.' } }, {
    status: 500,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

export async function readJson(request: Request, maxBytes = 512 * 1024) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new ApiError(415, 'unsupported_media_type', 'This endpoint accepts JSON only.');
  }
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new ApiError(413, 'payload_too_large', 'The request body is too large.');
  }
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, 'utf8') > maxBytes) {
      throw new ApiError(413, 'payload_too_large', 'The request body is too large.');
    }
    return JSON.parse(body) as unknown;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'invalid_json', 'The request body is not valid JSON.');
  }
}

export function assertSameOrigin(request: Request) {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') throw new ApiError(403, 'cross_site_request', 'Cross-site requests are not allowed.');

  const origin = request.headers.get('origin');
  if (!origin) return;
  let requestOrigin: string;
  try {
    requestOrigin = new URL(origin).origin;
  } catch {
    throw new ApiError(403, 'invalid_origin', 'Request origin could not be verified.');
  }

  let expectedOrigin: string;
  try {
    expectedOrigin = expectedRequestOrigin({
      appUrl: process.env.APP_URL,
      nodeEnv: process.env.NODE_ENV,
      requestUrl: request.url,
    });
  } catch (error) {
    if (error instanceof OriginConfigurationError) {
      throw new ApiError(503, error.code, 'Request origin verification is unavailable.');
    }
    throw error;
  }

  if (requestOrigin !== expectedOrigin) {
    throw new ApiError(403, 'invalid_origin', 'Request origin could not be verified.');
  }
}

export function clientAddress(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
}

export function privacyHash(value: string) {
  const pepper = process.env.AUTH_SECRET ?? 'yahnu-local-development';
  return createHmac('sha256', pepper).update(value).digest('hex');
}
