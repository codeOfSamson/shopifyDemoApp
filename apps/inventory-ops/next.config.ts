import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/inventory",
  transpilePackages: ["@repo/ui", "@repo/utils"],
};

export default nextConfig;
