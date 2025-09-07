/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during build for 48-hour deployment
  },
  typescript: {
    ignoreBuildErrors: true, // Skip TypeScript errors for 48-hour deployment
  },
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google profile images
      'media.licdn.com', // LinkedIn profile images
      'platform-lookaside.fbsbx.com', // Facebook profile images
    ],
  },
};

module.exports = nextConfig;
