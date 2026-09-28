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
      { source: "/api/receiving/:path*", destination: "http://localhost:3004/receiving/:path*" },
      { source: "/api/warehouse/:path*", destination: "http://localhost:3005/warehouse/:path*" },
      { source: "/api/sales/:path*", destination: "http://localhost:3006/sales/:path*" },
      { source: "/api/sales-audit/:path*", destination: "http://localhost:3007/audits/:path*" },
      { source: "/api/financials/:path*", destination: "http://localhost:3008/financials/:path*" },
    ];
  },
};

export default nextConfig;
