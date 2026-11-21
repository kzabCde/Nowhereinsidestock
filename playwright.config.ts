import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  workers: 2,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3417",
    locale: "en-US",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    }
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3417",
    url: "http://127.0.0.1:3417",
    timeout: 60_000,
    reuseExistingServer: false,
    env: { ALERT_BACKGROUND_ENABLED: "false", NEXT_TELEMETRY_DISABLED: "1" }
  }
});
