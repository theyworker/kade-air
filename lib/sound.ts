// Tiny WebAudio blips + haptics for the delivery beats. All calls are
// best-effort: autoplay policies or missing APIs just mean silence.

let ac: AudioContext | null = null;

function audio(): AudioContext {
  if (!ac) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ac = new Ctor();
  }
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  return ac;
}

export function blip(freq: number) {
  try {
    const ctx = audio();
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.3);
  } catch {}
}

export function ding() {
  try {
    const ctx = audio();
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.14, t + i * 0.07 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.55);
      o.connect(g).connect(ctx.destination);
      o.start(t + i * 0.07);
      o.stop(t + i * 0.07 + 0.6);
    });
  } catch {}
}

export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate && navigator.vibrate(pattern);
  } catch {}
}
