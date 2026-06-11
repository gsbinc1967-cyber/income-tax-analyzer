import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // basePath only used for subpath deployments (e.g., Hostinger)
  // For Vercel, remove basePath - app runs at root domain
  // basePath: "/income-tax",
};

export default nextConfig;
