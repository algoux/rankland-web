import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@server': path.resolve(__dirname, 'src/server'),
      '@common': path.resolve(__dirname, 'src/common'),
      '@client': path.resolve(__dirname, 'src/client'),
    },
  },
});
