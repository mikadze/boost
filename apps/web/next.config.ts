import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/ui'],
  // Externalize better-auth from SSR to prevent localStorage access during server rendering
  serverExternalPackages: ['better-auth'],
};

export default nextConfig;
