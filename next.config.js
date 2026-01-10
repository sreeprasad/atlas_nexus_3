/** @type {import('next').NextConfig} */
const nextConfig = {
  // Move these to transpilePackages so Next.js handles the CJS/ESM bridge
  transpilePackages: [
    '@coinbase/cdp-sdk',
    '@coinbase/agentkit',
    '@coinbase/coinbase-sdk',
    'jose',
    'viem',
    '@noble/hashes',
    '@noble/curves',
    '@solana/web3.js', // Add this specifically
  ],
  experimental: {
    // This allows the bundler to be more flexible with ESM imports
    // which fixes the "PublicKey is not a constructor" error
    esmExternals: 'loose', 
  },
};

export default nextConfig;