import { supabase } from "@/integrations/supabase/client";

const LICENSE_STORAGE_KEY = "pdv-license";
const INSTALL_ID_KEY = "pdv-install-id";

export type LicenseActivation = {
  ok: boolean;
  license_id?: string;
  client_name?: string | null;
  activated_at?: string;
  error?: string;
};

function randomId(prefix: string) {
  const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
  return `${prefix}-${uuid}`;
}

export function getInstallId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(INSTALL_ID_KEY);
  if (!id) {
    id = randomId("install");
    window.localStorage.setItem(INSTALL_ID_KEY, id);
  }
  return id;
}

export function getStoredLicense(): LicenseActivation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LICENSE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LicenseActivation) : null;
  } catch {
    return null;
  }
}

export function isLicensed(): boolean {
  return getStoredLicense()?.ok === true;
}

export async function activateLicense(code: string): Promise<LicenseActivation> {
  const normalizedCode = code.trim().toUpperCase();
  const deviceId = getInstallId();

  if (normalizedCode.length < 8) {
    return { ok: false, error: "invalid_code" };
  }

  try {
    const { data, error } = await supabase.rpc("activate_device_license", {
      p_code: normalizedCode,
      p_device_id: deviceId,
    });

    if (error) {
      console.error("[License activation]", error);
      return { ok: false, error: "connection_error" };
    }

    const result = data as LicenseActivation;
    if (result?.ok) {
      window.localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(result));
    }
    return result ?? { ok: false, error: "activation_error" };
  } catch (error) {
    console.error("[License activation]", error);
    return { ok: false, error: "connection_error" };
  }
}

export function clearStoredLicense() {
  if (typeof window !== "undefined") window.localStorage.removeItem(LICENSE_STORAGE_KEY);
}
