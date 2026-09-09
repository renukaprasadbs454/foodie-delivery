import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
};

export default nextConfig;