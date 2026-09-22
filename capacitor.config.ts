import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.minimarket.pos",
  appName: "Mercadinho União",
  // Static output of `bun run build` (client assets + prerendered HTML).
  webDir: "dist/client",
  backgroundColor: "#f5f8fb",
  android: {
    allowMixedContent: false,
    backgroundColor: "#f5f8fb",
  },
  plugins: {
    BarcodeScanning: {
      // Barcode model is bundled with the app instead of downloaded at runtime,
      // so scanning works offline right after install.
      googleBarcodeScannerModuleInstallState: false,
    },
  },
};

export default config;
