"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { decideRewardAction } from "@/server/actions/parent-family";

export interface PendingWish {
  id: string;
  title: string;
  icon: string;
  cost: number;
  childName: string;
  childCoins: number;
  requestedAt: string;
}

export function ApprovalList({ items }: { items: PendingWish[] }) {
  const t = useT();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  if (!items.length) return <p className="text-sm font-semibold text-ink-soft">{t("parent.approvals.empty")}</p>;
  return (
    <ul className="divide-y divide-ink/5">
      {err && <li className="py-2 text-sm font-bold text-coral">{err}</li>}
      {items.map((w) => (
        <li key={w.id} className="flex flex-wrap items-center gap-3 py-3">
          <span className="text-3xl" aria-hidden>
            {w.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">{w.title}</p>
            <p className="text-xs font-semibold text-ink-soft">
              {t("parent.approvals.meta", { name: w.childName, cost: w.cost, coins: w.childCoins, date: t.date(new Date(w.requestedAt)) })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="mint"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await decideRewardAction(w.id, true);
                  setErr(r.ok ? null : r.error);
                })
              }
            >
              <Check className="size-4" /> {t("parent.approvals.approve")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await decideRewardAction(w.id, false);
                  setErr(r.ok ? null : r.error);
                })
              }
            >
              <X className="size-4" /> {t("parent.approvals.reject")}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
