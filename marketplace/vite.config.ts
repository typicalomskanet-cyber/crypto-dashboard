import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png", "favicon.svg"],
      manifest: {
        name: "Yantach Shop",
        short_name: "Yantach",
        description:
          "Yantach Shop — каталог товаров с переходом к покупке у партнёров.",
        theme_color: "#0050e0",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "any",
        start_url: "./",
        scope: "./",
        lang: "ru",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2,jpg,jpeg}"],
        globIgnores: ["**/*.map"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            // Remote product images: cache-first with 7-day TTL.
            urlPattern: /^https:\/\/(images\.unsplash\.com|avatars\.mds\.yandex\.net|.*\.cdn\.yandex\.net)\/.*$/,
            handler: "CacheFirst",
            options: {
              cacheName: "product-images-v1",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: { port: 5174 },
});
