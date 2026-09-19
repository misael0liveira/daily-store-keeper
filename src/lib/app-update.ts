import { App } from "@capacitor/app";
import { registerPlugin } from "@capacitor/core";

type AppUpdaterPlugin = {
  installApk(options: { url: string }): Promise<{ started: boolean; needsPermission?: boolean }>;
};

const AppUpdater = registerPlugin<AppUpdaterPlugin>("AppUpdater");

const LATEST_RELEASE_API =
  "https://api.github.com/repos/misael0liveira/daily-store-keeper/releases/latest";

export type UpdateInfo = {
  version: string;
  downloadUrl: string;
  releaseUrl: string;
  notes: string;
};

function compareVersions(a: string, b: string) {
  const pa = a.replace(/^v/i, "").split(".").map(Number);
  const pb = b.replace(/^v/i, "").split(".").map(Number);
  for (let i = 0; i < 3; i += 1) {
    const av = Number.isFinite(pa[i]) ? pa[i] : 0;
    const bv = Number.isFinite(pb[i]) ? pb[i] : 0;
    if (av !== bv) return av > bv ? 1 : -1;
  }
  return 0;
}

export async function checkForAppUpdate(): Promise<UpdateInfo | null> {
  if (typeof window === "undefined" || window.location.protocol !== "capacitor:") {
    return null;
  }

  const current = await App.getInfo();
  const response = await fetch(LATEST_RELEASE_API, {
    headers: { Accept: "application/vnd.github+json" },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const release = (await response.json()) as {
    tag_name?: string;
    name?: string;
    body?: string;
    html_url?: string;
    assets?: Array<{
      name?: string;
      browser_download_url?: string;
    }>;
  };

  const versionMatch = release.body?.match(/(?:^|\n)version\s*=\s*([^\n]+)/i);
  const version = versionMatch?.[1]?.trim() || release.name?.match(/\d+\.\d+\.\d+/)?.[0];
  const asset = release.assets?.find((item) => item.name === "Mini-Market-PDV.apk");

  if (!version || !asset?.browser_download_url) return null;
  if (compareVersions(version, current.version) <= 0) return null;

  return {
    version,
    downloadUrl: asset.browser_download_url,
    releaseUrl: release.html_url || "https://github.com/misael0liveira/daily-store-keeper/releases/latest",
    notes: release.body?.replace(/(?:^|\n)version\s*=\s*[^\n]*/i, "").trim() || "Nova versão disponível.",
  };
}

export async function installAppUpdate(url: string) {
  return AppUpdater.installApk({ url });
}
