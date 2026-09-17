import type { NextConfig } from 'next';

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Only rewrite if API URL is external/local, or fallback
    if (backendUrl.startsWith('http')) {
      return [
        {
          source: '/api/v1/:path*',
          destination: `${backendUrl}/api/v1/:path*`,
        },
        {
          source: '/health',
          destination: `${backendUrl}/health`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;

