import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Use frontend as the project root so Tailwind and other deps resolve from
  // frontend/node_modules (Next.js was inferring repo root due to lockfiles).
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
