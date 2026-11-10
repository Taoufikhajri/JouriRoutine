"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/brand/mascot";
import { useT } from "@/i18n/client";
import { useGame } from "./game-provider";
import type { GameEvent } from "./events";

const CONFETTI = ["⭐", "✨", "🌟", "💫", "🎉", "🩷", "💜", "💛"];
const COLORS = ["#ffc93c", "#ff7a8a", "#7c5cff", "#5fd3a5", "#7cc7ff", "#ffb3d9"];

function Confetti({ count = 26 }: { count?: number }) {
  const reduce = useReducedMotion();
  const [bits] = useState(() =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 520,
        y: -Math.random() * 380 - 60,
        r: (Math.random() - 0.5) * 540,
        s: 0.7 + Math.random() * 0.9,
        emoji: i % 3 === 0 ? CONFETTI[i % CONFETTI.length] : null,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.15,
      })),
  );
  if (reduce) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      {bits.map((b) => (
        <motion.span
          key={b.id}
          className="absolute"
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 420], opacity: [1, 1, 0], scale: b.s, rotate: b.r }}
          transition={{ duration: 1.6, delay: b.delay, ease: "easeOut" }}
        >
          {b.emoji ? (
            <span className="text-2xl">{b.emoji}</span>
          ) : (
            <span className="block h-3 w-2 rounded-sm" style={{ background: b.color }} />
          )}
        </motion.span>
      ))}
    </div>
  );
}

/** Coins that fly from the centre of the screen into the wallet in the HUD. */
function FlyingCoins({ count }: { count: number }) {
  const reduce = useReducedMotion();
  // Only ever rendered on the client after a tap, so reading the DOM here is safe.
  const [target] = useState<{ x: number; y: number } | null>(() => {
    const el = typeof document !== "undefined" ? document.getElementById("hud-wallet") : null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - window.innerWidth / 2, y: r.top + r.height / 2 - window.innerHeight / 2 };
  });
  if (reduce || !target) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center" aria-hidden>
      {Array.from({ length: Math.min(6, Math.max(2, count)) }, (_, i) => (
        <motion.span
          key={i}
          className="absolute text-3xl"
          initial={{ x: (i - 2) * 18, y: 40, scale: 1, opacity: 1 }}
          animate={{ x: target.x, y: target.y, scale: 0.5, opacity: [1, 1, 0.2] }}
          transition={{ duration: 0.9, delay: 0.35 + i * 0.08, ease: [0.5, 0, 0.75, 0] }}
        >
          🪙
        </motion.span>
      ))}
    </div>
  );
}

