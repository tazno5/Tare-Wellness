import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  reactStrictMode: false,
  images: {
    // Allow large hero images (1648×1648 RGBA) without optimization issues
    unoptimized: true,
  },
};

export default nextConfig;
