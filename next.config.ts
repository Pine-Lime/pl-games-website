import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd1wxxs914x4wga.cloudfront.net',
        pathname: '/whack-a-me/processed-photos/**',
      },
      {
        protocol: 'https',
        hostname: 'd1tsukz865bhnw.cloudfront.net',
        pathname: '/puzzle-a-day/**',
      },
    ],
  },
};

export default nextConfig;
