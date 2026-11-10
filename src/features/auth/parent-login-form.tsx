"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/form";
import { useT } from "@/i18n/client";
import { parentLoginAction } from "@/server/actions/auth";

export function ParentLoginForm() {
  const t = useT();
  const [state, action] = useActionState(parentLoginAction, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      <Field label={t("auth.email")} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label={t("auth.password")} htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton size="lg" pop className="w-full">
        {t("auth.parentLogin")}
      </SubmitButton>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
        <Link href="/forgot-password" className="text-magic-dark underline-offset-2 hover:underline">
          {t("auth.forgot")}
        </Link>
        <span className="text-ink-soft">
          {t("auth.noAccount")}{" "}
          <Link href="/signup" className="text-magic-dark underline-offset-2 hover:underline">
            {t("auth.createAccount")}
          </Link>
        </span>
      </div>
      {process.env.NODE_ENV !== "production" && (
        <p className="rounded-xl bg-sun/20 px-3 py-2 text-xs font-semibold text-ink-soft">
          🧪 {t("auth.devOnly")}: parent@example.com · DemoParent123!
        </p>
      )}
    </form>
  );
}
