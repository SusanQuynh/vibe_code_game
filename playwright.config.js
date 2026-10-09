import { defineConfig } from '@playwright/test';

// BASE_URL: chạy e2e với bản build (vd http://localhost:4173/vibe_code_game/) thay vì dev server.
const external = process.env.BASE_URL;
export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: external ?? 'http://localhost:5173',
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: external ? undefined : {
    command: 'npx vite --port 5173 --strictPort',
    url: 'http://localhost:5173/legacy/starlight-original.html',
    reuseExistingServer: true,
  },
});
