/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  images: {
    domains: ["avatars.githubusercontent.com", "lh3.googleusercontent.com"],
  },
  experimental: {
    serverComponentsExternalPackages: ['canvas'],
  },
  // Increase API route timeout for long-running operations
  serverRuntimeConfig: {
    // Increase timeout for API routes
    maxDuration: 60,
  },
  // TypeScript and ESLint configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  swcMinify: true,
  // API routes optimization
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300'
          }
        ]
      }
    ];
  },
};

export default nextConfig;
