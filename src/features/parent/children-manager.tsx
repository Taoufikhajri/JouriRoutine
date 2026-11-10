"use client";

import { useActionState, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, SubmitButton } from "@/components/ui/button";
import { Alert, Field, Input, Select } from "@/components/ui/form";
import { AvatarView } from "@/features/avatar/avatar-view";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { addChildAction, deleteChildAction, deleteMemorizationAction, saveMemorizationAction, updateChildAction } from "@/server/actions/parent-family";
import { AVATARS } from "@/server/catalog/avatars";

interface Kid {
  id: string;
  name: string;
  age: number | null;
  avatarKey: string;
  loginMode: "PIN" | "PASSWORD";
  quran: { id: string; surah: string; progress: number }[];
}

export function AvatarPicker({ name, defaultValue }: { name: string; defaultValue: string }) {
  const t = useT();
  const [v, setV] = useState(defaultValue);
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-bold">{t("parent.children.character")}</legend>
      <input type="hidden" name={name} value={v} />
      <div className="flex flex-wrap gap-2">
        {AVATARS.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setV(a.key)}
            aria-pressed={v === a.key}
            aria-label={t.avatar(a.key, a.name)}
            className={cn("rounded-full p-1 ring-4", v === a.key ? "ring-magic" : "ring-transparent")}
          >
            <AvatarView avatarKey={a.key} size="sm" />
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function ChildrenManager({ kids, templates }: { kids: Kid[]; templates: { key: string; name: string }[] }) {
  const t = useT();
  const [adding, setAdding] = useState(kids.length === 0);
  return (
    <div className="space-y-5">
      {kids.map((k) => (
        <ChildCard key={k.id} kid={k} />
      ))}
      {adding ? (
        <AddChild templates={templates} onDone={() => setAdding(false)} />
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>
          <Plus className="size-4" /> {t("parent.children.addAnother")}
        </Button>
      )}
    </div>
  );
}

function ChildCard({ kid }: { kid: Kid }) {
  const t = useT();
  const [state, action] = useActionState(updateChildAction, {});
  const [mode, setMode] = useState(kid.loginMode);
  const [pending, start] = useTransition();
  const fe = state.fieldErrors ?? {};
  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <AvatarView avatarKey={kid.avatarKey} size="md" />
        <h2 className="flex-1 font-display text-2xl font-extrabold">{kid.name}</h2>
        <button
          type="button"
          className="rounded-lg p-2 text-coral hover:bg-coral/10"
          aria-label={t("parent.children.deleteAria", { name: kid.name })}
          disabled={pending}
          onClick={() => confirm(t("parent.children.confirmDelete", { name: kid.name })) && start(() => deleteChildAction(kid.id))}
        >
          <Trash2 className="size-5" />
        </button>
      </div>
      <form action={action} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="childId" value={kid.id} />
        {state.error && <div className="md:col-span-2"><Alert>{state.error}</Alert></div>}
        {state.ok && <div className="md:col-span-2"><Alert tone="success">{state.message}</Alert></div>}
        <Field label={t("parent.children.nameLogin")} htmlFor={`n-${kid.id}`} error={fe.name}>
          <Input id={`n-${kid.id}`} name="name" defaultValue={kid.name} required maxLength={30} />
        </Field>
        <Field label={t("parent.children.age")} htmlFor={`a-${kid.id}`} error={fe.age}>
          <Input id={`a-${kid.id}`} name="age" type="number" min={2} max={17} defaultValue={kid.age ?? ""} />
        </Field>
        <div className="md:col-span-2">
          <AvatarPicker name="avatarKey" defaultValue={kid.avatarKey} />
        </div>
        <Field label={t("parent.children.loginWith")} htmlFor={`m-${kid.id}`}>
          <Select id={`m-${kid.id}`} name="loginMode" value={mode} onChange={(e) => setMode(e.target.value as Kid["loginMode"])}>
            <option value="PIN">{t("parent.children.loginPin")}</option>
            <option value="PASSWORD">{t("parent.children.loginPassword")}</option>
          </Select>
        </Field>
        {mode === "PIN" ? (
          <Field label={t("parent.children.newPin")} htmlFor={`p-${kid.id}`} error={fe.pin}>
            <Input id={`p-${kid.id}`} name="pin" inputMode="numeric" pattern="\d{4}" maxLength={4} placeholder="••••" autoComplete="off" />
          </Field>
        ) : (
          <Field label={t("parent.children.newPassword")} htmlFor={`pw-${kid.id}`} error={fe.password}>
            <input type="hidden" name="pin" value="" />
            <Input id={`pw-${kid.id}`} name="password" type="password" autoComplete="new-password" />
          </Field>
        )}
        {mode === "PASSWORD" ? null : <input type="hidden" name="password" value="" />}
        <div className="md:col-span-2">
          <SubmitButton>{t("parent.children.saveChanges")}</SubmitButton>
        </div>
      </form>
      <Memorization kid={kid} />
    </section>
  );
}

