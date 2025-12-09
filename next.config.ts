import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Disable source maps in production for smaller bundle size
  productionBrowserSourceMaps: false,

  // Enable compression
  compress: true,
};

export default nextConfig;
