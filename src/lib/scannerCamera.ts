type FocusCapabilities = MediaTrackCapabilities & { focusMode?: string[] };
type FocusConstraints = MediaTrackConstraintSet & { focusMode: string };

type FocusableScanner = {
  getRunningTrackCapabilities: () => MediaTrackCapabilities;
  applyVideoConstraints: (constraints: MediaTrackConstraints) => Promise<void>;
};

/** Optional camera tuning must never stop barcode reading on unsupported hardware. */
export async function configureScannerFocus(scanner: FocusableScanner): Promise<boolean> {
  try {
    const capabilities = scanner.getRunningTrackCapabilities() as FocusCapabilities;
    if (!capabilities.focusMode?.includes("continuous")) return false;
    const focus: FocusConstraints = { focusMode: "continuous" };
    await scanner.applyVideoConstraints({ advanced: [focus] });
    return true;
  } catch {
    // WebViews and fixed-focus cameras can reject optional camera controls.
    return false;
  }
}
