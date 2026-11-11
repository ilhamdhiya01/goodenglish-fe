import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // The service worker (public/sw.js) must never be cached by the browser or
  // a CDN, or an updated worker would take a day to reach installed apps.
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
      ],
    },
  ],
};

export default nextConfig;
