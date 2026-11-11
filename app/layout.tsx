import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";

import QueryProvider from "@/components/providers/QueryProvider";
import ServiceWorkerRegister from "@/components/providers/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "GoodEnglish",
  other: { google: "notranslate" },
  // iPhone "Add to Home Screen" (Safari ignores most of the web manifest);
  // the icon is app/apple-icon.png.
  appleWebApp: {
    capable: true,
    title: "GoodEnglish",
    statusBarStyle: "default",
  },
};

// Colors the installed app's title bar / Android status bar.
export const viewport: Viewport = {
  themeColor: "#1f6b57",
};

// Fonts load from the exact Google Fonts URL the Vite app used, on purpose:
// it asks for a fixed-weight Newsreader with an opsz axis and Plex Mono at
// 400/500 only, so bold text is browser-synthesized. next/font can't express
// that combination and loads the full variable weight range instead, which
// visibly changes bold/italic text — and the UI must match the old app.
const GOOGLE_FONTS =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Newsreader:ital,opsz,wght@0,6..72,400;1,6..72,400&family=IBM+Plex+Mono:wght@400;500&display=swap";

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang="id" translate="no" className="notranslate">
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link href={GOOGLE_FONTS} rel="stylesheet" />
    </head>
    <body>
      <QueryProvider>{children}</QueryProvider>
      <Toaster position="top-right" />
      <ServiceWorkerRegister />
    </body>
  </html>
);

export default RootLayout;
