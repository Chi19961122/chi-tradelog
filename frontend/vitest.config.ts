import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

// 純函式單元測試（不需瀏覽器 DOM）。
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
