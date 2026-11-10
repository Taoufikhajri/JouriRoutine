"use client";

import Link from "next/link";
import { useActionState, useSyncExternalStore } from "react";
import { SubmitButton } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/form";
import { useT } from "@/i18n/client";
import { forgotPasswordAction, resetPasswordAction, signupAction } from "@/server/actions/auth";

const noopSubscribe = () => () => {};

export function SignupForm() {
  const t = useT();
  const [state, action] = useActionState(signupAction, {});
  const tz = useSyncExternalStore(
    noopSubscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    () => "UTC",
  );
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <h1 className="font-display text-2xl font-bold">{t("auth.signupTitle")}</h1>
      {state.error && <Alert>{state.error}</Alert>}
      <input type="hidden" name="timezone" value={tz} />
      <Field label={t("auth.displayName")} htmlFor="displayName" error={fe.displayName}>
        <Input id="displayName" name="displayName" autoComplete="name" required placeholder={t("auth.displayNamePh")} />
      </Field>
      <Field label={t("auth.email")} htmlFor="email" error={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label={t("auth.password")} htmlFor="password" error={fe.password} hint={t("auth.passwordHint")}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <SubmitButton size="lg" pop className="w-full">
        {t("auth.signup")}
      </SubmitButton>
      <p className="text-center text-sm font-semibold text-ink-soft">
        {t("auth.haveAccount")}{" "}
        <Link href="/login?as=parent" className="text-magic-dark hover:underline">
          {t("auth.parentLogin")}
        </Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const t = useT();
  const [state, action] = useActionState(forgotPasswordAction, {});
  const devLink = state.data?.devLink as string | undefined;
  return (
    <form action={action} className="space-y-4">
      <h1 className="font-display text-2xl font-bold">{t("auth.forgotTitle")}</h1>
      {state.error && <Alert>{state.error}</Alert>}
      {state.message && <Alert tone="success">{state.message}</Alert>}
      {devLink && (
        <Alert tone="info">
          🧪 {t("auth.devOnly")}:{" "}
          <a href={devLink} className="break-all underline">
            {t("auth.openResetLink")}
          </a>
        </Alert>
      )}
      <Field label={t("auth.email")} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <SubmitButton size="lg" pop className="w-full">
        {t("auth.sendLink")}
      </SubmitButton>
      <p className="text-center text-sm font-semibold">
        <Link href="/login?as=parent" className="text-magic-dark hover:underline">
          {t.dir === "rtl" ? "→" : "←"} {t("common.back")}
        </Link>
      </p>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const t = useT();
  const [state, action] = useActionState(resetPasswordAction, {});
  return (
    <form action={action} className="space-y-4">
      <h1 className="font-display text-2xl font-bold">{t("auth.resetTitle")}</h1>
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok ? (
        <>
          <Alert tone="success">{state.message}</Alert>
          <Link href="/login?as=parent" className="block text-center font-bold text-magic-dark hover:underline">
            {t("auth.parentLogin")} {t.dir === "rtl" ? "←" : "→"}
          </Link>
        </>
      ) : (
        <>
          <input type="hidden" name="token" value={token} />
          <Field label={t("auth.newPassword")} htmlFor="password" error={state.fieldErrors?.password}>
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          </Field>
          <SubmitButton size="lg" pop className="w-full">
            {t("common.save")}
          </SubmitButton>
        </>
      )}
    </form>
  );
}
