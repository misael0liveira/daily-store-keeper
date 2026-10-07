import { registerPlugin } from "@capacitor/core";

export type PixNotificationPayment = {
  found: boolean;
  amount?: number;
  timestamp?: number;
  bank?: string;
  packageName?: string;
  notificationText?: string;
  monitorId?: string;
  method?: "pix" | "debito" | "credito";
};

export interface PixNotificationPlugin {
  isNotificationAccessGranted(): Promise<{ granted: boolean }>;
  openNotificationSettings(): Promise<void>;
  setExpectedAmount(options: {
    amount: number;
    method: "pix" | "debito" | "credito";
    monitorId: string;
  }): Promise<{ startedAt: number }>;
  clearExpectedAmount(options: { monitorId: string }): Promise<void>;
  getLastPayment(options: { monitorId: string }): Promise<PixNotificationPayment>;
  getStatus(): Promise<{ enabled: boolean; platform: string }>;
}

export const PixNotification = registerPlugin<PixNotificationPlugin>("PixNotification");
