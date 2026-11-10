"use client";

import { useActionState, useEffect, useState } from "react";
import { SubmitButton } from "@/components/ui/button";
import { Alert, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { CATEGORY_META, DIFFICULTY_PRESETS } from "@/config/game";
import { useT } from "@/i18n/client";
import { EVERY_DAY } from "@/lib/days-mask";
import { saveRoutineAction, saveTaskAction } from "@/server/actions/parent-routines";
import { DaysField, IconField } from "./fields";
import type { BuilderRoutine, BuilderTask } from "./types";

export function RoutineEditor({ open, onClose, childId, routine }: { open: boolean; onClose: () => void; childId: string; routine?: BuilderRoutine }) {
  const t = useT();
  const [state, action] = useActionState(saveRoutineAction, {});
  useEffect(() => {
    if (state.ok) onClose();
  }, [state, onClose]);
  const fe = state.fieldErrors ?? {};
  return (
    <Modal open={open} onClose={onClose} title={routine ? t("parent.routines.editor.editRoutine") : t("parent.routines.editor.newRoutine")}>
      <form action={action} className="space-y-4">
        {state.error && <Alert>{state.error}</Alert>}
        <input type="hidden" name="childId" value={childId} />
        {routine && <input type="hidden" name="routineId" value={routine.id} />}
        <Field label={t("parent.routines.editor.name")} htmlFor="r-name" error={fe.name}>
          <Input id="r-name" name="name" defaultValue={routine?.name} required maxLength={40} />
        </Field>
        <IconField name="icon" defaultValue={routine?.icon ?? "⭐"} error={fe.icon} />
        <Field label={t("parent.routines.editor.category")} htmlFor="r-cat">
          <Select id="r-cat" name="category" defaultValue={routine?.category ?? "CUSTOM"}>
            {Object.entries(CATEGORY_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.icon} {t.category(k)}
              </option>
            ))}
          </Select>
        </Field>
        <DaysField defaultMask={routine?.daysMask ?? EVERY_DAY} error={fe.days} />
        <SubmitButton className="w-full">{t("parent.routines.editor.saveRoutine")}</SubmitButton>
      </form>
    </Modal>
  );
}

export function TaskEditor({ open, onClose, routineId, task }: { open: boolean; onClose: () => void; routineId: string; task?: BuilderTask }) {
  const t = useT();
  const [state, action] = useActionState(saveTaskAction, {});
  const [kind, setKind] = useState(task?.kind ?? "GENERAL");
  const [xp, setXp] = useState(task?.xp ?? DIFFICULTY_PRESETS.NORMAL.xp);
  const [coins, setCoins] = useState(task?.coins ?? DIFFICULTY_PRESETS.NORMAL.coins);
  useEffect(() => {
    if (state.ok) onClose();
  }, [state, onClose]);
  const fe = state.fieldErrors ?? {};

  return (
    <Modal open={open} onClose={onClose} title={task ? t("parent.routines.editor.editMission") : t("parent.routines.editor.newMission")}>
      <form action={action} className="space-y-4">
        {state.error && <Alert>{state.error}</Alert>}
        <input type="hidden" name="routineId" value={routineId} />
        {task && <input type="hidden" name="taskId" value={task.id} />}
        <Field label={t("parent.routines.editor.title")} htmlFor="t-title" error={fe.title}>
          <Input id="t-title" name="title" defaultValue={task?.title} required maxLength={60} placeholder={t("parent.routines.editor.titlePh")} />
        </Field>
        <Field label={t("parent.routines.editor.description")} htmlFor="t-desc" error={fe.description}>
          <Textarea id="t-desc" name="description" defaultValue={task?.description ?? ""} maxLength={200} />
        </Field>
        <IconField name="icon" defaultValue={task?.icon ?? "⭐"} error={fe.icon} />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("parent.routines.editor.time")} htmlFor="t-time" error={fe.time}>
            <Input id="t-time" name="time" type="time" defaultValue={task?.time ?? ""} />
          </Field>
          <Field label={t("parent.routines.editor.type")} htmlFor="t-kind">
            <Select id="t-kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
              {Object.entries(t.messages.kinds).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {kind === "PRAYER" && (
          <Field label={t("parent.routines.editor.prayer")} htmlFor="t-prayer">
            <Select id="t-prayer" name="prayerName" defaultValue={task?.prayerName ?? ""}>
              <option value="">—</option>
              {["FAJR", "DHUHR", "ASR", "MAGHRIB", "ISHA"].map((p) => (
                <option key={p} value={p}>
                  {t.dyn(`prayers.${p}`, p)}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {kind === "QURAN" && (
          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-[#ecfbf3] p-3">
            <Field label={t("parent.routines.editor.minutes")} htmlFor="t-qm" error={fe.quranMinutes}>
              <Input id="t-qm" name="quranMinutes" type="number" min={0} max={240} defaultValue={task?.quranMinutes ?? ""} />
            </Field>
            <Field label={t("parent.routines.editor.pages")} htmlFor="t-qp" error={fe.quranPages}>
              <Input id="t-qp" name="quranPages" type="number" min={0} max={100} defaultValue={task?.quranPages ?? ""} />
            </Field>
            <Field label={t("parent.routines.editor.surah")} htmlFor="t-qs" error={fe.quranSurah}>
              <Input id="t-qs" name="quranSurah" defaultValue={task?.quranSurah ?? ""} placeholder={t("parent.routines.editor.surahPh")} />
            </Field>
          </div>
        )}

        <Field label={t("parent.routines.editor.rewardLevel")} htmlFor="t-diff">
          <Select
            id="t-diff"
            name="difficulty"
            defaultValue={task?.difficulty ?? "NORMAL"}
            onChange={(e) => {
              const p = DIFFICULTY_PRESETS[e.target.value as keyof typeof DIFFICULTY_PRESETS];
              setXp(p.xp);
              setCoins(p.coins);
            }}
          >
            {Object.entries(DIFFICULTY_PRESETS).map(([k, v]) => (
              <option key={k} value={k}>
                {t("parent.routines.editor.preset", { label: t.dyn(`difficulty.${k}`, v.label), xp: v.xp, coins: v.coins })}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("parent.routines.editor.xp")} htmlFor="t-xp" error={fe.xp}>
            <Input id="t-xp" name="xp" type="number" min={0} max={500} value={xp} onChange={(e) => setXp(Number(e.target.value))} />
          </Field>
          <Field label={t("parent.routines.editor.coins")} htmlFor="t-coins" error={fe.coins}>
            <Input id="t-coins" name="coins" type="number" min={0} max={200} value={coins} onChange={(e) => setCoins(Number(e.target.value))} />
          </Field>
        </div>
        <label className="flex items-center gap-3 text-sm font-bold">
          <input type="checkbox" name="isRequired" defaultChecked={task?.isRequired ?? true} className="size-5 accent-magic" />
          {t("parent.routines.editor.requiredLabel")}
        </label>
        <DaysField defaultMask={task?.daysMask ?? EVERY_DAY} error={fe.days} />
        <SubmitButton className="w-full">{t("parent.routines.editor.saveMission")}</SubmitButton>
      </form>
    </Modal>
  );
}
