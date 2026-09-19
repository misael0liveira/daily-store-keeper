import { App } from "@capacitor/app";
import { registerPlugin } from "@capacitor/core";

type AppUpdaterPlugin = {
  installApk(options: { url: string }): Promise<{ started: boolean; needsPermission?: boolean }>;
};

const AppUpdater = registerPlugin<AppUpdaterPlugin>("AppUpdater");

const LATEST_RELEASE_API =
  "https://api.github.com/repos/misael0liveira/daily-store-keeper/releases/latest";
const LATEST_APK_URL =
  "https://github.com/misael0liveira/daily-store-keeper/releases/latest/download/Mini-Market-PDV.apk";

export type UpdateInfo = {
  version: string;
  downloadUrl: string;
  releaseUrl: string;
  notes: string;
};

function compareVersions(a: string, b: string) {
  const pa = a.replace(/^v/i, "").split(".").map((value) => Number.parseInt(value, 10));
  const pb = b.replace(/^v/i, "").split(".").map((value) => Number.parseInt(value, 10));

  for (let i = 0; i < 3; i += 1) {
    const av = Number.isFinite(pa[i]) ? pa[i] : 0;
    const bv = Number.isFinite(pb[i]) ? pb[i] : 0;
    if (av !== bv) return av > bv ? 1 : -1;
  }

  return 0;
}

function extractVersion(release: {
  tag_name?: string;
  name?: string;
  body?: string;
}) {
  const candidates = [
    release.body?.match(/(?:^|\n)version\s*=\s*v?([0-9]+\.[0-9]+\.[0-9]+)/i)?.[1],
    release.name?.match(/v?([0-9]+\.[0-9]+\.[0-9]+)/i)?.[1],
    release.tag_name?.match(/^v?([0-9]+\.[0-9]+\.[0-9]+)$/i)?.[1],
  ];

  return candidates.find(Boolean) ?? null;
}

export async function checkForAppUpdate(): Promise<UpdateInfo | null> {
  if (typeof window === "undefined" || window.location.protocol !== "capacitor:") {
    return null;
  }

  const current = await App.getInfo();

  const response = await fetch(`${LATEST_RELEASE_API}?t=${Date.now()}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub release check failed: HTTP ${response.status}`);
  }

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

  const version = extractVersion(release);

  // Prefer the fixed latest-download URL. GitHub guarantees this URL points
  // to the asset with this exact name in the latest published release.
  const asset = release.assets?.find((item) => item.name === "Mini-Market-PDV.apk");
  const downloadUrl = asset?.browser_download_url || LATEST_APK_URL;

  if (!version) {
    throw new Error("GitHub release has no valid semantic version.");
  }

  if (compareVersions(version, current.version) <= 0) {
    return null;
  }

  return {
    version,
    downloadUrl,
    releaseUrl:
      release.html_url ||
      "https://github.com/misael0liveira/daily-store-keeper/releases/latest",
    notes:
      release.body?.replace(/(?:^|\n)version\s*=\s*v?[0-9]+\.[0-9]+\.[0-9]+/i, "").trim() ||
      "Nova versão disponível.",
  };
}

export async function installAppUpdate(url: string) {
  return AppUpdater.installApk({ url });
}
