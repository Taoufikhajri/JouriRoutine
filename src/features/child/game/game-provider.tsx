"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { isMuted, playSound, setMuted, setSoundVolume, subscribeMuted, type SoundName } from "@/lib/sound";
import { CelebrationLayer } from "./celebrations";
import type { GameEvent } from "./events";

interface GameCtx {
  childName: string;
  soundOn: boolean;
  muted: boolean;
  toggleMute: () => void;
  play: (s: SoundName) => void;
  celebrate: (events: GameEvent[]) => void;
}

const Ctx = createContext<GameCtx | null>(null);

export function useGame() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGame must be used inside <GameProvider>");
  return c;
}

export function GameProvider({ children, childName, soundOn, volume }: { children: ReactNode; childName: string; soundOn: boolean; volume: number }) {
  const [queue, setQueue] = useState<{ id: number; e: GameEvent }[]>([]);
  const seq = useRef(0);
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => false);
  useEffect(() => setSoundVolume(volume / 100), [volume]);
  const play = useCallback((s: SoundName) => playSound(s, soundOn), [soundOn]);
  const toggleMute = useCallback(() => {
    const next = !isMuted();
    setMuted(next);
    if (!next) playSound("equip", soundOn);
  }, [soundOn]);
  const celebrate = useCallback((events: GameEvent[]) => setQueue((q) => [...q, ...events.map((e) => ({ id: ++seq.current, e }))]), []);
  const next = useCallback(() => setQueue((q) => q.slice(1)), []);
  const value = useMemo(() => ({ childName, soundOn, muted, toggleMute, play, celebrate }), [childName, soundOn, muted, toggleMute, play, celebrate]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <CelebrationLayer item={queue[0] ?? null} onDone={next} />
    </Ctx.Provider>
  );
}
