import type { Sale, Product } from "@/store/useStore";
import { supabase } from "@/integrations/supabase/client";

export const SYNC_ENABLED = true;
export type SyncResult = { status: "offline" | "done" | "error"; synced: string[]; failed: string[]; pending?: number; error?: string };
export function pendingSales(sales: Sale[]): Sale[] { return sales.filter((sale) => sale.syncState !== "synced"); }
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  const key = "pdv-device-id"; let id = window.localStorage.getItem(key);
  if (!id) { id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`; window.localStorage.setItem(key, id); }
  return id;
}

export async function syncPendingSales(sales: Sale[], products: Record<string, Product> = {}): Promise<SyncResult> {
  const pending = pendingSales(sales);
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { status: "offline", synced: [], failed: pending.map((s) => s.id), pending: pending.length };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: "error", synced: [], failed: pending.map((s) => s.id), error: "Usuário não autenticado" };

  try {
    const productRows = Object.values(products).map((p) => ({ user_id: auth.user.id, barcode: p.barcode || null, name: p.name, price: p.price, stock: p.stock, active: true }));
    if (productRows.length) {
      const { error } = await (supabase as any).from("products").upsert(productRows, { onConflict: "user_id,barcode" });
      if (error) throw error;
    }

    const synced: string[] = []; const failed: string[] = [];
    for (const sale of pending) {
      try {
        const { data: remoteSale, error: saleError } = await (supabase as any).from("sales").upsert({ id: sale.id, user_id: auth.user.id, total: sale.total, payment_method: sale.method, sold_at: new Date(sale.timestamp).toISOString(), status: "completed", notes: `device:${sale.deviceId ?? getDeviceId()}` }, { onConflict: "id" }).select("id").single();
        if (saleError) throw saleError;
        const rows = [] as any[];
        for (const item of sale.items) {
          const { data: product } = await (supabase as any).from("products").select("id,cost_price").eq("user_id", auth.user.id).eq("barcode", item.barcode).maybeSingle();
          rows.push({ sale_id: remoteSale.id, product_id: product?.id ?? null, product_name: item.name, quantity: item.qty, unit_price: item.price, unit_cost: product?.cost_price ?? 0 });
        }
        if (rows.length) {
          await (supabase as any).from("sale_items").delete().eq("sale_id", sale.id);
          const { error: itemError } = await (supabase as any).from("sale_items").insert(rows);
          if (itemError) throw itemError;
        }
        for (const item of sale.items) {
          const { data: product } = await (supabase as any).from("products").select("id,stock").eq("user_id", auth.user.id).eq("barcode", item.barcode).maybeSingle();
          if (product) await (supabase as any).from("stock_movements").insert({ user_id: auth.user.id, product_id: product.id, quantity: -item.qty, movement_type: "sale", reference_id: sale.id });
        }
        synced.push(sale.id);
      } catch { failed.push(sale.id); }
    }
    return { status: "done", synced, failed, pending: pending.length };
  } catch (error) {
    return { status: "error", synced: [], failed: pending.map((s) => s.id), pending: pending.length, error: error instanceof Error ? error.message : "Erro de sincronização" };
  }
}
