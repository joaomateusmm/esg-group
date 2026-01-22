import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Correção do erro de 'fs' (MANTENHA ISSO)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io", 
      },
      {
        protocol: "https",
        hostname: "flagcdn.com", 
      },
    ],
  },
};

export default nextConfig;
