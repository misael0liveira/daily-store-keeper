import { registerPlugin } from "@capacitor/core";

export type VisionStatus = {
  ready: boolean;
  supported: boolean;
  busy: boolean;
  phase: "idle" | "downloading" | "verifying" | "loading" | "analyzing";
  bytes: number;
  totalBytes: number;
  ramBytes: number;
  freeBytes: number;
};

type ProductVisionPlugin = {
  getStatus(): Promise<VisionStatus>;
  downloadModel(): Promise<void>;
  analyze(options: { imageBase64: string }): Promise<{ text: string; model: string }>;
  cancel(): Promise<void>;
};

export const ProductVision = registerPlugin<ProductVisionPlugin>("ProductVision");
