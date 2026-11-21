import { defineConfig, devices } from "@playwright/test";

/** Pruebas de la versión HTML estática (carpeta out/) con un Netlify simulado. */
export default defineConfig({
  testDir: "./e2e-netlify",
  timeout: 60_000,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3200", trace: "off" },
  projects: [
    { name: "movil", use: { ...devices["Pixel 7"] } },
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: "node e2e-netlify/server.mjs out 3200",
    url: "http://localhost:3200/",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
