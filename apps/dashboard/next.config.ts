import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@hotelos/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
