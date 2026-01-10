/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@noble/hashes', '@noble/curves', 'viem'],
  },
  turbopack: {},
};

export default nextConfig;