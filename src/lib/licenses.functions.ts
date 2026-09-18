import { createServerFn } from "@tanstack/react-start";

type LicenseRow = {
  id: string;
  code: string;
  active: boolean;
  device_id: string | null;
  activated_at: string | null;
  created_at: string;
};

function checkPassword(password: string) {
  const expected = process.env["ADMIN_LICENSE_PASSWORD"];
  if (!expected) throw new Error("Senha de administrador não configurada.");
  if (password !== expected) throw new Error("Senha incorreta.");
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode() {
  const pick = (n: number) =>
    Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
  return `MK-${pick(4)}-${pick(4)}`;
}

export const listLicenseCodes = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => ({ password: String(input?.password ?? "") }))
  .handler(async ({ data }): Promise<LicenseRow[]> => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("license_codes")
      .select("id, code, active, device_id, activated_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (rows ?? []) as LicenseRow[];
  });

export const createLicenseCode = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => ({ password: String(input?.password ?? "") }))
  .handler(async ({ data }): Promise<LicenseRow> => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    for (let attempt = 0; attempt < 6; attempt++) {
      const code = randomCode();
      const { data: row, error } = await supabaseAdmin
        .from("license_codes")
        .insert({ code })
        .select("id, code, active, device_id, activated_at, created_at")
        .single();
      if (!error && row) return row as LicenseRow;
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    }
    throw new Error("Não foi possível gerar um código novo. Tente de novo.");
  });

export const updateLicenseCode = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string; id: string; active?: boolean; unbind?: boolean }) => ({
    password: String(input?.password ?? ""),
    id: String(input?.id ?? ""),
    active: typeof input?.active === "boolean" ? input.active : undefined,
    unbind: input?.unbind === true,
  }))
  .handler(async ({ data }): Promise<LicenseRow> => {
    checkPassword(data.password);
    if (!data.id) throw new Error("Código inválido.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (typeof data.active === "boolean") patch["active"] = data.active;
    if (data.unbind) {
      patch["device_id"] = null;
      patch["activated_at"] = null;
    }
    if (!Object.keys(patch).length) throw new Error("Nada para alterar.");
    const { data: row, error } = await supabaseAdmin
      .from("license_codes")
      .update(patch)
      .eq("id", data.id)
      .select("id, code, active, device_id, activated_at, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row as LicenseRow;
  });
