import { Capacitor } from "@capacitor/core";
import type { Sale, Product } from "@/store/useStore";

// The Android APK is local-first: its data is persisted in the WebView's
// local storage and does not require Supabase. Cloud sync is opt-in on native
// builds (VITE_SYNC_ENABLED=true) and remains enabled by default on the web.
export const SYNC_ENABLED =
  import.meta.env["VITE_SYNC_ENABLED"] === "true" ||
  (!Capacitor.isNativePlatform() && import.meta.env["VITE_SYNC_ENABLED"] !== "false");

export type SyncResult = { status: "offline" | "done" | "error" | "no-backend"; synced: string[]; failed: string[]; pending?: number; error?: string };
export function pendingSales(sales: Sale[]): Sale[] { return sales.filter((sale) => sale.syncState !== "synced"); }
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  const key = "pdv-device-id"; let id = window.localStorage.getItem(key);
  if (!id) { id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`; window.localStorage.setItem(key, id); }
  return id;
}

const REMOTE_PAYMENT_METHODS: Record<Sale["method"], "cash" | "debit" | "credit" | "pix"> = { dinheiro: "cash", debito: "debit", credito: "credit", pix: "pix" };
function toRemotePaymentMethod(method: Sale["method"]): "cash" | "debit" | "credit" | "pix" {
  return REMOTE_PAYMENT_METHODS[method];
}

function errorMessage(error: unknown): string {
  if (!error) return "Erro desconhecido de sincronização";
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) return String((error as { message: unknown }).message);
  return String(error);
}

export async function syncPendingSales(sales: Sale[], products: Record<string, Product> = {}): Promise<SyncResult> {
  const pending = pendingSales(sales);
  if (!SYNC_ENABLED) return { status: "done", synced: [], failed: [], pending: pending.length };
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { status: "offline", synced: [], failed: pending.map((s) => s.id), pending: pending.length };

  // Keep Supabase out of the native runtime unless cloud sync was explicitly enabled.
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return { status: "error", synced: [], failed: pending.map((s) => s.id), error: errorMessage(authError) || "Usuário não autenticado" };

  try {
    const productRows = Object.values(products).map((p) => ({ user_id: auth.user.id, barcode: p.barcode || null, name: p.name, price: p.price, stock: p.stock, active: true }));
    if (productRows.length) {
      const { error } = await (supabase as any).from("products").upsert(productRows, { onConflict: "user_id,barcode" });
      if (error) throw error;
    }

    const synced: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    for (const sale of pending) {
      try {
        const { data: remoteSale, error: saleError } = await (supabase as any)
          .from("sales")
          .upsert({
            id: sale.id,
            user_id: auth.user.id,
            total: sale.total,
            payment_method: toRemotePaymentMethod(sale.method),
            sold_at: new Date(sale.timestamp).toISOString(),
            status: "completed",
            notes: `device:${sale.deviceId ?? getDeviceId()}`,
          }, { onConflict: "id" })
          .select("id")
          .single();
        if (saleError) throw saleError;

        const rows: any[] = [];
        for (const item of sale.items) {
          const { data: product, error: productError } = await (supabase as any)
            .from("products")
            .select("id,cost_price")
            .eq("user_id", auth.user.id)
            .eq("barcode", item.barcode)
            .maybeSingle();
          if (productError) throw productError;
          rows.push({
            sale_id: remoteSale.id,
            product_id: product?.id ?? null,
            product_name: item.name,
            quantity: item.qty,
            unit_price: item.price,
            unit_cost: product?.cost_price ?? 0,
          });
        }

        const { error: deleteItemsError } = await (supabase as any).from("sale_items").delete().eq("sale_id", sale.id);
        if (deleteItemsError) throw deleteItemsError;
        if (rows.length) {
          const { error: itemError } = await (supabase as any).from("sale_items").insert(rows);
          if (itemError) throw itemError;
        }

        const { error: deleteMovementsError } = await (supabase as any)
          .from("stock_movements")
          .delete()
          .eq("reference_id", sale.id)
          .eq("movement_type", "sale");
        if (deleteMovementsError) throw deleteMovementsError;

        for (const item of sale.items) {
          const { data: product, error: productError } = await (supabase as any)
            .from("products")
            .select("id")
            .eq("user_id", auth.user.id)
            .eq("barcode", item.barcode)
            .maybeSingle();
          if (productError) throw productError;
          if (product) {
            const { error: movementError } = await (supabase as any).from("stock_movements").insert({
              user_id: auth.user.id,
              product_id: product.id,
              quantity: -item.qty,
              movement_type: "sale",
              reference_id: sale.id,
            });
            if (movementError) throw movementError;
          }
        }

        synced.push(sale.id);
      } catch (error) {
        failed.push(sale.id);
        errors.push(`${sale.id}: ${errorMessage(error)}`);
      }
    }

    if (failed.length) {
      return {
        status: synced.length ? "done" : "error",
        synced,
        failed,
        pending: pending.length,
        error: errors.join(" | "),
      };
    }

    return { status: "done", synced, failed, pending: pending.length };
  } catch (error) {
    return { status: "error", synced: [], failed: pending.map((s) => s.id), pending: pending.length, error: errorMessage(error) };
  }
}
