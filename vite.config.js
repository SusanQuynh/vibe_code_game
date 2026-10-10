import { defineConfig } from 'vite';
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/vibe_code_game/' : '/',
  build: { target: 'es2020' },
  test: { include: ['tests/unit/**/*.test.js'] },
});
