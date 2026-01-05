/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Handle canvas dependency for pdf-parse
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  // Increase API route timeout for resume processing
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  // Configure for Vercel deployment
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