function TaskBurst({ e, onDone }: { e: Extract<GameEvent, { type: "task" }>; onDone: () => void }) {
  const { childName, play } = useGame();
  const t = useT();
  const [cheer] = useState(() => {
    const list = t.messages.child.cheers;
    return list[Math.floor(Math.random() * list.length)];
  });
  useEffect(() => {
    play("complete");
    const c = setTimeout(() => play("coin"), 700);
    const d = setTimeout(onDone, 1900);
    return () => {
      clearTimeout(c);
      clearTimeout(d);
    };
  }, [onDone, play]);
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
      role="status"
      aria-live="assertive"
    >
      <Confetti />
      <FlyingCoins count={e.coins} />
      <motion.div
        className="card-magic relative flex flex-col items-center px-8 py-6 text-center"
        initial={{ scale: 0.4, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 16 }}
      >
        <span className="text-6xl" aria-hidden>
          {e.icon}
        </span>
        <p className="mt-1 font-display text-3xl font-extrabold text-magic-dark">{cheer}</p>
        <p className="font-display text-xl font-bold">{t("child.greatJob", { name: childName })}</p>
        <div className="mt-3 flex gap-3">
          <motion.span
            className="rounded-full bg-sun/30 px-4 py-1.5 font-display text-xl font-extrabold"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            ⭐ +{e.xp} {t("common.xp")}
          </motion.span>
          {e.coins > 0 && (
            <motion.span
              className="rounded-full bg-[#ffe9a8] px-4 py-1.5 font-display text-xl font-extrabold"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              🪙 +{e.coins}
            </motion.span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function BigMoment({ onDone, children, sound }: { onDone: () => void; children: React.ReactNode; sound: Parameters<ReturnType<typeof useGame>["play"]>[0] }) {
  const { play } = useGame();
  const t = useT();
  useEffect(() => play(sound), [play, sound]);
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
    >
      <Confetti count={40} />
      <motion.div
        className="card-magic relative flex w-full max-w-sm flex-col items-center gap-3 px-6 py-8 text-center"
        initial={{ scale: 0.3, y: 60 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 15 }}
      >
        {children}
        <Button size="xl" variant="sun" pop className="mt-2 w-full" onClick={onDone} autoFocus>
          {t("child.yay")}
        </Button>
      </motion.div>
    </motion.div>
  );
}

function ChestReveal({ e, onDone }: { e: Extract<GameEvent, { type: "chest" }>; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const { play } = useGame();
  const t = useT();
  useEffect(() => {
    const id = setTimeout(() => {
      setOpen(true);
      play("chest");
    }, 1100);
    return () => clearTimeout(id);
  }, [play]);
  const golden = e.chestType === "GOLDEN";
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={golden ? t("child.chest.golden") : t("child.chest.small")}
    >
      {open && <Confetti count={44} />}
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <motion.div
          className="relative text-[8rem] leading-none drop-shadow-2xl"
          animate={open ? { scale: [1, 1.3, 1], rotate: 0 } : { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.05, 1] }}
          transition={open ? { duration: 0.5 } : { duration: 0.55, repeat: Infinity }}
        >
          {open ? "✨" : golden ? "👑" : "🎁"}
          {open && (
            <motion.span
              className="absolute inset-0 -z-10 rounded-full"
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.9 }}
              style={{ background: "radial-gradient(circle, #fff6c9 0%, transparent 70%)" }}
            />
          )}
        </motion.div>
        <AnimatePresence>
          {open && (
            <motion.div className="card-magic mt-4 w-full p-6" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <p className="font-display text-xl font-bold text-ink-soft">{t("child.chest.youGot")}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-3 font-display text-2xl font-extrabold">
                <span className="rounded-full bg-[#ffe9a8] px-4 py-1.5">🪙 +{e.coins}</span>
                <span className="rounded-full bg-sun/30 px-4 py-1.5">⭐ +{e.xp} {t("common.xp")}</span>
              </div>
              {e.item && (
                <p className="mt-3 font-display text-xl font-bold">
                  <span className="text-4xl">{e.item.emoji}</span> {t.item(e.item.key, e.item.name)}!
                </p>
              )}
              <Button size="xl" variant="sun" pop className="mt-4 w-full" onClick={onDone} autoFocus>
                {t("child.yay")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function CelebrationLayer({ item, onDone }: { item: { id: number; e: GameEvent } | null; onDone: () => void }) {
  const t = useT();
  const event = item?.e ?? null;
  const k = item?.id ?? 0;
  return (
    <AnimatePresence mode="wait">
      {event?.type === "task" && <TaskBurst key={k} e={event} onDone={onDone} />}
      {event?.type === "levelUp" && (
        <BigMoment key={k} onDone={onDone} sound="levelUp">
          <motion.span className="text-8xl" animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 1.4 }} aria-hidden>
            {event.icon}
          </motion.span>
          <p className="font-display text-4xl font-extrabold text-magic-dark">{t("child.levelUp")}</p>
          <p className="font-display text-2xl font-bold">
            {t("child.levelLine", { level: event.level, title: t.level(event.level) })}
          </p>
        </BigMoment>
      )}
      {event?.type === "badge" && (
        <BigMoment key={k} onDone={onDone} sound="badge">
          <p className="font-display text-xl font-bold text-ink-soft">{t("child.newBadge")}</p>
          <motion.div
            className="flex size-32 items-center justify-center rounded-full bg-gradient-to-br from-[#fff3b0] to-sun text-7xl animate-glow"
            initial={{ rotateY: 180 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.8 }}
            aria-hidden
          >
            {event.icon}
          </motion.div>
          <p className="font-display text-3xl font-extrabold">{t.badge(event.key, event).title}</p>
          <p className="text-ink-soft">{t.badge(event.key, event).description}</p>
        </BigMoment>
      )}
      {event?.type === "perfect" && (
        <BigMoment key={k} onDone={onDone} sound="badge">
          <Mascot className="size-28 animate-bob" mood="wow" />
          <p className="font-display text-4xl font-extrabold text-magic-dark">{t("child.perfectDay")}</p>
          <p className="font-display text-xl font-bold">{t("child.perfectBonus", { count: event.bonus })}</p>
        </BigMoment>
      )}
      {event?.type === "streak" && (
        <BigMoment key={k} onDone={onDone} sound="badge">
          <span className="text-8xl" aria-hidden>
            🔥
          </span>
          <p className="font-display text-3xl font-extrabold">{t("child.streakDays", { count: event.count })}</p>
          <p className="font-display text-lg font-bold text-ink-soft">{t("child.streakMilestone", { count: event.count })}</p>
        </BigMoment>
      )}
      {event?.type === "chest" && <ChestReveal key={k} e={event} onDone={onDone} />}
    </AnimatePresence>
  );
}
