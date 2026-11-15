import type { MetadataRoute } from "next";

// Makes GoodEnglish installable (PWA): its own icon and window, opening on the
// daily plan. Served by Next at /manifest.webmanifest and linked in <head>.
// Colors are the app's --color-paper (app/globals.css); the white title bar
// matches the white top bar.
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
