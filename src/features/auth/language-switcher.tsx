"use client";

import { useTransition } from "react";
import { LOCALES, type Locale } from "@/i18n";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { setLocaleAction } from "@/server/actions/auth";

/** Big, flag-free language chips for the signed-out pages. */
export function LanguageSwitcher() {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <div role="group" aria-label={t("common.language")} className="flex justify-center gap-1.5">
      {(Object.keys(LOCALES) as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          disabled={pending}
          aria-pressed={t.locale === l}
          onClick={() => start(() => setLocaleAction(l))}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-bold shadow-soft transition-colors",
            t.locale === l ? "bg-magic text-white" : "bg-white/85 text-ink hover:bg-white",
          )}
        >
          {LOCALES[l].label}
        </button>
      ))}
    </div>
  );
}
