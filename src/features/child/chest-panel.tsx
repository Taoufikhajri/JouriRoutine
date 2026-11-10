"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { openChestAction } from "@/server/actions/child";
import { useGame } from "./game/game-provider";

interface ChestState {
  ready: boolean;
  opened: boolean;
  remaining: number;
}

export function ChestPanel({ small, golden }: { small: ChestState; golden: ChestState }) {
  const t = useT();
  return (
    <section aria-label={t("child.chest.region")} className="grid grid-cols-2 gap-3">
      <Chest type="SMALL" state={small} />
      <Chest type="GOLDEN" state={golden} />
    </section>
  );
}

function Chest({ type, state }: { type: "SMALL" | "GOLDEN"; state: ChestState }) {
  const { celebrate, play } = useGame();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const golden = type === "GOLDEN";
  const label = golden ? t("child.chest.golden") : t("child.chest.small");

  const open = async () => {
    setBusy(true);
    play("tap");
    const res = await openChestAction(type);
    setBusy(false);
    if (!res.ok) return setErr(res.error);
    celebrate([{ type: "chest", chestType: type, coins: res.data.coins, xp: res.data.xp, item: res.data.item }]);
    if (res.data.levelUp) celebrate([{ type: "levelUp", ...res.data.levelUp }]);
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center rounded-[1.75rem] border-[3px] p-3 text-center",
        golden ? "border-sun/70 bg-gradient-to-b from-[#fff8dc] to-[#ffe9a8]" : "border-white bg-white/90",
        state.ready && !state.opened && "animate-glow",
      )}
    >
      <span className={cn("text-5xl", state.ready && !state.opened && "animate-wiggle", !state.ready && "grayscale-[60%] opacity-70")} aria-hidden>
        {state.opened ? "✨" : golden ? "👑" : "🎁"}
      </span>
      <p className="mt-1 font-display font-extrabold">{label}</p>
      {state.opened ? (
        <p className="text-xs font-bold text-mint-dark">✓ {t("child.chest.opened")}</p>
      ) : state.ready ? (
        <button
          type="button"
          onClick={open}
          disabled={busy}
          className="btn-pop mt-1 rounded-2xl bg-sun px-4 py-1.5 font-display text-lg font-extrabold text-ink disabled:opacity-60"
        >
          {t("child.chest.open")}
        </button>
      ) : (
        <p className="text-xs font-bold text-ink-soft">
          🔒 {t(golden ? "child.chest.lockedGolden" : "child.chest.lockedSmall", { count: state.remaining })}
        </p>
      )}
      {err && <p className="mt-1 text-xs font-bold text-coral">{err}</p>}
    </div>
  );
}
