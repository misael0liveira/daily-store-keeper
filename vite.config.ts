import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

function copyServiceWorkerToClient() {
  return {
    name: "copy-sw-to-client",
    apply: "build" as const,
    closeBundle() {
      const dist = join(__dirname, "dist");
      const client = join(dist, "client");
      if (!existsSync(client)) return;
      try {
        const files = readdirSync(dist).filter(
          (f) => f === "sw.js" || /^workbox-.*\.js$/.test(f)
        );
        for (const f of files) {
          copyFileSync(join(dist, f), join(client, f));
        }
        if (files.length) {
          console.log(`[copy-sw-to-client] copied: ${files.join(", ")} -> dist/client`);
        }
      } catch (err) {
        console.warn("[copy-sw-to-client] failed:", err);
      }
    },
  };
}

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  tanstackStart: {
    server: { entry: "server" },
    prerender: { enabled: true, crawlLinks: false },
    pages: [
      { path: "/", prerender: { enabled: true } },
      { path: "/vender", prerender: { enabled: true } },
      { path: "/estoque", prerender: { enabled: true } },
      { path: "/mais", prerender: { enabled: true } },
      { path: "/codigos", prerender: { enabled: true } },
      { path: "/vendas", prerender: { enabled: true } },
      { path: "/vendas/configuracoes", prerender: { enabled: true } },
    ],
  },
  plugins: [
    copyServiceWorkerToClient(),
    tanstackStart(),
    tailwindcss(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    viteReact(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: { enabled: false },
      filename: "sw.js",
      manifestFilename: "manifest.webmanifest",
      manifest: {
        id: "/",
        name: "Mini Mercado PDV",
        short_name: "Mercado PDV",
        description: "Frente de caixa e gestão de estoque para mini mercado.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#3b82f6",
        background_color: "#fafbfc",
        lang: "pt-BR",
        prefer_related_applications: false,
        screenshots: [
          { src: "/screenshots/caixa.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "Caixa: leia códigos e finalize a venda" },
          { src: "/screenshots/estoque.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "Estoque: cadastre e busque produtos" },
        ],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globDirectory: "dist/client",
        globPatterns: ["**/*.{html,js,css,png,svg,ico,webmanifest,woff,woff2}"],
        globIgnores: ["**/_server/**", "**/screenshots/**"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: { cacheName: "pages", networkTimeoutSeconds: 4, expiration: { maxEntries: 50 } },
          },
          {
            urlPattern: ({ url, request }) =>
              url.origin === self.location.origin &&
              (request.destination === "script" || request.destination === "style" ||
                request.destination === "image" || request.destination === "font"),
            handler: "CacheFirst",
            options: {
              cacheName: "assets",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
