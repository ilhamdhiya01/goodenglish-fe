import { NextRequest, NextResponse } from "next/server";

import { publicRoutes, ROUTES } from "./routes";

// First gate only: no `session` cookie → token screen. Whether the session is
// still valid (token revoked, expired, devices reset) and which menus/levels
// it may open is decided by the backend and enforced in AppShell, because a
// cookie can outlive its session.
export const proxy = async (request: NextRequest) => {
  const { nextUrl, url } = request;
  const path = nextUrl.pathname;
  const hasSession = !!request.cookies.get("session")?.value;
  const isPublic = publicRoutes.some((route) => path === route);

  if (!hasSession && !isPublic) {
    const accessUrl = new URL(ROUTES.ACCESS, url);
    if (path !== ROUTES.ROOT) accessUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(accessUrl);
  }

  return NextResponse.next();
};

export const config = {
  // Icons and the PWA files (manifest, service worker, app icons) must load
  // before there is a session too: the browser fetches them on the token
  // screen, and a redirect to /access would make the app uninstallable.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|sw.js|icons/).*)",
  ],
};
