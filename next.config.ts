import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "digitalhub.fifa.com",
        pathname: "/transform/**",
      },
      {
        protocol: "https",
        hostname: "api.fifa.com",
        pathname: "/api/v3/picture/flags-sq-4/*",
      },
    ],
  },
  reactStrictMode: true,
};

export default nextConfig;
