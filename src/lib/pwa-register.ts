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

export function registerPWA() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  if (isBlockedContext()) {
    void unregisterAppWorkers();
    return;
  }

  const doRegister = () => {
    void navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {
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
