import type { NextConfig } from "next";

// 数据分片随 serverless 函数打包(ISR 运行时 fs 读取需要)
const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": ["./data/rec/**"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
