import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cấu hình cho Vercel deployment
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [],
  },
  // Tăng giới hạn body size cho upload ảnh
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
