import { translateContent } from "./content";
import { ar } from "./messages/ar";
import { en, type Messages } from "./messages/en";
import { fr } from "./messages/fr";

export const LOCALES = {
  en: { label: "English", dir: "ltr", intl: "en" },
  fr: { label: "Français", dir: "ltr", intl: "fr" },
  // Western digits keep numbers, times and the PIN pad consistent for young readers.
  ar: { label: "العربية", dir: "rtl", intl: "ar-u-nu-latn" },
} as const;

export type Locale = keyof typeof LOCALES;
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "lsa_locale";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && v in LOCALES;
}

const dictionaries: Record<Locale, Messages> = { en, fr, ar };

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;
type Paths<T> = T extends string
  ? never
  : T extends readonly string[]
    ? never
    : { [K in keyof T & string]: T[K] extends string ? K : Join<K, Paths<T[K]>> }[keyof T & string];

export type MessageKey = Paths<Messages>;
type Vars = Record<string, string | number>;

function lookup(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}

function fill(raw: string, vars?: Vars) {
  return vars ? raw.replace(/\{(\w+)\}/g, (_, v: string) => String(vars[v] ?? `{${v}}`)) : raw;
}

export function createTranslator(locale: Locale = DEFAULT_LOCALE) {
  const dict = dictionaries[locale] ?? en;
  const meta = LOCALES[locale] ?? LOCALES.en;

  /** Dynamic lookup with a fallback (for keys built at runtime, e.g. badge keys). */
  const dyn = (key: string, fallback: string, vars?: Vars): string => {
    const raw = lookup(dict, key) ?? lookup(en, key);
    return fill(typeof raw === "string" ? raw : fallback, vars);
  };

  const t = (key: MessageKey, vars?: Vars): string => dyn(key, key, vars);

  return Object.assign(t, {
    locale,
    dir: meta.dir,
    intl: meta.intl,
    messages: dict,
    dyn,
    level: (n: number) => dyn(`levels.${n}`, `Level ${n}`),
    category: (c: string) => dyn(`categories.${c}`, c),
    stage: (k: string, fallback: string) => dyn(`stages.${k}`, fallback),
    avatar: (k: string, fallback = k) => dyn(`avatars.${k}`, fallback),
    item: (k: string, fallback = k) => dyn(`items.${k}`, fallback),
    badge: (k: string, fallback: { title: string; description: string }) => ({
      title: dyn(`badges.${k}.title`, fallback.title),
      description: dyn(`badges.${k}.description`, fallback.description),
    }),
    /** Ready-made content strings (template mission titles, default rewards). */
    content: (text: string) => translateContent(text, locale),
    /** "07:15" → locale-formatted time. */
    time: (hhmm: string | null | undefined) => {
      if (!hhmm) return null;
      const [h, m] = hhmm.split(":").map(Number);
      return new Intl.DateTimeFormat(meta.intl, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
    },
    date: (d: Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) => new Intl.DateTimeFormat(meta.intl, opts).format(d),
    /** Week-day bitmask → "Every day", "Mon–Fri", "Mon, Wed"… */
    mask: (mask: number) => {
      if (mask === 0b1111111) return dict.mask.every;
      if (mask === 0b0111110) return dict.mask.weekdays;
      if (mask === 0b1000001) return dict.mask.weekends;
      if (mask === 0) return dict.mask.never;
      return [1, 2, 3, 4, 5, 6, 0]
        .filter((d) => (mask & (1 << d)) !== 0)
        .map((d) => dict.days[d])
        .join(meta.dir === "rtl" ? "، " : ", ");
    },
    /** Translate a validation message that is an i18n key ("errors.required"). */
    error: (msg: string) => (msg.startsWith("errors.") ? dyn(msg, msg) : dyn("errors.invalid", msg)),
  });
}

export type Translator = ReturnType<typeof createTranslator>;
