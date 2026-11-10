"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useState, useTransition } from "react";
import { Mascot } from "@/components/brand/mascot";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/form";
import { AvatarView } from "@/features/avatar/avatar-view";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { completeOnboardingAction, openKidModeAction, skipOnboardingAction } from "@/server/actions/parent-family";
import { AVATARS } from "@/server/catalog/avatars";
import type { TemplateKey } from "@/server/catalog/templates";

interface Props {
  defaultFamilyName: string;
  templates: { key: TemplateKey; name: string; icon: string; description: string }[];
  rewards: readonly { title: string; icon: string; cost: number }[];
}

const STEPS = ["family", "child", "routine", "rewards", "start"] as const;

export function OnboardingWizard({ defaultFamilyName, templates, rewards }: Props) {
  const router = useRouter();
  const t = useT();
  const [step, setStep] = useState(0);
  const [familyName, setFamilyName] = useState(defaultFamilyName);
  const [childName, setChildName] = useState("");
  const [age, setAge] = useState("7");
  const [avatarKey, setAvatarKey] = useState<string>("explorer");
  const [pin, setPin] = useState("");
  const [picked, setPicked] = useState<Set<TemplateKey>>(new Set(["muslim-daily", "weekend"]));
  const [rewardIdx, setRewardIdx] = useState<Set<number>>(new Set(rewards.map((_, i) => i)));
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const canNext =
    (step === 0 && familyName.trim()) ||
    (step === 1 && childName.trim() && /^\d{4}$/.test(pin) && Number(age) >= 2) ||
    (step === 2 && picked.size > 0) ||
    step === 3;

  const toggle = <T,>(set: Set<T>, v: T) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    return n;
  };

  const finish = () =>
    start(async () => {
      setError(null);
      const r = await completeOnboardingAction({
        familyName,
        childName,
        age: Number(age),
        avatarKey,
        pin,
        templates: [...picked],
        rewards: [...rewardIdx],
      });
      if (r.ok) {
        setDone(true);
        setStep(4);
      } else setError(r.error ?? t("common.somethingWrong"));
    });

  return (
    <div className="card-magic p-5 sm:p-8">
      <ol className="mb-6 flex items-center gap-1" aria-label={t("parent.onboarding.stepsLabel")}>
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col items-center gap-1">
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-extrabold",
                i < step ? "bg-mint text-white" : i === step ? "bg-magic text-white" : "bg-ink/10 text-ink-soft",
              )}
              aria-current={i === step ? "step" : undefined}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span className="text-[11px] font-bold text-ink-soft">{t(`parent.onboarding.steps.${s}`)}</span>
          </li>
        ))}
      </ol>

      {error && <Alert>{error}</Alert>}

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        {step === 0 && (
          <>
            <h1 className="font-display text-2xl font-extrabold">{t("parent.onboarding.familyTitle")}</h1>
            <Field label={t("parent.onboarding.familyName")} htmlFor="ob-fam">
              <Input id="ob-fam" value={familyName} onChange={(e) => setFamilyName(e.target.value)} maxLength={50} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="font-display text-2xl font-extrabold">{t("parent.onboarding.childTitle")}</h1>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("parent.onboarding.name")} htmlFor="ob-name" hint={t("parent.onboarding.nameHint")}>
                <Input id="ob-name" value={childName} onChange={(e) => setChildName(e.target.value)} maxLength={30} placeholder={t("parent.onboarding.namePh")} />
              </Field>
              <Field label={t("parent.onboarding.age")} htmlFor="ob-age">
                <Input id="ob-age" type="number" min={2} max={17} value={age} onChange={(e) => setAge(e.target.value)} />
              </Field>
            </div>
            <fieldset>
              <legend className="mb-1.5 text-sm font-bold">{t("parent.onboarding.character")}</legend>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setAvatarKey(a.key)}
                    aria-pressed={avatarKey === a.key}
                    aria-label={t.avatar(a.key, a.name)}
                    className={cn("rounded-full p-1 ring-4", avatarKey === a.key ? "ring-magic" : "ring-transparent")}
                  >
                    <AvatarView avatarKey={a.key} size="sm" />
                  </button>
                ))}
              </div>
            </fieldset>
            <Field label={t("parent.onboarding.pin")} htmlFor="ob-pin" hint={t("parent.onboarding.pinHint")}>
              <Input id="ob-pin" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} autoComplete="off" />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-display text-2xl font-extrabold">{t("parent.onboarding.routineTitle")}</h1>
            <p className="text-sm text-ink-soft">{t("parent.onboarding.routineHint")}</p>
            <ul className="space-y-2">
              {templates.map((tpl) => (
                <li key={tpl.key}>
                  <label className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3", picked.has(tpl.key) ? "border-magic bg-lilac/15" : "border-ink/10")}>
                    <input type="checkbox" checked={picked.has(tpl.key)} onChange={() => setPicked((s) => toggle(s, tpl.key))} className="size-5 accent-magic" />
                    <span className="text-3xl" aria-hidden>
                      {tpl.icon}
                    </span>
                    <span>
                      <span className="block font-bold">{t.dyn(`templates.${tpl.key}.name`, tpl.name)}</span>
                      <span className="block text-xs text-ink-soft">{t.dyn(`templates.${tpl.key}.description`, tpl.description)}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="font-display text-2xl font-extrabold">{t("parent.onboarding.rewardsTitle")}</h1>
            <p className="text-sm text-ink-soft">{t("parent.onboarding.rewardsHint")}</p>
            <ul className="grid grid-cols-2 gap-2">
              {rewards.map((r, i) => (
                <li key={r.title}>
                  <label className={cn("flex cursor-pointer items-center gap-2 rounded-2xl border-2 p-2.5", rewardIdx.has(i) ? "border-magic bg-lilac/15" : "border-ink/10")}>
                    <input type="checkbox" checked={rewardIdx.has(i)} onChange={() => setRewardIdx((s) => toggle(s, i))} className="size-4 accent-magic" />
                    <span className="text-2xl" aria-hidden>
                      {r.icon}
                    </span>
                    <span className="min-w-0 text-sm">
                      <span className="block truncate font-bold">{t.content(r.title)}</span>
                      <span className="text-xs text-ink-soft">🪙 {r.cost}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}

        {step === 4 && done && (
          <div className="text-center">
            <Mascot className="mx-auto size-24 animate-bob" mood="wow" />
            <h1 className="mt-2 font-display text-3xl font-extrabold">{t("parent.onboarding.doneTitle")}</h1>
            <p className="mt-1 text-ink-soft">{t("parent.onboarding.doneBody", { name: childName })}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <form action={openKidModeAction}>
                <Button type="submit" size="lg" variant="sun" pop className="w-full">
                  {t("parent.onboarding.start")}
                </Button>
              </form>
              <Button size="lg" variant="outline" onClick={() => router.push("/parent")}>
                {t("parent.onboarding.dashboard")}
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {!done && (
        <div className="mt-6 flex items-center justify-between gap-2">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              {t.dir === "rtl" ? "→" : "←"} {t("common.back")}
            </Button>
          ) : (
            <form action={skipOnboardingAction}>
              <button type="submit" className="text-sm font-bold text-ink-soft underline">
                {t("parent.onboarding.skip")}
              </button>
            </form>
          )}
          {step < 3 ? (
            <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              {t("parent.onboarding.next")} {t.dir === "rtl" ? "←" : "→"}
            </Button>
          ) : (
            <Button variant="mint" loading={pending} onClick={finish}>
              {t("parent.onboarding.create")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
