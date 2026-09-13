import { useEffect, useState } from "react";

/**
 * Tracks browser connectivity.
 *
 * Starts as `true` (also during SSR/prerender) so the UI never flashes an
 * "offline" state before hydration.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}
