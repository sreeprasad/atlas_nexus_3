/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Remove jose and the SDKs from external packages 
  // so Next.js can process them.
  serverExternalPackages: [
    '@noble/hashes',
    '@noble/curves',
  ],

  // 2. Add them here to force Next.js to handle the 
  // ESM/CommonJS interop during the build.
  transpilePackages: [
    '@coinbase/cdp-sdk',
    '@coinbase/agentkit',
    '@coinbase/coinbase-sdk',
    'jose',
    'viem'
  ],
  
  // 3. Optional: If the error persists, try adding this 
  // experimental flag which helps with ESM/CJS compatibility.
  experimental: {
    esmExternals: 'loose',
  },
};

export default nextConfig;