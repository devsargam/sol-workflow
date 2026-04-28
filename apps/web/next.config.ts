import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@repo/types", "@repo/solana"],
  output: "standalone",
};

const withMDX = createMDX();

export default withMDX(nextConfig);
