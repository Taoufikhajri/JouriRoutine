/**
 * Tiny synthesized sound effects (Web Audio). No audio files, no autoplay:
 * sounds only ever play in response to a tap, at a gentle volume, and are
 * fully disabled when the parent turns sound off.
 */
export type SoundName = "complete" | "coin" | "badge" | "levelUp" | "chest" | "tap" | "undo";

const MELODIES: Record<SoundName, [number, number][]> = {
  // [frequency Hz, duration s]
  tap: [[660, 0.06]],
  undo: [[440, 0.08], [330, 0.12]],
  complete: [[523, 0.09], [659, 0.09], [784, 0.16]],
  coin: [[988, 0.07], [1319, 0.14]],
  badge: [[659, 0.1], [784, 0.1], [988, 0.1], [1319, 0.25]],
  levelUp: [[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.12], [784, 0.1], [1047, 0.35]],
  chest: [[392, 0.08], [523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.3]],
};

let ctx: AudioContext | null = null;

export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    let t = ctx.currentTime;
    for (const [freq, dur] of MELODIES[name]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      t += dur * 0.9;
    }
  } catch {
    /* audio is optional */
  }
}
