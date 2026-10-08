import { App } from "@capacitor/app";
import { SystemBars, SystemBarsStyle } from "@capacitor/core";
import { useEffect } from "react";
import { isNativeApp } from "@/lib/platform";
import { useStore } from "@/store/useStore";

/** Mounted after the white startup screen, so its icons stay dark during opening. */
export function NativeThemeBars() {
  const theme = useStore((state) => state.theme);
  useEffect(() => {
    if (!isNativeApp()) return;
    let active = true;
    const apply = () => {
      if (active) {
        // Capacitor's Dark style means light icons on a dark application surface.
        void SystemBars.setStyle({
          style: theme === "dark" ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
        }).catch(() => {});
      }
    };
    apply();
    const listener = App.addListener("resume", apply).catch(() => null);
    return () => {
      active = false;
      void listener.then((handle) => handle?.remove()).catch(() => {});
    };
  }, [theme]);
  return null;
}
