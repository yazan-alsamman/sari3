import type { NextConfig } from "next";
import path from "path";

/**
 * Static export so Capacitor can load the UI inside a native WebView
 * (Android / iOS shell). Web `next dev` still works the same for browser testing.
 */
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(__dirname),
  transpilePackages: ["leaflet", "react-leaflet"],
};

export default nextConfig;
