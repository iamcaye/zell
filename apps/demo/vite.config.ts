import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@zell/grid-core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@zell/grid-react': resolve(__dirname, '../../packages/react/src/index.tsx')
    }
  }
});
