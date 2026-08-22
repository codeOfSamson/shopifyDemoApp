import type { NextConfig } from "next";

const INVENTORY_OPS_ORIGIN = process.env.INVENTORY_OPS_ORIGIN ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/utils"],
  async rewrites() {
    return [
      { source: "/inventory", destination: `${INVENTORY_OPS_ORIGIN}/inventory` },
      { source: "/inventory/:path*", destination: `${INVENTORY_OPS_ORIGIN}/inventory/:path*` },
    ];
  },
};

export default nextConfig;
