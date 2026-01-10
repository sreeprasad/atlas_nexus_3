/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    '@noble/hashes',
    '@noble/curves', 
    '@coinbase/coinbase-sdk',
    '@coinbase/agentkit',
    'viem',
  ],
};

export default nextConfig;
