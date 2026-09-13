let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** Cria/retoma o AudioContext — chamar dentro de um gesto do usuário. */
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }
}

function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  volume: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration);
}

export function beep(success = true) {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    if (success) {
      // bip duplo agudo, estilo leitor de caixa
      tone(ctx, 1568, now, 0.09, 0.25);
      tone(ctx, 1568, now + 0.12, 0.09, 0.25);
    } else {
      tone(ctx, 220, now, 0.25, 0.25);
    }
  } catch {
    // audio blocked — ignore
  }
}

export function vibrate(pattern: number | number[] = 80) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
