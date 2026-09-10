import type { NextConfig } from "next";

const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim();

const nextConfig: NextConfig = {
  images: r2PublicUrl
    ? {
        remotePatterns: [
          new URL(r2PublicUrl.replace(/\/+$/, "") + "/**"),
        ],
      }
    : undefined,
};

export default nextConfig;
