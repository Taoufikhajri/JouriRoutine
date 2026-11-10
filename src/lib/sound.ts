/**
 * Magical sound effects, synthesized live with the Web Audio API.
 *
 * - No audio files to download, license or cache.
 * - Never autoplays: every sound follows a tap (browsers also enforce this).
 * - Parents can switch sound off and pick a volume; kids can mute their device.
 */
export type SoundName =
  | "tap"
  | "pop"
  | "nav"
  | "pin"
  | "pinError"
  | "complete"
  | "coin"
  | "undo"
  | "badge"
  | "levelUp"
  | "perfect"
  | "streak"
  | "chestShake"
  | "chest"
  | "wish"
  | "equip"
  | "buy"
  | "welcome";

interface Graph {
  ctx: AudioContext;
  master: GainNode;
  echo: GainNode;
}

let graph: Graph | null = null;
let volume = 0.6;

function audio(): Graph | null {
  if (typeof window === "undefined") return null;
  if (!graph) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    // master → soft limiter → speakers
    const master = ctx.createGain();
    master.gain.value = volume;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.ratio.value = 6;
    master.connect(limiter).connect(ctx.destination);
    // a small "fairy echo" bus that gives notes a magical tail
    const echo = ctx.createGain();
    echo.gain.value = 0.9;
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.16;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 3200;
    echo.connect(delay);
    delay.connect(tone).connect(feedback).connect(delay);
    tone.connect(master);
    graph = { ctx, master, echo };
  }
  if (graph.ctx.state === "suspended") void graph.ctx.resume();
  return graph;
}

/** Master volume 0–1 (parent setting). */
export function setSoundVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (graph) graph.master.gain.setTargetAtTime(volume, graph.ctx.currentTime, 0.02);
}

// ───────────── building blocks ─────────────

interface NoteOpts {
  type?: OscillatorType;
  vol?: number;
  attack?: number;
  /** Extra partials [frequency ratio, relative gain] for bell / chime colour. */
  partials?: [number, number][];
  /** Share sent to the echo bus. */
  wet?: number;
  glideTo?: number;
}

function note(g: Graph, freq: number, at: number, dur: number, o: NoteOpts = {}) {
  const { ctx, master, echo } = g;
  const t = ctx.currentTime + at;
  const env = ctx.createGain();
  const peak = o.vol ?? 0.25;
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(peak, t + (o.attack ?? 0.006));
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  env.connect(master);
  if (o.wet) {
    const send = ctx.createGain();
    send.gain.value = o.wet;
    env.connect(send).connect(echo);
  }
  for (const [ratio, gain] of [[1, 1] as [number, number], ...(o.partials ?? [])]) {
    const osc = ctx.createOscillator();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(freq * ratio, t);
    if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo * ratio, t + dur);
    const pg = ctx.createGain();
    pg.gain.value = gain;
    osc.connect(pg).connect(env);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }
}

/** Bell / glockenspiel colour. */
const BELL: NoteOpts = { partials: [[2, 0.35], [3.01, 0.12], [4.2, 0.06]], wet: 0.35 };

function bell(g: Graph, freq: number, at: number, dur = 0.5, vol = 0.22) {
  note(g, freq, at, dur, { ...BELL, vol });
}

/** Filtered noise: whooshes, shimmer and wooden knocks. */
function noise(g: Graph, at: number, dur: number, from: number, to: number, vol = 0.12, type: BiquadFilterType = "bandpass") {
  const { ctx, master } = g;
  const t = ctx.currentTime + at;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(env).connect(master);
  src.start(t);
  src.stop(t + dur);
}

/** A sprinkle of tiny high bells — the "magic dust" sound. */
function sparkle(g: Graph, at: number, count = 6, spread = 0.05) {
  const scale = [2093, 2349, 2637, 3136, 3520, 4186]; // C7 pentatonic-ish
  for (let i = 0; i < count; i++) {
    bell(g, scale[Math.floor(Math.random() * scale.length)], at + i * spread + Math.random() * 0.02, 0.35, 0.07);
  }
}

// Note frequencies
const N = {
  G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659, F5: 698, G5: 784, A5: 880, B5: 988,
  C6: 1047, D6: 1175, E6: 1319, G6: 1568, A6: 1760, C7: 2093,
};

// ───────────── the sounds ─────────────

