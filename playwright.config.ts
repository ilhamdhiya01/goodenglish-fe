import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// E2E runs against a production build with every backend call mocked in the
// browser (e2e/support/mock-api.ts), so no backend is needed — locally or in
// CI. The API base is a same-origin path the mocks intercept.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // The app's service worker would cache assets between tests.
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    // Same runtime as the Docker image: the standalone server, with public/
    // and .next/static copied next to it (they aren't part of the bundle).
    command:
      "pnpm build && cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/ && node .next/standalone/server.js",
    url: `http://localhost:${PORT}/access`,
    env: { NEXT_PUBLIC_API_URL: "/api/v1", PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
