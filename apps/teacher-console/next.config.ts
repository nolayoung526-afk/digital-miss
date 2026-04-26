import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Persona + Asset → teacher-asset-mgr(默认 8082)
      {
        source: '/api/v1/persona/:path*',
        destination: `${process.env.ASSET_API_BASE ?? 'http://localhost:8082'}/api/v1/persona/:path*`,
      },
      {
        source: '/api/v1/asset/:path*',
        destination: `${process.env.ASSET_API_BASE ?? 'http://localhost:8082'}/api/v1/asset/:path*`,
      },
      // 其他 /api/* → class-orchestrator(8081)
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE ?? 'http://localhost:8081'}/api/:path*`,
      },
      {
        source: '/strategy/:path*',
        destination: `${process.env.STRATEGY_BASE ?? 'http://localhost:8083'}/api/v1/:path*`,
      },
      // 静态素材直传 teacher-asset-mgr
      {
        source: '/assets/:path*',
        destination: `${process.env.ASSET_API_BASE ?? 'http://localhost:8082'}/assets/:path*`,
      },
    ];
  },
  transpilePackages: ['@digital-teacher/shared-types'],
};

export default nextConfig;
