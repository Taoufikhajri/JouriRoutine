"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { playSound, type SoundName } from "@/lib/sound";
import { CelebrationLayer } from "./celebrations";
import type { GameEvent } from "./events";

interface GameCtx {
  childName: string;
  soundOn: boolean;
  play: (s: SoundName) => void;
  celebrate: (events: GameEvent[]) => void;
}

const Ctx = createContext<GameCtx | null>(null);

export function useGame() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGame must be used inside <GameProvider>");
  return c;
}

export function GameProvider({ children, childName, soundOn }: { children: ReactNode; childName: string; soundOn: boolean }) {
  const [queue, setQueue] = useState<{ id: number; e: GameEvent }[]>([]);
  const seq = useRef(0);
  const play = useCallback((s: SoundName) => playSound(s, soundOn), [soundOn]);
  const celebrate = useCallback((events: GameEvent[]) => setQueue((q) => [...q, ...events.map((e) => ({ id: ++seq.current, e }))]), []);
  const next = useCallback(() => setQueue((q) => q.slice(1)), []);
  const value = useMemo(() => ({ childName, soundOn, play, celebrate }), [childName, soundOn, play, celebrate]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <CelebrationLayer item={queue[0] ?? null} onDone={next} />
    </Ctx.Provider>
  );
}
