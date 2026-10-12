import { isNativeApp } from "@/lib/platform";

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");
const SW_URL = `${BASE_PATH}/sw.js`;

function isBlockedContext(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  if (isNativeApp()) return true;

  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }

  const { hostname, search } = window.location;
  if (new URLSearchParams(search).get("sw") === "off") return true;
  if (hostname.startsWith("id-preview--") || hostname.startsWith("preview--")) {
    return true;
  }
  const blockedHosts = ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"];
  if (blockedHosts.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
    return true;
  }
  return false;
}

async function unregisterAppWorkers() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL ?? r.waiting?.scriptURL ?? r.installing?.scriptURL ?? "";
          return url.endsWith("/sw.js");
        })
        .map((r) => r.unregister()),
    );
  } catch {
    // ignore
  }
}

const OFFLINE_PAGES = [
  "/",
  "/vender",
  "/estoque",
  "/mais",
  "/vendas",
  "/vendas/configuracoes",
  "/gestao",
];

async function warmAssetsCache() {
  if (!("caches" in window) || navigator.onLine === false) return;
  try {
    await document.fonts.ready;
    const cache = await caches.open("assets-v1");
    const urls = new Set([
      ...Array.from(
        document.querySelectorAll<HTMLLinkElement>(
          'link[rel="stylesheet"], link[rel="modulepreload"]',
        ),
        (link) => link.href,
      ),
      ...performance.getEntriesByType("resource").map((entry) => entry.name),
    ]);
    await Promise.allSettled(
      Array.from(urls, async (value) => {
        const url = new URL(value, location.href);
        if (
          url.origin !== location.origin ||
          !/\.(?:js|css|woff2?|png|svg|ico|webp)(?:$)/i.test(url.pathname) ||
          (await cache.match(url.href))
        )
          return;
        const response = await fetch(url.href, { credentials: "same-origin" });
        if (response.ok) await cache.put(url.href, response);
      }),
    );
  } catch {
    // Initial assets may load before the worker controls the page; warming is best effort.
  }
}

async function warmPagesCache() {
  if (!("caches" in window)) return;
  if (navigator.onLine === false) return;
  try {
    const cache = await caches.open("pages");
    await Promise.allSettled(
      OFFLINE_PAGES.map(async (path) => {
        const url = `${BASE_PATH}${path}`;
        if (navigator.onLine === false || (await cache.match(url))) return;
        const response = await fetch(url, {
          cache: "reload",
          credentials: "same-origin",
        });
        if (response.ok) await cache.put(url, response.clone());
      }),
    );
  } catch {
    // offline or storage full — the app still works with what is cached
  }
}

export function registerPWA() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  if (isBlockedContext()) {
    void unregisterAppWorkers();
    return;
  }

  const doRegister = () => {
    void navigator.serviceWorker
      .register(SW_URL, { scope: `${BASE_PATH}/` })
      .then((registration) => {
        void registration.update();
        void warmPagesCache();
        void warmAssetsCache();
        window.addEventListener("online", () => void warmPagesCache());
      })
      .catch(() => {
        // registration failed — app still works online
      });
  };
  if (document.readyState === "complete") {
    doRegister();
  } else {
    window.addEventListener("load", doRegister, { once: true });
  }
}
