"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button, SubmitButton } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useT } from "@/i18n/client";
import { deleteRewardAction, saveRewardAction, toggleRewardAction } from "@/server/actions/parent-family";
import { IconField, Toggle } from "./routines/fields";

interface R {
  id: string;
  title: string;
  icon: string;
  cost: number;
  isActive: boolean;
}

export function RewardManager({ rewards }: { rewards: R[] }) {
  const t = useT();
  const [editing, setEditing] = useState<R | "new" | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <Button size="sm" onClick={() => setEditing("new")}>
        <Plus className="size-4" /> {t("parent.rewards.newReward")}
      </Button>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rewards.map((r) => (
          <li key={r.id} className={`flex items-center gap-3 rounded-2xl border-2 border-ink/5 p-3 ${r.isActive ? "" : "opacity-50"}`}>
            <span className="text-3xl" aria-hidden>
              {r.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{r.title}</p>
              <p className="text-sm font-semibold text-ink-soft">🪙 {r.cost}</p>
            </div>
            <Toggle checked={r.isActive} label={t("parent.rewards.available", { name: r.title })} disabled={pending} onChange={() => start(() => toggleRewardAction(r.id))} />
            <button type="button" className="rounded-lg p-2 hover:bg-ink/5" aria-label={t("parent.routines.editTask", { name: r.title })} onClick={() => setEditing(r)}>
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-ink/5"
              aria-label={t("parent.routines.deleteTask", { name: r.title })}
              disabled={pending}
              onClick={() => confirm(t("parent.rewards.confirmDelete", { name: r.title })) && start(() => deleteRewardAction(r.id))}
            >
              <Trash2 className="size-4 text-coral" />
            </button>
          </li>
        ))}
      </ul>
      {editing && <RewardEditor reward={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function RewardEditor({ reward, onClose }: { reward?: R; onClose: () => void }) {
  const t = useT();
  const [state, action] = useActionState(saveRewardAction, {});
  useEffect(() => {
    if (state.ok) onClose();
  }, [state, onClose]);
  const fe = state.fieldErrors ?? {};
  return (
    <Modal open onClose={onClose} title={reward ? t("parent.rewards.editReward") : t("parent.rewards.newReward")}>
      <form action={action} className="space-y-4">
        {state.error && <Alert>{state.error}</Alert>}
        {reward && <input type="hidden" name="rewardId" value={reward.id} />}
        <Field label={t("parent.rewards.reward")} htmlFor="rw-title" error={fe.title}>
          <Input id="rw-title" name="title" defaultValue={reward?.title} required maxLength={50} placeholder={t("parent.rewards.rewardPh")} />
        </Field>
        <IconField name="icon" defaultValue={reward?.icon ?? "🎁"} error={fe.icon} />
        <Field label={t("parent.rewards.cost")} htmlFor="rw-cost" error={fe.cost}>
          <Input id="rw-cost" name="cost" type="number" min={1} max={10000} defaultValue={reward?.cost ?? 50} required />
        </Field>
        <SubmitButton className="w-full">{t("parent.rewards.saveReward")}</SubmitButton>
      </form>
    </Modal>
  );
}
