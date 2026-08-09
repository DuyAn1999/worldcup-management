import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "digitalhub.fifa.com",
        pathname: "/transform/**",
      },
    ],
  },
  reactStrictMode: true,
};

export default nextConfig;
