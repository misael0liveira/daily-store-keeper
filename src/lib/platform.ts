/**
 * Platform helpers.
 *
 * The web build (site + PWA) and the Capacitor Android build share the same
 * bundle, so we detect at runtime which one is running.
 */

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (
    window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean; platform?: string };
    }
  ).Capacitor;
  if (!cap) return false;
  if (typeof cap.isNativePlatform === "function") {
    try {
      return cap.isNativePlatform();
    } catch {
      return false;
    }
  }
  return cap.platform === "android" || cap.platform === "ios";
}
