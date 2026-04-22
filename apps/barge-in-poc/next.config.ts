import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@digital-teacher/shared-types'],
};

export default nextConfig;
