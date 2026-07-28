export class OriginConfigurationError extends Error {
  constructor(code) {
    super(code);
    this.name = 'OriginConfigurationError';
    this.code = code;
  }
}

export function parseCanonicalAppOrigin(value) {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (
      !['http:', 'https:'].includes(parsed.protocol)
      || parsed.username
      || parsed.password
      || (parsed.pathname !== '' && parsed.pathname !== '/')
      || parsed.search
      || parsed.hash
    ) {
      throw new Error('invalid canonical origin');
    }
    return parsed.origin;
  } catch {
    throw new OriginConfigurationError('origin_configuration_invalid');
  }
}

export function expectedRequestOrigin({ appUrl, nodeEnv, requestUrl }) {
  const configured = parseCanonicalAppOrigin(appUrl);
  if (configured) return configured;

  if (nodeEnv === 'production') {
    throw new OriginConfigurationError('origin_configuration_missing');
  }

  try {
    return new URL(requestUrl).origin;
  } catch {
    throw new OriginConfigurationError('origin_configuration_invalid');
  }
}
