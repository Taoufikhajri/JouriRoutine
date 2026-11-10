"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Alert } from "@/components/ui/form";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { requestRewardAction } from "@/server/actions/child";
import { useGame } from "./game/game-provider";

interface RewardItem {
  id: string;
  title: string;
  icon: string;
  cost: number;
}
interface Wish {
  id: string;
  title: string;
  icon: string;
  cost: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export function RewardShop({ rewards, wallet, wishes }: { rewards: RewardItem[]; wallet: { coins: number; reserved: number; available: number }; wishes: Wish[] }) {
  const { play } = useGame();
  const t = useT();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const redeem = async (r: RewardItem) => {
    setBusy(r.id);
    setMsg(null);
    const res = await requestRewardAction(r.id);
    setBusy(null);
    if (res.ok) {
      play("coin");
      setMsg({ tone: "success", text: `${r.icon} ${t("child.shop.sent")}` });
    } else setMsg({ tone: "error", text: res.error });
  };

  const pending = wishes.filter((w) => w.status === "PENDING");
  const history = wishes.filter((w) => w.status !== "PENDING");

  return (
    <div className="space-y-5">
      <section className="card-magic flex items-center gap-4 bg-gradient-to-br from-[#fff8dc] to-[#ffe9a8] p-5">
        <motion.span className="text-6xl" animate={{ rotateY: [0, 360] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2 }} aria-hidden>
          🪙
        </motion.span>
        <div>
          <h1 className="font-display text-2xl font-extrabold">{t("child.shop.title")}</h1>
          <p className="font-display text-3xl font-extrabold">
            {wallet.available} <span className="text-lg">{t("common.coins")}</span>
          </p>
          {wallet.reserved > 0 && <p className="text-sm font-bold text-ink-soft">{t("child.shop.reserved", { count: wallet.reserved })}</p>}
        </div>
      </section>

      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      {pending.length > 0 && (
        <section className="card-magic p-4">
          <h2 className="font-display text-lg font-extrabold">⏳ {t("child.shop.waiting")}</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {pending.map((w) => (
              <li key={w.id} className="flex items-center gap-2 rounded-2xl bg-lilac/20 px-3 py-2 font-bold">
                <span className="text-2xl" aria-hidden>
                  {w.icon}
                </span>
                {w.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      {rewards.length === 0 ? (
        <div className="card-magic p-6 text-center font-bold">{t("child.shop.empty")}</div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {rewards.map((r) => {
            const can = wallet.available >= r.cost;
            const need = r.cost - wallet.available;
            return (
              <li key={r.id} className={cn("card-magic flex flex-col items-center p-4 text-center", !can && "opacity-90")}>
                <span className={cn("text-6xl", can && "animate-float")} aria-hidden>
                  {r.icon}
                </span>
                <h3 className="mt-2 font-display text-lg font-bold leading-tight">{r.title}</h3>
                <p className="font-display text-xl font-extrabold">🪙 {r.cost}</p>
                {can ? (
                  <button
                    type="button"
                    onClick={() => redeem(r)}
                    disabled={busy === r.id}
                    className="btn-pop mt-2 w-full rounded-2xl bg-sun py-2.5 font-display text-lg font-extrabold disabled:opacity-60"
                  >
                    {t("child.shop.redeem")}
                  </button>
                ) : (
                  <div className="mt-2 w-full">
                    <div className="h-2.5 overflow-hidden rounded-full bg-ink/10">
                      <div className="h-full rounded-full bg-sun" style={{ width: `${Math.max(4, (wallet.available / r.cost) * 100)}%` }} />
                    </div>
                    <p className="mt-1 text-xs font-bold text-ink-soft">{t("child.shop.needMore", { count: need })}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {history.length > 0 && (
        <section className="card-magic p-4">
          <h2 className="font-display text-lg font-extrabold">{t("child.shop.myRewards")}</h2>
          <ul className="mt-2 space-y-1.5">
            {history.map((w) => (
              <li key={w.id} className="flex items-center gap-2 font-semibold">
                <span aria-hidden>{w.icon}</span>
                <span className="flex-1">{w.title}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", w.status === "APPROVED" ? "bg-mint/25 text-mint-dark" : "bg-ink/5 text-ink-soft")}>
                  {w.status === "APPROVED" ? `✓ ${t("child.shop.approved")}` : t("child.shop.notApproved")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
