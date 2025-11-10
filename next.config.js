/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Cloud Run deployment
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  // Next.js automatically handles CSS loading order - CSS imports are processed first
  poweredByHeader: false,
}

module.exports = nextConfig
