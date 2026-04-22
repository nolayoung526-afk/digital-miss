import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 关闭 strict mode · 避免 useEffect 双跑导致 Agora 单例 join 冲突
  // 生产构建不受影响 · 如需排查 deprecation 再开
  reactStrictMode: false,
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
