import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Netlify Functions (tienda: pagos, productos, webhook)
      '/.netlify/functions': {
        target: 'http://localhost:9999',
        changeOrigin: true,
      },
      // Admin API — reescribe /admin-api/* a /.netlify/functions/admin-api/*
      // En produccion el redirect de netlify.toml hace lo mismo
      '/admin-api': {
        target: 'http://localhost:9999',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/admin-api/, '/.netlify/functions/admin-api'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
