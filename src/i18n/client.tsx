"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createTranslator, DEFAULT_LOCALE, type Locale, type Translator } from "./index";

const I18nCtx = createContext<Translator>(createTranslator(DEFAULT_LOCALE));

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = useMemo(() => createTranslator(locale), [locale]);
  return <I18nCtx.Provider value={t}>{children}</I18nCtx.Provider>;
}

/** Translator for client components. */
export function useT() {
  return useContext(I18nCtx);
}
