// Optional, synthesized feedback. No audio is created until an explicit call.
export async function playTone() {
  const Audio = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!Audio) throw new Error('Audio preview is unavailable in this browser.');
  const ctx = new Audio();
  try {
    await ctx.resume();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.setValueAtTime(880, now + 0.065);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.17);
    await new Promise((resolve) => (osc.onended = resolve));
  } finally {
    await ctx.close();
  }
}
export function pulse(element) {
  if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  return element.animate?.([{ opacity: 1 }, { opacity: 0.55 }, { opacity: 1 }], {
    duration: 180,
    iterations: 1,
  });
}
