import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Chronicle of Devil Gods',
        short_name: 'CoDG',
        description:
          '2.5D MMO action-RPG prototype: five races, classes, crafting, gacha and city-building.',
        theme_color: '#0a0514',
        background_color: '#0a0514',
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        // Don't bother caching source maps offline.
        globIgnores: ['**/*.map'],
      },
    }),
  ],
  build: {
    target: 'es2020',
    minify: 'terser',
    cssCodeSplit: false,
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true,
        passes: 2,
      },
      format: { comments: false },
    },
    rollupOptions: {
      output: {
        // Split heavy deps so they cache independently and load in parallel.
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('pixi.js') || id.includes('@pixi')) return 'pixi';
            if (id.includes('react') || id.includes('scheduler')) return 'react';
            if (id.includes('zustand')) return 'state';
            return 'vendor';
          }
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  server: { host: true, port: 5174 },
  preview: { host: true, port: 5174 },
});
