/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false, // Enable linting in production
  },
  typescript: {
    ignoreBuildErrors: false, // Enable type checking in production
  },
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google profile images
      'media.licdn.com', // LinkedIn profile images
      'platform-lookaside.fbsbx.com', // Facebook profile images
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