function Memorization({ kid }: { kid: Kid }) {
  const t = useT();
  const [pending, start] = useTransition();
  const [surah, setSurah] = useState("");
  return (
    <div className="mt-6 border-t border-ink/5 pt-4">
      <h3 className="font-display text-lg font-extrabold">{t("parent.children.memorization")}</h3>
      <ul className="mt-2 space-y-2">
        {kid.quran.map((q) => (
          <li key={q.id} className="flex items-center gap-3">
            <span className="w-28 truncate text-sm font-bold">{q.surah}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              defaultValue={q.progress}
              aria-label={t("parent.children.progressAria", { name: q.surah })}
              className="flex-1 accent-mint"
              onPointerUp={(e) => start(() => saveMemorizationAction(kid.id, q.surah, Number((e.target as HTMLInputElement).value)))}
              onKeyUp={(e) => start(() => saveMemorizationAction(kid.id, q.surah, Number((e.target as HTMLInputElement).value)))}
            />
            <span className="w-12 text-end text-sm font-bold">{q.progress}%</span>
            <button type="button" aria-label={t("parent.children.remove", { name: q.surah })} className="rounded p-1 text-ink-soft hover:bg-ink/5" disabled={pending} onClick={() => start(() => deleteMemorizationAction(q.id))}>
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!surah.trim()) return;
          start(async () => {
            await saveMemorizationAction(kid.id, surah.trim(), 0);
            setSurah("");
          });
        }}
      >
        <Input value={surah} onChange={(e) => setSurah(e.target.value)} placeholder={t("parent.children.addSurahPh")} aria-label={t("parent.children.surahName")} className="h-10" maxLength={40} />
        <Button type="submit" size="sm" disabled={pending}>
          {t("common.add")}
        </Button>
      </form>
    </div>
  );
}

function AddChild({ templates, onDone }: { templates: { key: string; name: string }[]; onDone: () => void }) {
  const t = useT();
  const [state, action] = useActionState(addChildAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <section className="rounded-3xl border-2 border-dashed border-magic/30 bg-white p-5">
      <h2 className="mb-3 font-display text-xl font-extrabold">{t("parent.children.addTitle")}</h2>
      <form action={action} className="grid gap-4 md:grid-cols-2">
        {state.error && <div className="md:col-span-2"><Alert>{state.error}</Alert></div>}
        {state.ok && (
          <div className="md:col-span-2">
            <Alert tone="success">{state.message}</Alert>
          </div>
        )}
        <Field label={t("parent.children.name")} htmlFor="new-name" error={fe.name}>
          <Input id="new-name" name="name" required maxLength={30} />
        </Field>
        <Field label={t("parent.children.age")} htmlFor="new-age" error={fe.age}>
          <Input id="new-age" name="age" type="number" min={2} max={17} />
        </Field>
        <div className="md:col-span-2">
          <AvatarPicker name="avatarKey" defaultValue="explorer" />
        </div>
        <Field label={t("parent.children.pin")} htmlFor="new-pin" error={fe.pin}>
          <Input id="new-pin" name="pin" inputMode="numeric" pattern="\d{4}" maxLength={4} required autoComplete="off" />
        </Field>
        <Field label={t("parent.children.startWith")} htmlFor="new-tpl">
          <Select id="new-tpl" name="template" defaultValue="muslim-daily">
            <option value="">{t("parent.children.noRoutine")}</option>
            {templates.map((tpl) => (
              <option key={tpl.key} value={tpl.key}>
                {t.dyn(`templates.${tpl.key}.name`, tpl.name)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex gap-2 md:col-span-2">
          <SubmitButton>{t("parent.children.addChild")}</SubmitButton>
          <Button type="button" variant="ghost" onClick={onDone}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </section>
  );
}
