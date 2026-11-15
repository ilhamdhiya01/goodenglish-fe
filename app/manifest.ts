import type { MetadataRoute } from "next";

// Makes GoodEnglish installable (PWA): its own icon and window, opening on the
// daily plan. Served by Next at /manifest.webmanifest and linked in <head>.
// Colors are the app's --color-paper (app/globals.css); the white title bar
// matches the white top bar. The icons are the blue "ge" of the theme; their
// file names carry a version because public/sw.js caches /icons/* forever —
// a new design needs new names (-v3, …) to reach installed apps.
const manifest = (): MetadataRoute.Manifest => ({
  name: "GoodEnglish",
  short_name: "GoodEnglish",
  description:
    "Belajar bahasa Inggris setiap hari: kosakata, grammar, dan ulangan.",
  lang: "id",
  start_url: "/plan",
  scope: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#ffffff",
  icons: [
    { src: "/icons/icon-192-v2.png", sizes: "192x192", type: "image/png" },
    { src: "/icons/icon-512-v2.png", sizes: "512x512", type: "image/png" },
    {
      src: "/icons/maskable-512-v2.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
});

export default manifest;
