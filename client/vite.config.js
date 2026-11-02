import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Seed catalogue shared with the API — used as an offline/read-only fallback.
      '@data': fileURLToPath(new URL('../server/src/data', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // In development the Express API runs on :5000 — proxy keeps everything same-origin (cookies just work).
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
  build: {
    target: 'es2022',
    // Rollup's automatic chunking keeps page-specific libraries (zod, forms, QR codes) in lazy route
    // chunks. Hand-written vendor chunks are avoided on purpose: they can create circular chunk
    // imports that evaluate a library before React itself.
    chunkSizeWarningLimit: 800,
  },
});
