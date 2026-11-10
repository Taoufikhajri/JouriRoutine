"use client";

import Link from "next/link";
import { animate, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AvatarView, type EquippedLook } from "@/features/avatar/avatar-view";
import { levelForXp } from "@/config/game";
import { useT } from "@/i18n/client";

function useCountUp(value: number) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) {
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, { duration: 0.9, delay: 0.6, onUpdate: (v) => setShown(Math.round(v)) });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduce]);
  return reduce ? value : shown;
}

/** Top game HUD: avatar, level + XP bar, streak and coin wallet. */
export function Hud({ xp, coins, streak, avatarKey, look }: { xp: number; coins: number; streak: number; avatarKey: string; look: EquippedLook }) {
  const t = useT();
  const lv = levelForXp(xp);
  const shownXp = useCountUp(xp);
  const shownCoins = useCountUp(coins);
  const pct = Math.round(lv.progress * 100);

  return (
    <header className="sticky top-0 z-30 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-3xl bg-white/90 p-2 pe-3 shadow-soft backdrop-blur">
        <Link href="/child/profile" aria-label={t("child.myProfile")}>
          <AvatarView avatarKey={avatarKey} look={look} size="sm" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-display text-sm font-extrabold sm:text-base">
              <span aria-hidden>{lv.icon}</span> {t("child.levelShort", { level: lv.level })}
              <span className="hidden sm:inline"> · {t.level(lv.level)}</span>
            </p>
            <p className="shrink-0 text-xs font-bold text-ink-soft">
              {shownXp}
              <span className="hidden min-[400px]:inline"> / {lv.next ? lv.nextXp : t("child.max")}</span> {t("common.xp")}
            </p>
          </div>
          <div
            className="mt-1 h-3.5 overflow-hidden rounded-full bg-ink/10"
            role="progressbar"
            aria-label={t("child.levelProgress")}
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-lilac via-magic to-coral"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, delay: 0.6 }}
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className="flex items-center gap-1 rounded-2xl bg-[#ffe6d6] px-2.5 py-1.5 font-display font-extrabold"
            aria-label={t("child.streakAria", { count: streak })}
            title={t("child.streakAria", { count: streak })}
          >
            🔥 {streak}
          </span>
          <motion.span
            id="hud-wallet"
            key={coins}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1, 1.25, 1] }}
            transition={{ duration: 1.4, times: [0, 0.6, 0.8, 1] }}
            className="flex items-center gap-1 rounded-2xl bg-[#fff1b8] px-2.5 py-1.5 font-display font-extrabold"
            aria-label={t("child.coinsAria", { count: coins })}
          >
            🪙 {shownCoins}
          </motion.span>
        </div>
      </div>
    </header>
  );
}
