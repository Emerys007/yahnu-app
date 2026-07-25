/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https://*.googleapis.com https://api.opencagedata.com",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // Resume uploads are sent to a server action; keep this deliberately bounded.
    serverActions: { bodySizeLimit: '6mb' },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'w.univ-fhb.edu.ci' },
      { protocol: 'https', hostname: 'www.adminsite.inphb.app' },
      { protocol: 'https', hostname: 'groupecsi-pp.com' },
      { protocol: 'https', hostname: 'esatic.ci' },
      { protocol: 'https', hostname: 'ensea.ed.ci' },
      { protocol: 'https', hostname: 'csipolytechnique.ci' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'www.sifca.ci' },
      { protocol: 'https', hostname: 'bridgebankgroup.com' },
      { protocol: 'https', hostname: 'www.bridgebankgroup.com' },
      { protocol: 'https', hostname: 'www.cevalogistics.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '8886743.fs1.hubspotusercontent-na1.net' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'groupesifca.com' },
      { protocol: 'https', hostname: 'media.licdn.com' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
