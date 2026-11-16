import type { FullConfig } from "@playwright/test";

// The standalone server renders each route for the first time on its first
// request, which made whichever tests ran first time out. Request every
// route once (with a session cookie, so nothing redirects) before the tests.
const ROUTES = [
  "/access",
  "/plan",
  "/vocab",
  "/review",
  "/scenario",
  "/errors",
  "/grammar/tense",
  "/grammar/thit",
  "/grammar/been",
  "/pronunciation",
  "/cheatsheet",
  "/admin/tokens",
  "/dev/ui",
];

const globalSetup = async (config: FullConfig) => {
  const base = config.projects[0].use.baseURL!;
  await Promise.all(
    ROUTES.map((r) =>
      fetch(base + r, { headers: { cookie: "session=e2e" } }).catch(() => {}),
    ),
  );
};

export default globalSetup;
