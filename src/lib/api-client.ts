export type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    fieldErrors?: Record<string, string[]>;
  };
};

export class ApiClientError extends Error {
  code: string;
  status: number;
  fieldErrors?: Record<string, string[]>;

  constructor(message: string, code = 'request_failed', status = 500, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiFetch<T>(input: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : {};

  if (!response.ok) {
    const failure = payload as ApiErrorPayload;
    throw new ApiClientError(
      failure.error?.message ?? 'The request could not be completed.',
      failure.error?.code ?? 'request_failed',
      response.status,
      failure.error?.fieldErrors,
    );
  }

  return payload as T;
}

