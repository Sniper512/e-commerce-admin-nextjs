import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nayabazar.pk",
      },
      {
        protocol: "https",
        hostname: "scontent.fkhi20-1.fna.fbcdn.net",
      },
    ],
  },
};

export default nextConfig;
