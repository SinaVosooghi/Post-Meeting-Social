/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during build for 48-hour deployment
  },
  typescript: {
    ignoreBuildErrors: true, // Skip TypeScript errors for 48-hour deployment
  },
};

module.exports = nextConfig;
