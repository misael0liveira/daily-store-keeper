import { registerPlugin } from "@capacitor/core";

export type PixNotificationPayment = {
  found: boolean;
  amount?: number;
  timestamp?: number;
  bank?: string;
  packageName?: string;
  notificationText?: string;
};

export interface PixNotificationPlugin {
  isNotificationAccessGranted(): Promise<{ granted: boolean }>;
  openNotificationSettings(): Promise<void>;
  setExpectedAmount(options: { amount: number }): Promise<void>;
  clearExpectedAmount(): Promise<void>;
  getLastPayment(): Promise<PixNotificationPayment>;
  getStatus(): Promise<{ enabled: boolean; platform: string }>;
}

export const PixNotification = registerPlugin<PixNotificationPlugin>("PixNotification");
