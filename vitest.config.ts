import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['packages/**/*.test.ts', 'packages/**/*.test.tsx']
  },
  resolve: {
    alias: {
      '@zell/grid-core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@zell/grid-react': resolve(__dirname, 'packages/react/src/index.ts')
    }
  }
});
