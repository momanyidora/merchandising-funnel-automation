import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/vendor/:path*",
        destination: "http://localhost:3001/:path*",
      },
      {
        source: "/api/procurement/:path*",
        destination: "http://localhost:3002/:path*",
      },
      {
        source: "/api/inventory/:path*",
        destination: "http://localhost:3003/inventory/:path*",
      },
    ];
  },
};

export default nextConfig;
