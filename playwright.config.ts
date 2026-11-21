import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
export const E2E_DATA_DIR = ".data-e2e";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "off" },
  projects: [
    { name: "movil", use: { ...devices["Pixel 7"] } },
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/solicitar-presupuesto`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { STORAGE_DRIVER: "local", DATA_DIR: E2E_DATA_DIR, RATE_LIMIT_MAX: "1000", NEXT_TELEMETRY_DISABLED: "1" },
  },
});
