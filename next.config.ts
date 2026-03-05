import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Preserve @/* alias via tsconfig paths
  turbopack: { root: process.cwd() },
};

export default nextConfig;
