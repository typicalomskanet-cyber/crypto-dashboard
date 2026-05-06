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
        name: "CryptoMiner 3D - Trading Simulator",
        short_name: "CryptoMiner",
        description:
          "3D crypto trading simulator with spot, futures, mining and your own exchange.",
        theme_color: "#0f0f23",
        background_color: "#0f0f23",
        display: "standalone",
        orientation: "any",
        start_url: "./",
        scope: "./",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2}"],
        globIgnores: ["**/*.map"],
        // External market APIs should always be live, not cached.
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.coingecko\.com\/.*$/,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^https:\/\/api\.binance\.com\/.*$/,
            handler: "NetworkOnly",
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
  build: {
    target: "es2020",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("three") || id.includes("@react-three")) return "three";
            if (id.includes("react") || id.includes("scheduler")) return "react";
            return "vendor";
          }
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 5173 },
});
