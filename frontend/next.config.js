/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify: true, // ❌ REMOVED - enabled by default in Next.js 15/16

  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  // eslint: { // ❌ REMOVED - move this to package.json or use CLI
  //   ignoreDuringBuilds: false,
  // },
};

module.exports = nextConfig;
