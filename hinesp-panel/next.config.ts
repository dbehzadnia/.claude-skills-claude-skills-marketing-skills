import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["bcrypt"],
  experimental: {
    serverActions: { bodySizeLimit: "11mb" },
  },
};

export default nextConfig;
