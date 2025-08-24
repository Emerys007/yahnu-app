/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'w.univ-fhb.edu.ci',
      },
      {
        protocol: 'https',
        hostname: 'www.adminsite.inphb.app',
      },
      {
        protocol: 'https',
        hostname: 'groupecsi-pp.com',
      },
      {
        protocol: 'https',
        hostname: 'esatic.ci',
      },
      {
        protocol: 'https',
        hostname: 'ensea.ed.ci',
      },
      {
        protocol: 'https',
        hostname: 'csipolytechnique.ci',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'www.sifca.ci',
      },
      {
        protocol: 'https',
        hostname: 'bridgebankgroup.com',
      },
      {
        protocol: 'https',
        hostname: 'www.bridgebankgroup.com',
      },
      {
        protocol: 'https'
        ,
        hostname: 'www.cevalogistics.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '8886743.fs1.hubspotusercontent-na1.net',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'groupesifca.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
    ],
  },
};

module.exports = nextConfig;
