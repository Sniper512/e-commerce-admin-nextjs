import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
    dangerouslyAllowSVG: true, // Add this
    contentDispositionType: "attachment", // Add this for security
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Add this for security
  },
};

export default nextConfig;
