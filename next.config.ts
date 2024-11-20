import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd1wxxs914x4wga.cloudfront.net',
        pathname: '/whack-a-me/processed-photos/**',
      },
    ],
  },
};

export default nextConfig;
