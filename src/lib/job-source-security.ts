import { isIP } from 'node:net';

const blockedHostnames = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.goog',
]);

function normalizedHost(value: string) {
  return value.trim().toLowerCase().replace(/\.$/, '');
}

export function isBlockedHostname(value: string) {
  const hostname = normalizedHost(value);
  return blockedHostnames.has(hostname)
    || hostname.endsWith('.localhost')
    || hostname.endsWith('.local')
    || hostname.endsWith('.internal')
    || hostname.endsWith('.home')
    || hostname.endsWith('.lan');
}

function parseIpv4(value: string) {
  if (isIP(value) !== 4) return null;
  return value.split('.').map(Number);
}

export function isPrivateOrReservedIp(value: string) {
  const ipv4 = parseIpv4(value);
  if (ipv4) {
    const [a, b] = ipv4;
    return a === 0
      || a === 10
      || a === 127
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && (b === 0 || b === 168))
      || (a === 198 && (b === 18 || b === 19))
      || a >= 224;
  }

  if (isIP(value) !== 6) return true;
  const address = value.toLowerCase().split('%')[0];
  if (address === '::' || address === '::1') return true;
  if (address.startsWith('fc') || address.startsWith('fd')) return true;
  if (/^fe[89ab]/.test(address)) return true;
  if (address.startsWith('ff')) return true;
  if (address.startsWith('2001:db8:')) return true;
  if (address.startsWith('::ffff:')) {
    return isPrivateOrReservedIp(address.slice('::ffff:'.length));
  }
  return false;
}

export function approvedHttpsUrl(
  value: string,
  allowedHosts: readonly string[],
  allowedPathPrefixes: readonly string[] = [],
) {
  if (!value || value.length > 2_048 || /[\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const parsed = new URL(value);
    const hostname = normalizedHost(parsed.hostname);
    const hosts = new Set(allowedHosts.map(normalizedHost));
    if (
      parsed.protocol !== 'https:'
      || parsed.username
      || parsed.password
      || (parsed.port && parsed.port !== '443')
      || isBlockedHostname(hostname)
      || !hosts.has(hostname)
      || (
        allowedPathPrefixes.length > 0
        && !allowedPathPrefixes.some((prefix) => prefix.startsWith('/') && parsed.pathname.startsWith(prefix))
      )
    ) return null;
    parsed.hash = '';
    return parsed;
  } catch {
    return null;
  }
}
