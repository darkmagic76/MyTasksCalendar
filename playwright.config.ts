import { defineConfig } from '@playwright/test';

/**
 * Verificación visual y funcional:
 *  - proyectos "desktop" (1440×900) y "mobile" (390×844 con táctil)
 *  - sirve el build de producción (`npm run preview`)
 */
export default defineConfig({
  testDir: './scripts/e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'es-ES',
    // Chrome del sistema: la plataforma (Ubuntu 20.04) no admite la
    // descarga de Chromium incluida en Playwright.
    channel: 'chrome',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
