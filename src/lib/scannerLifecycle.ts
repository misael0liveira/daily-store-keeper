type RunningScanner = {
  isScanning: boolean;
  stop(): Promise<void>;
  clear(): void;
};

/** Wait for camera acquisition before stopping it, including failed starts. */
export async function closeScannerAfterStart(
  scanner: RunningScanner,
  starting: Promise<void>,
  stopTracks: () => void,
): Promise<void> {
  try {
    await starting;
  } catch {
    // A failed start can still leave partially acquired camera resources.
  }
  try {
    if (scanner.isScanning) await scanner.stop();
  } catch {
    // Release the underlying tracks even if the scanner cannot stop cleanly.
  } finally {
    stopTracks();
    try {
      scanner.clear();
    } catch {
      // The scanner's DOM may already have been removed by React.
    }
  }
}
