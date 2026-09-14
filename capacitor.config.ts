import type { CapacitorConfig } from "@capacitor/cli";

const isAdminBuild = process.env.ADMIN_BUILD === "1";

const config: CapacitorConfig = {
  appId: isAdminBuild ? "app.minimarket.adm" : "app.minimarket.pos",
  appName: isAdminBuild ? "Mini Mercado ADM" : "Mini Market POS",
  webDir: "dist/client",
  backgroundColor: "#fafbfc",
  android: {
    allowMixedContent: false,
    backgroundColor: "#fafbfc",
  },
  plugins: {
    BarcodeScanning: {
      googleBarcodeScannerModuleInstallState: false,
    },
  },
};

export default config;
