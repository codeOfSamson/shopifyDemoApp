import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  webServer: [
    {
      command: "pnpm --filter web dev",
      // apps/web has no page at "/" (only /products/[handle], /cart,
      // /lp/[slug]), so a readiness probe against "/" 404s forever and the
      // webServer never comes up. /cart always renders 200 without needing
      // a cart cookie or Shopify credentials, so use it as the health check.
      url: "http://localhost:3000/cart",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "pnpm --filter inventory-ops dev",
      url: "http://localhost:3001/inventory",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
