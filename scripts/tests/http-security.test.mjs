import assert from 'node:assert/strict';
import test from 'node:test';

import {
  OriginConfigurationError,
  expectedRequestOrigin,
  parseCanonicalAppOrigin,
} from '../../src/lib/server/origin-policy.mjs';

test('canonical app origin accepts only a clean HTTP(S) origin', () => {
  assert.equal(parseCanonicalAppOrigin('https://yahnu.org/'), 'https://yahnu.org');
  assert.equal(parseCanonicalAppOrigin(' http://127.0.0.1:3000 '), 'http://127.0.0.1:3000');

  for (const value of [
    'javascript:alert(1)',
    'https://user:pass@yahnu.org',
    'https://yahnu.org/admin',
    'https://yahnu.org?next=evil',
    'https://yahnu.org#fragment',
  ]) {
    assert.throws(
      () => parseCanonicalAppOrigin(value),
      (error) => error instanceof OriginConfigurationError
        && error.code === 'origin_configuration_invalid',
    );
  }
});

test('production origin verification fails closed without APP_URL', () => {
  assert.throws(
    () => expectedRequestOrigin({
      appUrl: '',
      nodeEnv: 'production',
      requestUrl: 'https://attacker.example/api/me',
    }),
    (error) => error instanceof OriginConfigurationError
      && error.code === 'origin_configuration_missing',
  );
});

test('configured APP_URL wins over request and forwarded host values', () => {
  assert.equal(
    expectedRequestOrigin({
      appUrl: 'https://yahnu.org',
      nodeEnv: 'production',
      requestUrl: 'https://attacker.example/api/me',
    }),
    'https://yahnu.org',
  );
});

test('development falls back to the concrete request URL origin', () => {
  assert.equal(
    expectedRequestOrigin({
      appUrl: undefined,
      nodeEnv: 'development',
      requestUrl: 'http://127.0.0.1:3100/api/me',
    }),
    'http://127.0.0.1:3100',
  );
});
