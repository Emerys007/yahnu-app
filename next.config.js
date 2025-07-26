
/** @type {import('next').NextConfig} */
module.exports = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.inphb.ci' },
      { protocol: 'https', hostname: 'ufhb.edu.ci' },
      { protocol: 'https', hostname: 'csipolytechnique.ci' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'www.sifca.ci' },
      { protocol: 'https', hostname: 'bridgebankgroup.com' },
      { protocol: 'https', hostname: 'www.bollore-logistics.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '8886743.fs1.hubspotusercontent-na1.net' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
};
