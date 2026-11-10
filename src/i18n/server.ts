import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { getSession } from "@/server/auth/session";
import { DEFAULT_LOCALE, LOCALE_COOKIE, createTranslator, isLocale, type Locale } from "./index";

/**
 * Locale resolution: signed-in family's language → language cookie
 * (login-page switcher) → browser Accept-Language → English.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const s = await getSession();
  const familyLocale = s?.user.parentProfile?.family.locale ?? s?.user.childProfile?.family.locale;
  if (isLocale(familyLocale)) return familyLocale;

  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;

  const accept = (await headers()).get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
});

export const getT = cache(async () => createTranslator(await getLocale()));
