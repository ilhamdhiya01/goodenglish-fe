import "./globals.css";

import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Nunito } from "next/font/google";
import { Toaster } from "react-hot-toast";

import QueryProvider from "@/components/providers/QueryProvider";
import ServiceWorkerRegister from "@/components/providers/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "GoodEnglish",
  other: { google: "notranslate" },
  // iPhone "Add to Home Screen" (Safari ignores most of the web manifest);
  // the icon is app/apple-icon.png. The tab icons are app/icon.svg, with
  // app/icon1.png (32px) and app/icon2.png (16px) for browsers without SVG.
  appleWebApp: {
    capable: true,
    title: "GoodEnglish",
    statusBarStyle: "default",
  },
};

// Colors the installed app's title bar / Android status bar (--color-accent).
// viewportFit "cover" lets env(safe-area-inset-*) report the iPhone notch and
// home bar, which the fixed bottom controls pad around.
export const viewport: Viewport = {
  themeColor: "#2f6fed",
  viewportFit: "cover",
};

// Self-hosted by next/font. Nunito is a variable font, so one file per style
// covers every weight the UI uses (600–900); --font-sans in globals.css reads
// these variables.
const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-nunito",
  display: "swap",
});

// Only for access tokens (ge_…).
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html
    lang="id"
    translate="no"
    className={`notranslate ${nunito.variable} ${plexMono.variable}`}
  >
    <body>
      <QueryProvider>{children}</QueryProvider>
      <Toaster position="top-right" />
      <ServiceWorkerRegister />
    </body>
  </html>
);

export default RootLayout;
