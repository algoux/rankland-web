import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    include: ['tests/unit/**/*.spec.ts', 'tests/ssr/**/*.spec.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@server': path.resolve(__dirname, './src/server'),
      '@common': path.resolve(__dirname, './src/common'),
      '@client': path.resolve(__dirname, './src/client'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
