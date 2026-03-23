/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Required for sub-path hosting (e.g. /queer-cycle)
  basePath,

  // Keep assets consistent when a basePath is set.
  assetPrefix: basePath || undefined,

  // Makes deployments much easier: `.next/standalone/server.js` includes required node_modules.
  output: "standalone",
};

export default nextConfig;
