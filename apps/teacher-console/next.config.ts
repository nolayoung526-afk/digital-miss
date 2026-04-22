import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE ?? 'http://localhost:8081'}/api/:path*`,
      },
      {
        source: '/strategy/:path*',
        destination: `${process.env.STRATEGY_BASE ?? 'http://localhost:8083'}/api/v1/:path*`,
      },
    ];
  },
  transpilePackages: ['@digital-teacher/shared-types'],
};

export default nextConfig;
