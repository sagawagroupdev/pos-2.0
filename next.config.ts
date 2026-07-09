import type { NextConfig } from "next";

const r2PublicUrl = process.env.R2_PUBLIC_URL;
const remotePatterns: NonNullable<
  NextConfig["images"]
>["remotePatterns"] = [];

if (r2PublicUrl) {
  try {
    const { protocol, hostname } = new URL(r2PublicUrl);
    remotePatterns.push({
      protocol: protocol.replace(":", "") as "http" | "https",
      hostname,
    });
  } catch {
    // ignore invalid R2_PUBLIC_URL during build
  }
}

const nextConfig: NextConfig = {
  images: { remotePatterns },
  async rewrites() {
    return [
      {
        source: "/order/:path*",
        has: [{ type: "host", value: "order.sagawagroup.id" }],
        destination: "/order/:path*",
      },
    ];
  },
};

export default nextConfig;
