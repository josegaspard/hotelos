import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@hotelos/shared", "@hotelos/email"],
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
