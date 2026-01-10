/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    '@noble/hashes',
    '@noble/curves', 
    '@coinbase/coinbase-sdk',
    '@coinbase/cdp-sdk',
    '@coinbase/agentkit',
    'viem',
    'jose',
  ],
};

export default nextConfig;
