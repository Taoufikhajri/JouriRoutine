"use client";

import { useActionState, useSyncExternalStore, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button, SubmitButton } from "@/components/ui/button";
import { Alert, Field, Input, Select } from "@/components/ui/form";
import { LOCALES, type Locale } from "@/i18n";
import { useT } from "@/i18n/client";
import { changePasswordAction, regenerateFamilyCodeAction, updateFamilyAction } from "@/server/actions/parent-family";


const noopSubscribe = () => () => {};
let cachedZones: string[] | null = null;
const clientZones = () => (cachedZones ??= typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"]);
const NO_ZONES: string[] = [];
const serverZones = () => NO_ZONES;

export function SettingsForms({ family, email }: { family: { name: string; timezone: string; soundEnabled: boolean; loginCode: string; locale: Locale }; email: string }) {
  const t = useT();
  const [fState, fAction] = useActionState(updateFamilyAction, {});
  const [pState, pAction] = useActionState(changePasswordAction, {});
  const [pending, start] = useTransition();
  const zones = useSyncExternalStore(noopSubscribe, clientZones, serverZones);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-3xl bg-white p-5 shadow-soft">
        <h2 className="mb-3 font-display text-lg font-extrabold">{t("parent.settings.family")}</h2>
        <form action={fAction} className="space-y-4">
          {fState.error && <Alert>{fState.error}</Alert>}
          {fState.ok && <Alert tone="success">{fState.message}</Alert>}
          <Field label={t("parent.settings.familyName")} htmlFor="fam-name">
            <Input id="fam-name" name="name" defaultValue={family.name} required maxLength={50} />
          </Field>
          <Field label={`🌍 ${t("common.language")}`} htmlFor="fam-lang" hint={t("parent.settings.languageHint")}>
            <Select id="fam-lang" name="locale" defaultValue={family.locale}>
              {(Object.keys(LOCALES) as Locale[]).map((l) => (
                <option key={l} value={l}>
                  {LOCALES[l].label}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-3 text-sm font-bold">
            <input type="checkbox" name="translateContent" defaultChecked className="size-5 accent-magic" />
            {t("parent.settings.translateContent")}
          </label>
          <Field label={t("parent.settings.timezone")} htmlFor="fam-tz">
            <Input id="fam-tz" name="timezone" defaultValue={family.timezone} list="tz-list" required />
            <datalist id="tz-list">
              {zones.map((tz) => (
                <option key={tz} value={tz} />
              ))}
            </datalist>
          </Field>
          <label className="flex items-center gap-3 text-sm font-bold">
            <input type="checkbox" name="soundEnabled" defaultChecked={family.soundEnabled} className="size-5 accent-magic" />
            {t("parent.settings.sound")}
          </label>
          <SubmitButton>{t("common.save")}</SubmitButton>
        </form>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft">
        <h2 className="mb-1 font-display text-lg font-extrabold">{t("parent.settings.code")}</h2>
        <p className="text-sm text-ink-soft">{t("parent.settings.codeHint")}</p>
        <p className="my-4 rounded-2xl bg-lilac/20 py-4 text-center font-display text-3xl font-extrabold tracking-widest" dir="ltr">{family.loginCode}</p>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => confirm(t("parent.settings.confirmNewCode")) && start(() => regenerateFamilyCodeAction())}
        >
          <RefreshCw className="size-4" /> {t("parent.settings.newCode")}
        </Button>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft">
        <h2 className="mb-3 font-display text-lg font-extrabold">{t("parent.settings.password")}</h2>
        <p className="mb-3 text-sm text-ink-soft">{t("parent.settings.signedInAs", { email })}</p>
        <form action={pAction} className="space-y-4">
          {pState.error && <Alert>{pState.error}</Alert>}
          {pState.ok && <Alert tone="success">{pState.message}</Alert>}
          <Field label={t("parent.settings.current")} htmlFor="pw-cur" error={pState.fieldErrors?.current}>
            <Input id="pw-cur" name="current" type="password" autoComplete="current-password" required />
          </Field>
          <Field label={t("parent.settings.next")} htmlFor="pw-new" error={pState.fieldErrors?.next} hint={t("auth.passwordHint")}>
            <Input id="pw-new" name="next" type="password" autoComplete="new-password" required minLength={8} />
          </Field>
          <SubmitButton>{t("parent.settings.changePassword")}</SubmitButton>
        </form>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-soft">
        <h2 className="mb-2 font-display text-lg font-extrabold">{t("parent.settings.privacy")}</h2>
        <ul className="list-disc space-y-1 ps-5 text-sm text-ink-soft">
          <li>{t("parent.settings.privacy1")}</li>
          <li>{t("parent.settings.privacy2")}</li>
          <li>{t("parent.settings.privacy3")}</li>
          <li>{t("parent.settings.privacy4")}</li>
        </ul>
      </section>
    </div>
  );
}
