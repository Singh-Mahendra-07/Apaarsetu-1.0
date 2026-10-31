import type { NextConfig } from "next";

const backendUrl =
  process.env.INTERNAL_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8081/api/v1";

const cleanBackendUrl = backendUrl.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${cleanBackendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
