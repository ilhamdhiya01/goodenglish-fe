import type { MetadataRoute } from "next";

// Makes GoodEnglish installable (PWA): its own icon and window, opening on the
// daily plan. Served by Next at /manifest.webmanifest and linked in <head>.
// Colors are the app's --color-paper and --color-green (app/globals.css).
const manifest = (): MetadataRoute.Manifest => ({
  name: "GoodEnglish",
  short_name: "GoodEnglish",
  description:
    "Belajar bahasa Inggris setiap hari: kosakata, grammar, dan ulangan.",
  lang: "id",
  start_url: "/plan",
  scope: "/",
  display: "standalone",
  background_color: "#f4f1ea",
  theme_color: "#1f6b57",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    {
      src: "/icons/maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
});

export default manifest;
