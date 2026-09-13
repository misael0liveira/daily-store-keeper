import { isNativeApp } from "@/lib/platform";

const SW_URL = "/sw.js";

function isBlockedContext(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  // Inside the Android app the files are already local; no service worker.
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
  const blockedHosts = [
    "lovableproject.com",
    "lovableproject-dev.com",
    "beta.lovable.dev",
  ];
  if (
    blockedHosts.some((h) => hostname === h || hostname.endsWith(`.${h}`))
  ) {
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
          const url =
            r.active?.scriptURL ??
            r.waiting?.scriptURL ??
            r.installing?.scriptURL ??
            "";
          return url.endsWith(SW_URL);
        })
        .map((r) => r.unregister())
    );
  } catch {
    // ignore
  }
}

/**
 * Screens that must open with no internet. The generated service worker keeps
 * navigations network-first, so we pre-fill its "pages" cache while online.
 * Nothing is ever deleted here — only refreshed with the newest HTML.
 */
const OFFLINE_PAGES = [
  "/",
  "/vender",
  "/estoque",
  "/mais",
  "/vendas",
  "/vendas/configuracoes",
];

async function warmPagesCache() {
  if (!("caches" in window)) return;
  if (navigator.onLine === false) return;
  try {
    const cache = await caches.open("pages");
    await Promise.allSettled(
      OFFLINE_PAGES.map(async (path) => {
        const response = await fetch(path, {
          cache: "reload",
          credentials: "same-origin",
        });
        if (response.ok) await cache.put(path, response.clone());
      })
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
      .register(SW_URL, { scope: "/" })
      .then((registration) => {
        // Never leave the app stuck on an old version.
        void registration.update();
        void warmPagesCache();
        window.addEventListener("online", () => void warmPagesCache());
      })
      .catch(() => {
        // registration failed — app still works online
      });
  };
  // If hydration finishes after the load event, the listener would never fire.
  if (document.readyState === "complete") {
    doRegister();
  } else {
    window.addEventListener("load", doRegister, { once: true });
  }
}
