import "./globals.css";

import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  IBM_Plex_Mono,
  Newsreader,
} from "next/font/google";
import { Toaster } from "react-hot-toast";

import QueryProvider from "@/components/providers/QueryProvider";

// Same faces/weights the SPA loaded from Google Fonts in index.html, now
// self-hosted by next/font.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  axes: ["opsz"],
  variable: "--font-bricolage",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vocab Bekal Speaking",
  other: { google: "notranslate" },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html
    lang="id"
    translate="no"
    className={`notranslate ${bricolage.variable} ${plexMono.variable} ${newsreader.variable}`}
  >
    <body>
      <QueryProvider>{children}</QueryProvider>
      <Toaster position="top-right" />
    </body>
  </html>
);

export default RootLayout;
