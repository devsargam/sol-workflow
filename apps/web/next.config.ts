import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@repo/types", "@repo/solana"],
  output: "standalone",
};

export default nextConfig;
