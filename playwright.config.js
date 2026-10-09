import { defineConfig } from '@playwright/test';

// BASE_URL: chạy e2e với bản build (vd http://localhost:4173/vibe_code_game/) thay vì dev server.
const external = process.env.BASE_URL;
export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: external ?? 'http://127.0.0.1:5173',
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: external ? undefined : {
    command: 'npx vite --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
