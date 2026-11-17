import type { NextConfig } from "next";

// Dev only, both opt-in through .env (see .env.example):
// - DEV_ALLOWED_ORIGINS: extra hosts allowed to open `next dev`, e.g. this
//   machine's LAN IP for testing on a phone. Next blocks its dev assets for
//   any other host, so the page would render but never become interactive.
// - DEV_API_PROXY: forward /api/v1 to the backend, so the browser talks to
//   one origin like in production (no CORS, cookie just works, and a phone
//   doesn't call its own "localhost").
const devAllowedOrigins = (process.env.DEV_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const devApiProxy = process.env.DEV_API_PROXY?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: devAllowedOrigins,
  rewrites: async () =>
    devApiProxy
      ? [
          {
            source: "/api/v1/:path*",
            destination: `${devApiProxy}/api/v1/:path*`,
          },
        ]
      : [],
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
