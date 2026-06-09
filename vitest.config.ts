import path from 'path';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
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
      '@': path.resolve(__dirname, 'src/client'),
    },
  },
});
