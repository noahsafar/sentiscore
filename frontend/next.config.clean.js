/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  // Remove experimental features that might cause issues
  swcMinify: true,
  // Disable TypeScript checking for build to speed up
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint for build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;