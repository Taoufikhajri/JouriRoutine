"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/form";
import { useGame } from "@/features/child/game/game-provider";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { buyItemAction, chooseAvatarAction, toggleItemAction } from "@/server/actions/child";
import { AVATARS } from "@/server/catalog/avatars";
import { AvatarView, type EquippedLook } from "./avatar-view";

export interface StudioItem {
  id: string;
  key: string;
  name: string;
  emoji: string;
  slot: "HAT" | "ACCESSORY" | "COMPANION" | "FRAME";
  cost: number;
  lockedBy: string | null; // badge title
  owned: boolean;
  equipped: boolean;
}

const SLOTS = [
  { slot: "HAT", label: "child.profile.hat" },
  { slot: "ACCESSORY", label: "child.profile.accessory" },
  { slot: "COMPANION", label: "child.profile.companion" },
  { slot: "FRAME", label: "child.profile.frame" },
] as const;

export function AvatarStudio({ avatarKey, items, coins }: { avatarKey: string; items: StudioItem[]; coins: number }) {
  const { play } = useGame();
  const t = useT();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const look: EquippedLook = Object.fromEntries(items.filter((i) => i.equipped).map((i) => [i.slot, i.emoji]));

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setErr(null);
      play("tap");
      const r = await fn();
      if (!r.ok) setErr(r.error ?? t("common.somethingWrong"));
    });

  return (
    <section className="card-magic space-y-5 p-4 sm:p-6">
      <div className="flex flex-col items-center">
        <AvatarView avatarKey={avatarKey} look={look} size="xl" />
      </div>
      {err && <Alert>{err}</Alert>}

      <div>
        <h2 className="mb-2 font-display text-lg font-extrabold">{t("child.profile.avatar")}</h2>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {AVATARS.map((a) => (
            <button
              key={a.key}
              type="button"
              disabled={pending}
              onClick={() => run(() => chooseAvatarAction(a.key))}
              aria-pressed={a.key === avatarKey}
              className={cn("shrink-0 rounded-3xl p-1.5 ring-4", a.key === avatarKey ? "ring-magic" : "ring-transparent hover:ring-lilac/50")}
              aria-label={t.avatar(a.key, a.name)}
            >
              <AvatarView avatarKey={a.key} size="sm" />
            </button>
          ))}
        </div>
      </div>

      {SLOTS.map(({ slot, label }) => (
        <div key={slot}>
          <h2 className="mb-2 font-display text-lg font-extrabold">{t(label)}</h2>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {items
              .filter((i) => i.slot === slot)
              .map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    disabled={pending || (!i.owned && (!!i.lockedBy || coins < i.cost))}
                    onClick={() => run(() => (i.owned ? toggleItemAction(i.id) : buyItemAction(i.id)))}
                    className={cn(
                      "flex w-full flex-col items-center rounded-2xl border-[3px] p-2 text-center transition disabled:cursor-not-allowed",
                      i.equipped ? "border-magic bg-lilac/20" : "border-ink/5 bg-white hover:border-lilac",
                      !i.owned && "opacity-75",
                    )}
                    aria-pressed={i.equipped}
                  >
                    <span className={cn("text-4xl", !i.owned && i.lockedBy && "grayscale")} aria-hidden>
                      {i.emoji}
                    </span>
                    <span className="text-xs font-bold leading-tight">{t.item(i.key, i.name)}</span>
                    <span className="mt-0.5 text-[11px] font-extrabold text-ink-soft">
                      {i.owned
                        ? i.equipped
                          ? `✓ ${t("child.profile.equipped")}`
                          : t("child.profile.equip")
                        : i.lockedBy
                          ? `🔒 ${t("child.profile.lockedBy", { badge: i.lockedBy })}`
                          : `🪙 ${i.cost}`}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
