import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@repo/types", "@repo/solana", "@privy-io/react-auth"],
};

export default nextConfig;
