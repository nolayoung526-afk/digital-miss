import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 后端代理 · 对接 class-orchestrator
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE ?? 'http://localhost:8081'}/api/:path*`,
      },
    ];
  },
  // 支持 shared-types workspace 包
  transpilePackages: ['@digital-teacher/shared-types'],
};

export default nextConfig;
