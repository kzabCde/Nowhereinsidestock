import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 300
    }
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        "@std/testing/mock": false,
        "@std/testing/bdd": false,
        "@gadicc/fetch-mock-cache/runtimes/deno.ts": false,
        "@gadicc/fetch-mock-cache/stores/fs.ts": false
      };
    }

    return config;
  }
};

export default nextConfig;
