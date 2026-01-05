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
        hostname: "utfs.io", // <--- ONDE AS IMAGENS DO UPLOADTHING FICAM
      },
      {
        protocol: "https",
        hostname: "placehold.co", // Para seus placeholders
      },
      // Pode remover twitter, reddit, etc.
    ],
  },
};

export default nextConfig;
