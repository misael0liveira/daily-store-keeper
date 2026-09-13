/**
 * Sync layer (isolated).
 *
 * This app is currently 100% local-first: products, stock, sales and settings
 * live in this device's storage only. There is NO server yet, so this module
 * deliberately does not send anything anywhere — it only reports what would be
 * pending, and gives a single place to plug a real backend in later.
 *
 * To enable real syncing later:
 *   1. set SYNC_ENABLED to true (or read a config flag);
 *   2. implement `pushSale` against the real endpoint (idempotent on sale.id);
 *   3. mark synced sales through `markSalesSynced` in the store.
 */

import type { Sale } from "@/store/useStore";

export const SYNC_ENABLED = false;

export type SyncResult =
  | { status: "no-backend"; pending: number }
  | { status: "offline"; pending: number }
  | { status: "done"; synced: string[]; failed: string[] };

/** Sales still living only on this device. */
export function pendingSales(sales: Sale[]): Sale[] {
  return sales.filter((sale) => sale.syncState !== "synced");
}

/** Stable per-device id, useful to namespace sales once a server exists. */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  const key = "pdv-device-id";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(key, id);
  }
  return id;
}

/**
 * Attempts a sync run. Never throws and never mutates local data, so a failed
 * attempt can always be retried safely.
 */
export async function syncPendingSales(sales: Sale[]): Promise<SyncResult> {
  const pending = pendingSales(sales);
  if (!SYNC_ENABLED) return { status: "no-backend", pending: pending.length };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { status: "offline", pending: pending.length };
  }

  const synced: string[] = [];
  const failed: string[] = [];
  for (const sale of pending) {
    try {
      await pushSale(sale);
      synced.push(sale.id);
    } catch {
      failed.push(sale.id);
    }
  }
  return { status: "done", synced, failed };
}

/**
 * Placeholder for the future server call. The sale id is generated locally and
 * never reused, so the server side must treat it as an idempotency key
 * (upsert by id) — that is what keeps retries from duplicating a sale.
 */
async function pushSale(_sale: Sale): Promise<void> {
  throw new Error("No backend configured for sync yet.");
}
