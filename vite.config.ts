// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

// vite-plugin-pwa emits sw.js/workbox into the SSR build outDir (dist/).
// The published static files live in dist/client/, so copy them over.
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
          console.log(
            `[copy-sw-to-client] copied: ${files.join(", ")} -> dist/client`
          );
        }
      } catch (err) {
        console.warn("[copy-sw-to-client] failed:", err);
      }
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      copyServiceWorkerToClient(),
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
          description:
            "Frente de caixa e gestão de estoque para mini mercado.",
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait",
          theme_color: "#3b82f6",
          background_color: "#fafbfc",
          lang: "pt-BR",
          prefer_related_applications: false,
          screenshots: [
            {
              src: "/screenshots/caixa.png",
              sizes: "780x1688",
              type: "image/png",
              form_factor: "narrow",
              label: "Caixa: leia códigos e finalize a venda",
            },
            {
              src: "/screenshots/estoque.png",
              sizes: "780x1688",
              type: "image/png",
              form_factor: "narrow",
              label: "Estoque: cadastre e busque produtos",
            },
          ],
          icons: [
            {
              src: "/icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/icon-maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,woff2}"],
          navigateFallback: "/",
          navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "pages",
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 50 },
              },
            },
            {
              urlPattern: ({ url, request }) =>
                url.origin === self.location.origin &&
                (request.destination === "script" ||
                  request.destination === "style" ||
                  request.destination === "image" ||
                  request.destination === "font"),
              handler: "CacheFirst",
              options: {
                cacheName: "assets",
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
            {
              urlPattern: ({ url }) =>
                url.origin === "https://fonts.googleapis.com" ||
                url.origin === "https://fonts.gstatic.com",
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts",
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  },
});
