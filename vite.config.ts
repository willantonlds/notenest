import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Configure the public React app and same-origin API proxy. */
export default defineConfig({
  plugins: [react()],
  root: 'frontend',
  build: { outDir: '../dist/frontend', emptyOutDir: false },
  server: {
    host: '127.0.0.1',
    proxy: { '/api': 'http://127.0.0.1:3000' },
  },
});
