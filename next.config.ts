import type { NextConfig } from "next";

const SUPABASE_HOSTNAME = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "zxmyjqnbvywdkxpyejwu.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: SUPABASE_HOSTNAME,
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Limit the variants Vercel generates (saves transformation quota).
    deviceSizes: [54, 96, 108, 162, 200, 400],
    imageSizes: [54, 64, 96, 108, 128, 162, 200],
  },
};

export default nextConfig;
