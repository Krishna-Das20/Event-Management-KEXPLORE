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
    rollupOptions: {
      output: {
        // Long-lived vendor chunks cache well across deploys; page-specific libs (zod, forms, QR) stay lazy.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/](react|react-dom|scheduler|react-router)[\\/]/.test(id)) return 'react';
          if (/[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'motion';
          if (/[\\/](@radix-ui|@floating-ui|react-remove-scroll|cmdk|sonner)[\\/]/.test(id)) return 'ui';
        },
      },
    },
  },
});
