import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.tenx10.co" }],
        destination: "https://tenx10.co/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
