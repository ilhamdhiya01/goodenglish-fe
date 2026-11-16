import type { MetadataRoute } from "next";

// Makes GoodEnglish installable (PWA): its own icon and window, opening on the
// daily plan. Served by Next at /manifest.webmanifest and linked in <head>.
// The title bar is the accent blue (--color-accent), the splash screen white
// (--color-paper). Icons are Jalak on blue from public/brand: one file for
// "any" and a separate maskable one whose face sits inside the safe zone.
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
  theme_color: "#2f6fed",
  icons: [
    {
      src: "/brand/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/brand/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/brand/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
});

export default manifest;
