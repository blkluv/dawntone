import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  webpack(config) {
    config.resolve.alias["vs"] = path.join(__dirname, "public/vs");
    return config;
  },
};

export default nextConfig;