const RECIPES: Record<SoundName, (g: Graph) => void> = {
  // Soft bubble pop for ordinary buttons
  tap: (g) => note(g, 520, 0, 0.09, { vol: 0.22, glideTo: 980 }),
  pop: (g) => note(g, 360, 0, 0.11, { vol: 0.25, glideTo: 820, wet: 0.1 }),
  // Bottom navigation: tiny swoosh + chime
  nav: (g) => {
    noise(g, 0, 0.14, 900, 3200, 0.05);
    bell(g, N.A5, 0.03, 0.25, 0.1);
  },
  // PIN key: light wooden tick
  pin: (g) => note(g, 1250, 0, 0.05, { type: "triangle", vol: 0.14 }),
  // Wrong PIN: a friendly "oh-oh", never a buzzer
  pinError: (g) => {
    note(g, N.E5, 0, 0.16, { type: "triangle", vol: 0.18 });
    note(g, N.C5, 0.16, 0.26, { type: "triangle", vol: 0.18, glideTo: 494 });
  },
  // Mission complete: bright rising chime + magic dust
  complete: (g) => {
    [N.C6, N.E6, N.G6].forEach((f, i) => bell(g, f, i * 0.075, 0.45, 0.2));
    bell(g, N.C7, 0.23, 0.7, 0.18);
    sparkle(g, 0.3, 5);
  },
  // Coin: the classic two-step "cling!"
  coin: (g) => {
    note(g, N.B5, 0, 0.08, { type: "square", vol: 0.07 });
    note(g, N.E6, 0.075, 0.38, { type: "square", vol: 0.07, wet: 0.2 });
    bell(g, N.E6 * 2, 0.075, 0.3, 0.05);
  },
  // Undo: gentle downward slide
  undo: (g) => note(g, 620, 0, 0.22, { type: "triangle", vol: 0.16, glideTo: 300 }),
  // Badge: glockenspiel arpeggio with shimmer
  badge: (g) => {
    [N.G5, N.B5, N.D6, N.G6].forEach((f, i) => bell(g, f, i * 0.1, 0.6, 0.2));
    noise(g, 0.25, 0.6, 3000, 9000, 0.04, "highpass");
    sparkle(g, 0.45, 7);
  },
  // Level up: a little fanfare and a held chord
  levelUp: (g) => {
    const run = [N.C5, N.E5, N.G5, N.C6];
    run.forEach((f, i) => note(g, f, i * 0.11, 0.16, { type: "triangle", vol: 0.2, partials: [[2, 0.2]] }));
    [N.C6, N.E6, N.G6].forEach((f) => note(g, f, 0.48, 0.9, { type: "triangle", vol: 0.13, partials: [[2, 0.25]], wet: 0.3 }));
    note(g, N.C5 / 2, 0.48, 0.9, { vol: 0.16 });
    sparkle(g, 0.6, 9, 0.06);
  },
  // Perfect day: magical scale up to a sparkling chord
  perfect: (g) => {
    [N.C5, N.D5, N.E5, N.G5, N.A5, N.C6, N.D6, N.E6].forEach((f, i) => bell(g, f, i * 0.06, 0.4, 0.14));
    [N.C6, N.E6, N.G6, N.C7].forEach((f) => bell(g, f, 0.55, 1.2, 0.12));
    noise(g, 0.5, 0.9, 2500, 10000, 0.05, "highpass");
    sparkle(g, 0.7, 10, 0.07);
  },
  // Streak: warm "whoosh" like a little flame, then a rising fifth
  streak: (g) => {
    noise(g, 0, 0.45, 300, 2400, 0.1, "lowpass");
    note(g, N.G4, 0.2, 0.3, { type: "triangle", vol: 0.18, partials: [[2, 0.3]] });
    note(g, N.D5, 0.42, 0.6, { type: "triangle", vol: 0.18, partials: [[2, 0.3]], wet: 0.3 });
    sparkle(g, 0.6, 5);
  },
  // Chest wobbling: three wooden knocks
  chestShake: (g) => {
    [0, 0.18, 0.36].forEach((t) => {
      note(g, 140, t, 0.12, { type: "triangle", vol: 0.28, glideTo: 90 });
      noise(g, t, 0.06, 600, 300, 0.08);
    });
  },
  // Chest opening: whoosh up, then a burst of treasure
  chest: (g) => {
    noise(g, 0, 0.35, 400, 6000, 0.09);
    [N.C6, N.E6, N.G6, N.C7].forEach((f, i) => bell(g, f, 0.25 + i * 0.05, 0.9, 0.16));
    setTimeout(() => RECIPES.coin(g), 300);
    sparkle(g, 0.4, 12, 0.05);
  },
  // Wish sent to Mom & Dad: soft magic-wand swirl
  wish: (g) => {
    note(g, N.C6, 0, 0.5, { vol: 0.1, glideTo: N.C7, wet: 0.4 });
    sparkle(g, 0.1, 8, 0.05);
  },
  // Wearing a new hat or friend
  equip: (g) => {
    bell(g, N.E6, 0, 0.3, 0.14);
    bell(g, N.A6, 0.07, 0.4, 0.12);
    sparkle(g, 0.12, 3);
  },
  buy: (g) => {
    RECIPES.coin(g);
    setTimeout(() => RECIPES.equip(g), 180);
  },
  // First visit: a gentle "once upon a time" motif
  welcome: (g) => {
    [N.C5, N.E5, N.G5, N.A5, N.G5, N.C6].forEach((f, i) => bell(g, f, i * 0.16, 0.6, 0.17));
    sparkle(g, 0.9, 8, 0.06);
  },
};

export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled || isMuted()) return;
  try {
    const g = audio();
    if (g) RECIPES[name](g);
  } catch {
    /* audio is optional */
  }
}

// ───────────── per-device mute (kid button) ─────────────

const MUTE_KEY = "lsa_muted";
const listeners = new Set<() => void>();
let mutedCache: boolean | null = null;

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  if (mutedCache === null) {
    try {
      mutedCache = window.localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      mutedCache = false;
    }
  }
  return mutedCache;
}

export function setMuted(m: boolean) {
  mutedCache = m;
  try {
    window.localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  } catch {
    /* private mode — keep in memory */
  }
  listeners.forEach((l) => l());
}

export function subscribeMuted(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
